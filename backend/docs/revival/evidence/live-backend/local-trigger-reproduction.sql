-- SYNTHETIC LOCAL TEST ONLY. Never execute against the linked Supabase project.
\set ON_ERROR_STOP on

CREATE TABLE profiles(id bigint PRIMARY KEY,user_id bigint,coach bigint);
CREATE TABLE user_programs(id bigint PRIMARY KEY,client_id bigint,trainer_id bigint,program_id bigint,workouts json[],status text,latest_start timestamptz,months_package int,expires_on timestamptz,sets_muscle jsonb);
CREATE TABLE programs(id bigint PRIMARY KEY,trainer_id bigint,workouts json[]);
CREATE TABLE workout_sheets(id bigserial PRIMARY KEY,client_id bigint,user_program_id bigint,iteration int,done bool,week_of_program int DEFAULT 1,previous_id int,exercises json[],average_intensity numeric,average_volume numeric,created_at timestamptz DEFAULT now(),workout_summary text);
CREATE TABLE debug_logs(id bigserial PRIMARY KEY,message text);
CREATE TABLE notifications(id bigserial PRIMARY KEY,user_id bigint,title text,body text,created_at timestamptz);
CREATE TABLE weights(id bigserial PRIMARY KEY,profile_id bigint,created_at timestamptz DEFAULT now(),previous bigint);
CREATE TABLE entitlements(id bigint PRIMARY KEY,status text,start_date timestamp,end_date timestamp,client_email text);
INSERT INTO profiles VALUES (1,1,10),(2,2,10);
INSERT INTO user_programs(id,client_id,status,workouts) VALUES (1,1,'active',ARRAY['{"exercises":[]}'::json]);
CREATE OR REPLACE FUNCTION public.workout_new_iteration()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
  existing_id INTEGER;
  iteration_index INTEGER;
  week_count INTEGER;
  last_workout_sheet_id INTEGER;
  exercise_item JSON;
  true_set_item JSON;
  total_weight_done NUMERIC := 0;
  total_reps_done NUMERIC := 0;
  total_sets INTEGER := 0;
BEGIN
  -- Debug message
  RAISE NOTICE 'Trigger activated for client_id: %, iteration: %', NEW.client_id, NEW.iteration;

  -- Check if the workout already exists
  SELECT id INTO existing_id
  FROM workout_sheets
  WHERE client_id = NEW.client_id
    AND iteration = NEW.iteration
    AND done = false
  LIMIT 1;

  IF FOUND THEN
    RAISE NOTICE 'Workout already exists, modifying NEW to return the existing row instead of inserting.';
    RETURN NEW;  -- Prevent the actual insert
  END IF;

  -- Query to count rows with the same iteration value
  SELECT COUNT(*) INTO week_count
  FROM workout_sheets
  WHERE iteration = NEW.iteration;

  NEW.week_of_program := week_count + 1;

  -- Find the last workout sheet for this user_program
  SELECT id INTO last_workout_sheet_id
  FROM workout_sheets
  WHERE user_program_id = NEW.user_program_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_workout_sheet_id IS NULL THEN
    NEW.previous_id := NULL;
  ELSE
    NEW.previous_id := last_workout_sheet_id;
  END IF;

  -- Iterate through exercises and calculate volume/intensity
  FOR exercise_item IN
    SELECT unnest(NEW.exercises)
  LOOP
    FOR true_set_item IN
      SELECT * FROM json_array_elements(exercise_item->'true_sets')
    LOOP
      total_sets := total_sets + 1;
      total_weight_done := total_weight_done + ((true_set_item->>'weight_done')::numeric);
      total_reps_done := total_reps_done + ((true_set_item->>'reps_done')::numeric);
    END LOOP;
  END LOOP;

  IF total_sets > 0 THEN
    NEW.average_intensity := total_weight_done / total_sets;
    NEW.average_volume := total_sets * total_reps_done;
  ELSE
    NEW.average_intensity := 0;
    NEW.average_volume := 0;
  END IF;

  RETURN NEW;  -- Allow insertion if no duplicate exists
END;$function$
;
CREATE OR REPLACE FUNCTION public.delete_incomplete_workout_sheets()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Delete all workout_sheets where user_program_id matches and done is false
  DELETE FROM workout_sheets
  WHERE user_program_id = NEW.id AND done = false;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_program_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    v_user_id bigint;   -- <-- bigint now
