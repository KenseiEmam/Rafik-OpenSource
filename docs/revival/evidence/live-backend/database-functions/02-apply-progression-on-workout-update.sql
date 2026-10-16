-- Captured definition for audit reference; not a migration.
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