begin
    select p.user_id
      into v_user_id
      from public.profiles p
     where p.id = new.client_id;   -- bigint = bigint

    if v_user_id is null then
        raise warning 'No user_id found for client_id %', new.client_id;
        return new;
    end if;

    insert into public.notifications (user_id, title, body, created_at)
    values (
        v_user_id,
        'Your workout plan has been updated.',
        'Open the app to see your new exercises and schedule 💪',
        now()
    );

    return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.apply_progression_on_workout_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
  orig_workouts   json[];
  workouts_jsonb  JSONB;
  exercises_jsonb JSONB;

  target_workout_jb JSONB;
  workout_entry_jb  JSONB;

  new_exercises_jb  JSONB := '[]'::jsonb;
  e_jb              JSONB;
  ts_jb             JSONB;

  expected_reps         INT;
  expected_intensity    NUMERIC;
  performed_reps        INT;
  performed_intensity   NUMERIC;
  all_higher            BOOLEAN;
  all_lower_reps        BOOLEAN;
  total_reps_lower      INT;
  one_set_off           BOOLEAN;
  new_intensity         NUMERIC;
  last_performed_reps   INT;
  last_performed_weight NUMERIC;

  i                     INT;
  updated_true_sets     JSONB;
  updated_workouts      json[];
BEGIN
  SELECT workouts INTO orig_workouts
  FROM user_programs
  WHERE id = NEW.user_program_id;

  SELECT jsonb_agg(to_jsonb(x::json)) INTO workouts_jsonb
  FROM unnest(orig_workouts) AS x;

  SELECT jsonb_agg(to_jsonb(x::json)) INTO exercises_jsonb
  FROM unnest(NEW.exercises) AS x;

  target_workout_jb := workouts_jsonb -> (NEW.iteration::int);

  IF target_workout_jb IS NULL THEN
    INSERT INTO debug_logs(message) VALUES (
      '[apply_progression] No workout at iteration ' || NEW.iteration || ' for program ' || NEW.user_program_id);
    RETURN NEW;
  END IF;

  INSERT INTO debug_logs(message) VALUES (
    '[apply_progression] Processing workout iteration ' || NEW.iteration || ' for program ' || NEW.user_program_id);

  FOR e_jb IN SELECT * FROM jsonb_array_elements(exercises_jsonb)
  LOOP
    all_higher := TRUE;
    all_lower_reps := TRUE;
    total_reps_lower := 0;
    one_set_off := FALSE;
    last_performed_reps := NULL;
    last_performed_weight := NULL;

    expected_reps := COALESCE((e_jb ->> 'reps')::int, 0);
    expected_intensity := COALESCE((e_jb ->> 'intensity')::numeric, 0);

    INSERT INTO debug_logs(message) VALUES (
      '[apply_progression] Exercise "' || (e_jb ->> 'exercise_name') ||
      '": expected reps=' || expected_reps || ', expected intensity=' || expected_intensity);

    i := 0;
    updated_true_sets := '[]';

    FOR ts_jb IN SELECT * FROM jsonb_array_elements(e_jb -> 'true_sets')
    LOOP
      performed_reps := COALESCE((ts_jb ->> 'reps_done')::int, 0);
      performed_intensity := COALESCE((ts_jb ->> 'weight_done')::numeric, 0);
      last_performed_reps := performed_reps;
      last_performed_weight := performed_intensity;

      INSERT INTO debug_logs(message) VALUES (
        '  Set: reps_done=' || performed_reps || ', weight_done=' || performed_intensity);

      IF performed_reps < expected_reps THEN
        total_reps_lower := total_reps_lower + 1;
      END IF;

      IF performed_reps < expected_reps OR performed_intensity < expected_intensity THEN
        one_set_off := TRUE;
        all_higher := FALSE;
      END IF;

      IF performed_reps >= expected_reps THEN
        all_lower_reps := FALSE;
      END IF;

      i := i + 1;
    END LOOP;

    new_intensity := expected_intensity;

    IF all_higher THEN
      new_intensity := ROUND(last_performed_weight * 1.05, 1);
      INSERT INTO debug_logs(message) VALUES (
        '[UPGRADE] "' || (e_jb ->> 'exercise_name') || '": all sets >= expected. ' ||
        expected_intensity || ' -> ' || new_intensity || ' (+5%)');

    ELSIF all_lower_reps
       AND total_reps_lower = jsonb_array_length(e_jb -> 'true_sets')
       AND (expected_reps - COALESCE(last_performed_reps, 0)) > 3
    THEN
      new_intensity := ROUND(expected_intensity * 0.95, 1);
      INSERT INTO debug_logs(message) VALUES (
        '[DOWNGRADE] "' || (e_jb ->> 'exercise_name') || '": all reps low (total_lower=' ||
        total_reps_lower || ', gap=' || (expected_reps - COALESCE(last_performed_reps, 0)) || '). ' ||
        expected_intensity || ' -> ' || new_intensity || ' (-5%)');

    ELSIF one_set_off THEN
      INSERT INTO debug_logs(message) VALUES (
        '[HOLD] "' || (e_jb ->> 'exercise_name') || '": one set off target. Intensity remains ' || expected_intensity);
      new_intensity := expected_intensity;

    ELSE
      new_intensity := GREATEST(expected_intensity, COALESCE(last_performed_weight, expected_intensity));
      INSERT INTO debug_logs(message) VALUES (
        '[MIXED] "' || (e_jb ->> 'exercise_name') || '": mixed results. Using GREATEST(' ||
        expected_intensity || ', ' || COALESCE(last_performed_weight, expected_intensity) ||
        ') = ' || new_intensity);
    END IF;

    -- Update each true_set's intensity
    FOR i IN 0 .. jsonb_array_length(e_jb -> 'true_sets') - 1
    LOOP
      e_jb := jsonb_set(e_jb, ARRAY['true_sets', i::text, 'intensity'], to_jsonb(new_intensity::text), true);
    END LOOP;

    -- Upfate modifiers
    IF (e_jb ->> 'intensity_mod') = 'RIR' THEN
      e_jb := jsonb_set(e_jb, '{intensity_mod}', to_jsonb('Load(KG)'::text), true);
      e_jb := jsonb_set(e_jb, '{volume_mod}', to_jsonb('reps'::text), true);
    END IF; 
  
    -- Log updated full exercise
    INSERT INTO debug_logs(message)
    VALUES ('[apply_progression] Updated exercise object: ' || e_jb::text);

    new_exercises_jb := new_exercises_jb || jsonb_build_array(e_jb);
  END LOOP;

  workout_entry_jb := jsonb_set(target_workout_jb, '{exercises}', new_exercises_jb, true);
  updated_workouts := orig_workouts;
  updated_workouts[NEW.iteration + 1] := workout_entry_jb::json;

  INSERT INTO debug_logs(message)
  VALUES ('[apply_progression] New workout for iteration ' || (NEW.iteration + 1) || ': ' ||
          workout_entry_jb::text);

  INSERT INTO debug_logs(message)
  VALUES ('[apply_progression] Updated workouts array: ' || array_to_string(updated_workouts::text[], ', '));

  UPDATE user_programs
  SET workouts = updated_workouts
  WHERE id = NEW.user_program_id;

  INSERT INTO debug_logs(message)
  VALUES ('[apply_progression] Workout updated at iteration ' || NEW.iteration);

  RETURN NEW;
END;$function$
;
CREATE OR REPLACE FUNCTION public."update previous weight"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
previous_id int8; 
begin

SELECT id
FROM weights
into previous_id
WHERE profile_id = new.profile_id
ORDER BY created_at DESC
LIMIT 1;

UPDATE weights
SET previous = previous_id
WHERE id = new.id;

return new;

end;$function$
;
CREATE OR REPLACE FUNCTION public."updateExpiry"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    -- Always update expires_on when inserting a new row or when latest_start changes
    IF TG_OP = 'INSERT' OR OLD.latest_start IS DISTINCT FROM NEW.latest_start THEN
        NEW.expires_on := NEW.latest_start + INTERVAL '1 month' * NEW.months_package;
    END IF;
    
    RETURN NEW;
END;$function$
;
CREATE OR REPLACE FUNCTION public."Start and end dates Entitlement"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Check if the status is being updated to 'active'
  IF NEW.status = 'active' THEN
    -- Set start_date to the current date
    NEW.start_date := CURRENT_DATE;
    -- Set end_date to one month later
    NEW.end_date := CURRENT_DATE + INTERVAL '1 month';
  END IF;
  
  RETURN NEW;
END;$function$
;
CREATE OR REPLACE FUNCTION public.fn_sync_sets_muscle()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
  workouts_json json;
  workout json;
  exercise json;
  muscle text;
  sets numeric;
  muscle_map jsonb := '{}'::jsonb;
  workout_sets jsonb;
  i int;
  j int;
begin
  -- Loop through each workout
  for i in array_lower(NEW.workouts, 1)..array_upper(NEW.workouts, 1) loop
    workouts_json := NEW.workouts[i]::json;

    -- Reset for each workout
    workout_sets := '{}'::jsonb;

    -- Loop through exercises inside the workout
    for j in 0..json_array_length(workouts_json->'exercises') - 1 loop
      exercise := (workouts_json->'exercises'->j);

      sets := (exercise->>'sets')::numeric;

      -- Prime movers
      if json_typeof(exercise->'prime') = 'array' then
        for muscle in select json_array_elements_text(exercise->'prime') loop
          -- Log
          RAISE NOTICE 'Prime: % gets % sets', muscle, sets;

          -- Add to local workout sets
          workout_sets := jsonb_set(
            workout_sets,
            ARRAY[muscle],
            to_jsonb(coalesce((workout_sets->>muscle)::numeric, 0) + sets),
            true
          );

          -- Add to global muscle map
          muscle_map := jsonb_set(
            muscle_map,
            ARRAY[muscle],
            to_jsonb(coalesce((muscle_map->>muscle)::numeric, 0) + sets),
            true
          );
        end loop;
      end if;

      -- Synergists
      if json_typeof(exercise->'synergist') = 'array' then
        for muscle in select json_array_elements_text(exercise->'synergist') loop
          -- Log
          RAISE NOTICE 'Synergist: % gets % sets', muscle, sets / 2;

          workout_sets := jsonb_set(
            workout_sets,
            ARRAY[muscle],
            to_jsonb(coalesce((workout_sets->>muscle)::numeric, 0) + (sets / 2)),
            true
          );

          muscle_map := jsonb_set(
            muscle_map,
            ARRAY[muscle],
            to_jsonb(coalesce((muscle_map->>muscle)::numeric, 0) + (sets / 2)),
            true
          );
        end loop;
      end if;
    end loop;

    -- Add sets_muscle to the current workout JSON
    workouts_json := (workouts_json::jsonb || jsonb_build_object('sets_muscle', workout_sets))::json;
NEW.workouts[i] := workouts_json::text;
  end loop;

  -- Assign global sets_muscle
  NEW.sets_muscle := (
    select jsonb_agg(jsonb_build_object('muscle', key, 'sets',  round(value::numeric, 1)))
from jsonb_each_text(muscle_map)
  );

  return NEW;
end;$function$
;
CREATE OR REPLACE FUNCTION public.copy_workouts_to_user_programs()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$begin
  -- Fetch program details from the programs table using the new program_id
  -- and assign trainer_id and workouts to the new row
  select trainer_id, workouts
  into new.trainer_id, new.workouts
  from programs
  where id = new.program_id;

  -- Return the new row with updated values
  return new;
end;$function$
;
CREATE TRIGGER "WorkoutSheetIteration" BEFORE INSERT ON workout_sheets FOR EACH ROW EXECUTE FUNCTION workout_new_iteration();
CREATE TRIGGER trigger_delete_incomplete_workouts AFTER UPDATE ON user_programs FOR EACH ROW EXECUTE FUNCTION delete_incomplete_workout_sheets();
CREATE TRIGGER trg_notify_program_update AFTER UPDATE ON user_programs FOR EACH ROW EXECUTE FUNCTION notify_program_update();
CREATE TRIGGER trg_apply_progression AFTER UPDATE ON workout_sheets FOR EACH ROW WHEN (new.done IS TRUE) EXECUTE FUNCTION apply_progression_on_workout_update();
CREATE TRIGGER "UpdatePreviousWeight" BEFORE INSERT ON weights FOR EACH ROW EXECUTE FUNCTION "update previous weight"();
CREATE TRIGGER "updateExpiryTrigger" BEFORE INSERT OR UPDATE ON user_programs FOR EACH ROW EXECUTE FUNCTION "updateExpiry"();
CREATE TRIGGER "StartEndDatesEntitlements" BEFORE UPDATE ON entitlements FOR EACH ROW EXECUTE FUNCTION "Start and end dates Entitlement"();

INSERT INTO workout_sheets(client_id,user_program_id,iteration,done,exercises) VALUES (1,1,0,false,ARRAY[]::json[]),(1,1,0,false,ARRAY[]::json[]);
DO $$BEGIN IF (SELECT count(*) FROM workout_sheets WHERE client_id=1)<>2 THEN RAISE EXCEPTION 'Expected duplicate insert reproduction'; END IF; END$$;
SELECT 'PASS A: duplicate guard returns NEW and admits both rows' AS result;
INSERT INTO workout_sheets(client_id,user_program_id,iteration,done,exercises) VALUES (2,1,0,false,ARRAY[]::json[]);
DO $$BEGIN IF (SELECT week_of_program FROM workout_sheets WHERE client_id=2)<>3 THEN RAISE EXCEPTION 'Expected cross-client week count'; END IF; END$$;
SELECT 'PASS B: another client first workout receives week 3 from global count' AS result;
UPDATE user_programs SET status=status WHERE id=1;
DO $$BEGIN IF (SELECT count(*) FROM workout_sheets)<>0 OR (SELECT count(*) FROM notifications)<>1 THEN RAISE EXCEPTION 'Expected deletion and notification on unrelated update'; END IF; END$$;
SELECT 'PASS C: no-op assignment status update deletes unfinished workouts and sends notification' AS result;
UPDATE user_programs SET workouts=ARRAY['{"exercises":[]}'::json] WHERE id=1;
TRUNCATE notifications;
INSERT INTO workout_sheets(client_id,user_program_id,iteration,done,exercises) VALUES (1,1,0,false,ARRAY['{"exercise_name":"Synthetic exercise","reps":10,"intensity":50,"true_sets":[{"reps_done":10,"weight_done":50}]}'::json]);
UPDATE workout_sheets SET done=true WHERE client_id=1;
UPDATE workout_sheets SET workout_summary='Synthetic note correction' WHERE client_id=1;
DO $$BEGIN IF (SELECT count(*) FROM notifications)<>2 THEN RAISE EXCEPTION 'Expected repeated progression/notification'; END IF; END$$;
SELECT 'PASS D: editing a completed session note replays progression and notifies again' AS result;
INSERT INTO weights(profile_id,created_at) VALUES(1,now()-interval '1 day'),(1,now());
DO $$BEGIN IF EXISTS(SELECT 1 FROM weights WHERE previous IS NOT NULL) THEN RAISE EXCEPTION 'Expected missing previous link'; END IF; END$$;
SELECT 'PASS E: BEFORE INSERT weight update cannot populate its not-yet-inserted row' AS result;
INSERT INTO user_programs(id,client_id,latest_start,months_package) VALUES(2,2,'2026-01-01Z',1);
UPDATE user_programs SET latest_start='2026-02-01Z' WHERE id=2;
DO $$BEGIN IF (SELECT expires_on FROM user_programs WHERE id=2)<>'2026-03-01Z'::timestamptz THEN RAISE EXCEPTION 'Expiry trigger did not work'; END IF; END$$;
SELECT 'PASS F: live expiry trigger advances expiry when latest_start changes (correction to repository-only uncertainty)' AS result;
INSERT INTO entitlements VALUES(1,'active','2000-01-01','2000-02-01','synthetic@example.invalid');
UPDATE entitlements SET client_email='changed@example.invalid' WHERE id=1;
DO $$BEGIN IF (SELECT start_date FROM entitlements WHERE id=1)<>CURRENT_DATE THEN RAISE EXCEPTION 'Expected entitlement date reset'; END IF; END$$;
SELECT 'PASS G: updating an already-active entitlement resets its access dates' AS result;
CREATE TRIGGER trg_user_program_sync_sets_muscle BEFORE INSERT OR UPDATE ON user_programs FOR EACH ROW EXECUTE FUNCTION fn_sync_sets_muscle();
CREATE TRIGGER trigger_copy_workouts BEFORE INSERT ON user_programs FOR EACH ROW EXECUTE FUNCTION copy_workouts_to_user_programs();
INSERT INTO programs VALUES(5,10,ARRAY['{"exercises":[]}'::json]);
DO $$DECLARE caught bool:=false; BEGIN BEGIN INSERT INTO user_programs(id,client_id,program_id) VALUES(3,1,5); EXCEPTION WHEN null_value_not_allowed THEN caught:=true; END; IF NOT caught THEN RAISE EXCEPTION 'Expected null-loop failure before plan copy'; END IF; END$$;
SELECT 'PASS H: derived-set trigger runs before plan-copy trigger and fails when workouts omitted' AS result;
