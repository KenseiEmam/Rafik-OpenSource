-- READ-ONLY AUDIT SNAPSHOT: not an approved migration; contains current legacy behavior.
-- Public schema only; excludes application rows, Auth configuration and storage objects.


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."Start and end dates Entitlement"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Check if the status is being updated to 'active'
  IF NEW.status = 'active' THEN
    -- Set start_date to the current date
    NEW.start_date := CURRENT_DATE;
    -- Set end_date to one month later
    NEW.end_date := CURRENT_DATE + INTERVAL '1 month';
  END IF;
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."Start and end dates Entitlement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_progression_on_workout_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;


ALTER FUNCTION "public"."apply_progression_on_workout_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_domain_uniqueness"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- If the new record doesn't have domains, no check is needed.
  IF NEW.domains IS NULL OR cardinality(NEW.domains) = 0 THEN
    RETURN NEW;
  END IF;

  -- Check for any existing organization (other than the current one) that has overlapping domains
  SELECT count(*) INTO conflict_count
  FROM organizations
  WHERE id <> COALESCE(NEW.id, 0)
    AND domains && NEW.domains;

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'The provided domains conflict with an existing organization''s domains.';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_domain_uniqueness"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."copy_workouts_to_user_programs"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$begin
  -- Fetch program details from the programs table using the new program_id
  -- and assign trainer_id and workouts to the new row
  select trainer_id, workouts
  into new.trainer_id, new.workouts
  from programs
  where id = new.program_id;

  -- Return the new row with updated values
  return new;
end;$$;


ALTER FUNCTION "public"."copy_workouts_to_user_programs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_incomplete_workout_sheets"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Delete all workout_sheets where user_program_id matches and done is false
  DELETE FROM workout_sheets
  WHERE user_program_id = NEW.id AND done = false;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."delete_incomplete_workout_sheets"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_workout_sheet"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$begin
    -- Debugging: Print the values being inserted
    RAISE NOTICE 'Inserting workout for client_id: %, iteration: %', NEW.client_id, NEW.iteration;

    -- Check if the workout already exists
    if exists (
        select 1
        from workout_sheets
        where client_id = NEW.client_id
          and iteration = NEW.iteration
          and done = false
    ) then
        RAISE NOTICE 'Duplicate found for client_id: %, iteration: %', NEW.client_id, NEW.iteration;
        return null; -- Prevent duplicate insertion
    end if;

    -- If no duplicate, print a success notice for insertion
    RAISE NOTICE 'Inserting new workout for client_id: %, iteration: %', NEW.client_id, NEW.iteration;

    return NEW;
end;$$;


ALTER FUNCTION "public"."ensure_workout_sheet"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_kinda_similar_food"("input_query" "text") RETURNS TABLE("id" bigint, "normalized_query" "text", "response" "jsonb", "similarity" double precision)
    LANGUAGE "sql" STABLE
    AS $$SELECT id, normalized_query, response,
         similarity(normalized_query, input_query) AS similarity
  FROM food_cache
  WHERE similarity(normalized_query, input_query) > 0.7
  ORDER BY similarity DESC
  LIMIT 2;$$;


ALTER FUNCTION "public"."find_kinda_similar_food"("input_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_similar_food"("input_query" "text") RETURNS TABLE("id" bigint, "normalized_query" "text", "response" "jsonb", "similarity" double precision)
    LANGUAGE "sql" STABLE
    AS $$SELECT id, normalized_query, response,
         similarity(normalized_query, input_query) AS similarity
  FROM food_cache
  WHERE similarity(normalized_query, input_query) > 0.9
  ORDER BY similarity DESC
  LIMIT 1;$$;


ALTER FUNCTION "public"."find_similar_food"("input_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_sync_sets_muscle"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$declare
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
end;$$;


ALTER FUNCTION "public"."fn_sync_sets_muscle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_latest_group_messages"("group_ids" bigint[]) RETURNS TABLE("id" bigint, "group_id" bigint, "content" "text", "created_at" timestamp with time zone, "seen_at" timestamp with time zone, "media" "text"[], "sent_by" bigint, "sender_first_name" "text", "sender_last_name" "text", "sender_avatar" "text")
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select distinct on (cm.group)
    cm.id,
    cm.group,
    cm.content,
    cm.created_at,
    cm.seen_at,
    cm.media,
    cm.sent_by,
    u.first_name,
    u.last_name,
    u.avatar
  from chat_messages cm
  join users u on cm.sent_by = u.id
  where cm.group = any(group_ids)
  order by cm.group, cm.created_at desc;
end;
$$;


ALTER FUNCTION "public"."get_latest_group_messages"("group_ids" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_latest_messages2"("program_ids" integer[]) RETURNS TABLE("id" bigint, "user_program" bigint, "content" "text", "created_at" timestamp with time zone, "seen_at" timestamp with time zone, "media" "text"[], "sent_by" bigint, "form" bigint)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select distinct on (cm.user_program) 
    cm.id, 
    cm.user_program,
    cm.content,
    cm.created_at,
    cm.seen_at,
    cm.media,
    cm.sent_by,
    cm.form
  from
    chat_messages cm
  where
    cm.user_program = any(program_ids)
  order by
    cm.user_program, cm.created_at desc;
end;
$$;


ALTER FUNCTION "public"."get_latest_messages2"("program_ids" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_program_inductions"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  existing_inductions json[];  -- Declare as JSON array
  new_chat_id BIGINT;
  new_form_id BIGINT;
  client_user_id BIGINT;
BEGIN
  -- 1) Get the inductions from the programs row (as json[])
  SELECT p.inductions 
    INTO existing_inductions
    FROM programs p
   WHERE p.id = NEW.program_id;

  -- If inductions is NULL or empty, then skip
  IF existing_inductions IS NULL OR array_length(existing_inductions, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2) Get the actual user_id from the profiles table
  SELECT pr.user_id
    INTO client_user_id
    FROM profiles pr
   WHERE pr.id = NEW.client_id
   LIMIT 1;

  IF client_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 3) Create a new chat_message record for this user_program
  INSERT INTO chat_messages (user_program, sent_by)
       VALUES (NEW.id, NEW.trainer_id)
    RETURNING id INTO new_chat_id;

  -- 4) Create a new forms record referencing the new chat_message and using the inductions value
  INSERT INTO forms (message_id, program_id, questions, status, trainer_id, client_id, type)
       VALUES (
         new_chat_id,
         NEW.program_id,
         existing_inductions,  -- Note: this is a json[] value
         'pending',
         NEW.trainer_id,
         client_user_id,
         'induction'
       )
    RETURNING id INTO new_form_id;

  -- 5) Update the chat_message record with the forms id
  UPDATE chat_messages
     SET form = new_form_id
   WHERE id = new_chat_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_program_inductions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."json_merge"("json1" "json", "json2" "json") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_object_agg(key, value)
  INTO result
  FROM (
    SELECT key, value FROM json_each(json1)
    UNION ALL
    SELECT key, value FROM json_each(json2)
  ) AS kv;
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."json_merge"("json1" "json", "json2" "json") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lowerCaseEmail"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  NEW.email := LOWER(NEW.email);
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."lowerCaseEmail"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "embedding" "extensions"."vector", "similarity" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        d.embedding,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM ai_vectors d
    ORDER BY d.embedding <=> query_embedding
    LIMIT 5;
END;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_vector" "extensions"."vector", "match_count" integer DEFAULT 5, "filter" "jsonb" DEFAULT NULL::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "embedding" "extensions"."vector", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
    SELECT
      d.id,
      d.content,
      d.metadata,
      d.embedding,
      1 - (d.embedding <=> query_vector) AS similarity
    FROM ai_vectors d
    WHERE filter IS NULL OR d.metadata @> filter
    ORDER BY d.embedding <=> query_vector
    LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_documents"("query_vector" "extensions"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_program_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_program_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer, "filter" "json" DEFAULT NULL::"json") RETURNS TABLE("id" "uuid", "content" "text", "chatbot_id" "uuid", "metadata" "json", "embedding" "extensions"."vector", "similarity" numeric)
    LANGUAGE "plpgsql"
    AS $$BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.chatbot_id,
    d.metadata,
    d.embedding,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE
    (filter IS NULL OR d.metadata ->> 'chatbot_id' = filter ->> 'chatbot_id')
  ORDER BY similarity DESC
  LIMIT match_count;
END;$$;


ALTER FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer, "filter" "json") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer DEFAULT 5, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "embedding" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_vectors.id,
    ai_vectors.content,
    ai_vectors.metadata,
    (ai_vectors.embedding::text)::jsonb as embedding,
    1 - (ai_vectors.embedding <=> query_embedding) as similarity
  FROM ai_vectors
  WHERE
    ai_vectors.metadata @> filter   -- apply metadata filter if provided
  ORDER BY ai_vectors.embedding <=> query_embedding DESC
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "exercise_name" "text" NOT NULL,
    "exercise_detail" "text",
    "prime" "text"[],
    "synergist" "text"[],
    "antagonist" "text"[],
    "trainer_id" bigint,
    "equipment" "text"[],
    "steps" "text"[],
    "safety" "text",
    "media" "text" DEFAULT ''::"text",
    "rest" integer,
    "embeds" bigint[],
    "type" "text" NOT NULL,
    "cues" "text"[] DEFAULT '{}'::"text"[],
    "alternatives" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."exercises" OWNER TO "postgres";


COMMENT ON TABLE "public"."exercises" IS 'Table for exercise libraries';



CREATE OR REPLACE FUNCTION "public"."search_exercises"("search_query" "text", "user_id" bigint) RETURNS SETOF "public"."exercises"
    LANGUAGE "sql"
    AS $$
  select *
  from exercises
  where (trainer_id = user_id or trainer_id is null)
    and (
      exercise_name ilike '%' || search_query || '%'
      or exercise_detail ilike '%' || search_query || '%'
      or array_to_string(prime, ' ') ilike '%' || search_query || '%'
    );
$$;


ALTER FUNCTION "public"."search_exercises"("search_query" "text", "user_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_workout_feedback"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  -- looked-up fields
  v_trainer_email text;
  v_program_name  text;
  v_user_name     text;

  -- extracted from NEW.feel
  v_difficulty   int;
  v_pump         int;
  v_exhaustion   int;
  v_enjoyment    int;
  v_comments     text;

  -- secrets
  v_endpoint text;
  v_token    text;

  v_payload  jsonb;
begin
  -------------------------------------------------------------------
  -- Guard-clause: ignore if feel is empty / unchanged / not an object
  -------------------------------------------------------------------
  if coalesce(jsonb_typeof(NEW.feel::jsonb), '') <> 'object'
     or NEW.feel::jsonb = '{}'::jsonb
     or NEW.feel::jsonb is not distinct from OLD.feel::jsonb
  then
    return NEW;
  end if;

  -------------------------------------------------------------------
  -- Extract scalar ratings
  -------------------------------------------------------------------
  v_difficulty := (NEW.feel::jsonb ->> 'difficulty')::int;
  v_pump       := (NEW.feel::jsonb ->> 'pump')::int;
  v_exhaustion := (NEW.feel::jsonb ->> 'exhaustion')::int;
  v_enjoyment  := (NEW.feel::jsonb ->> 'enjoyment')::int;
  v_comments   :=  NEW.feel::jsonb ->> 'comments';

  -------------------------------------------------------------------
  -- Resolve trainer e-mail · program name · client first name
  -------------------------------------------------------------------
  select  u_trainer.email,
          prog.program_name,
          u_client.first_name
    into  v_trainer_email,
          v_program_name,
          v_user_name
  from workout_sheets ws
  join user_programs    up        on up.id         = ws.user_program_id
  join users            u_trainer on u_trainer.id  = up.trainer_id
  join programs         prog      on prog.id       = up.program_id
  join users            u_client  on u_client.id   = ws.client_id
  where ws.id = NEW.id;

  -------------------------------------------------------------------
  -- Pull secrets from Vault
  -------------------------------------------------------------------
  select decrypted_secret
    into v_token
    from vault.decrypted_secrets
   where name = 'workout_feedback_token';

  select decrypted_secret
    into v_endpoint
    from vault.decrypted_secrets
   where name = 'workout_feedback_endpoint';

  if v_endpoint is null then
      raise exception 'Vault secret "workout_feedback_endpoint" not found';
  end if;
  if v_token is null then
      raise exception 'Vault secret "workout_feedback_token" not found';
  end if;

  -------------------------------------------------------------------
  -- Build JSON payload
  -------------------------------------------------------------------
  v_payload := jsonb_build_object(
      'userName',      v_user_name,
      'trainerEmail',  v_trainer_email,
      'programName',   v_program_name,
      'difficulty',    v_difficulty,
      'pump',          v_pump,
      'exhaustion',    v_exhaustion,
      'enjoyment',     v_enjoyment,
      'comments',      v_comments
  );

  -------------------------------------------------------------------
  -- Fire Edge Function asynchronously
  -------------------------------------------------------------------
  perform net.http_post(
           url     := v_endpoint,
           body    := v_payload,
           headers := jsonb_build_object(
                         'Content-Type', 'application/json',
                         'Authorization', 'Bearer ' || v_token
                       )
         );

  return NEW;
end;
$$;


ALTER FUNCTION "public"."send_workout_feedback"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_organization"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$declare
  user_domain text;
  org_id int8;
begin
  -- Extract domain from the user's email
  user_domain := split_part(new.email, '@', 2);

  -- Look for an organization with a matching domain
  select id into org_id
  from public.organizations
  where user_domain = any(domains)
  limit 1;

  -- If found, update the organization column
  if org_id is not null then
    update public.users
    set organization = org_id
    where id = new.id;
  end if;

  return new;
end;$$;


ALTER FUNCTION "public"."set_user_organization"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update Equipment Required"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    v_equipment_list TEXT[];
BEGIN
    -- Extract unique equipment from all exercises in the new workouts JSON array (avoiding "" due to backslash errors)
    SELECT ARRAY_AGG(DISTINCT REPLACE(eq::TEXT, '"', '')) INTO v_equipment_list
    FROM (
        SELECT (json_array_elements(e->'equipment'))::TEXT AS eq
        FROM unnest(NEW.workouts) AS w_json, 
             json_array_elements(w_json->'exercises') e
    ) subquery;

    -- Set the new value before update (to prevent recursion)
    NEW.equipment_required := v_equipment_list;

    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update Equipment Required"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update calories"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  current_weight FLOAT8;
  calorie_adjust FLOAT8;
  gender_input TEXT;
  age_input INT;
  v_weekly_cycle INTEGER;
  macros_changed BOOLEAN := FALSE;
BEGIN
  -- Only recalculate calories if weight, goal, height, or activity level changed
  IF NEW.weight_id IS DISTINCT FROM OLD.weight_id
     OR NEW.weight_goal IS DISTINCT FROM OLD.weight_goal
     OR NEW.height IS DISTINCT FROM OLD.height
     OR NEW.activity_level IS DISTINCT FROM OLD.activity_level THEN

    -- Get the current weight
    SELECT weight INTO current_weight
    FROM weights
    WHERE id = NEW.weight_id
    LIMIT 1;

    IF current_weight IS NULL THEN
      RAISE EXCEPTION 'Weight not found for weight_id: %', NEW.weight_id;
    END IF;

    -- Get gender and age (default age = 21)
    SELECT sex,
           COALESCE(EXTRACT(YEAR FROM age(dob)), 21)
    INTO gender_input, age_input
    FROM users
    WHERE id = NEW.user_id
    LIMIT 1;

    IF gender_input IS NULL THEN
      RAISE EXCEPTION 'User not found for user_id: %', NEW.user_id;
    END IF;

    -- Calculate calorie adjustment
    IF LOWER(gender_input) = 'male' THEN
      calorie_adjust := NEW.activity_level * ((13.75 * current_weight) + (5 * NEW.height) - (6.75 * age_input) + 66);
    ELSE
      calorie_adjust := NEW.activity_level * ((9.56 * current_weight) + (1.85 * NEW.height) - (4.68 * age_input) + 655);
    END IF;

    -- Adjust for goal
    IF NEW.weight_goal < current_weight THEN
      calorie_adjust := calorie_adjust - 500;
    ELSIF NEW.weight_goal > current_weight THEN
      calorie_adjust := calorie_adjust + 500;
    END IF;

    -- Set macro goals
    IF NEW.calorie_goal IS DISTINCT FROM calorie_adjust THEN
      NEW.calorie_goal := calorie_adjust;
      NEW.protein_goal := current_weight * 1.8;
      NEW.fat_goal := (calorie_adjust - (current_weight * 7.2)) * 0.03333333333;
      NEW.carb_goal := (calorie_adjust - (current_weight * 7.2)) * 0.175;
      macros_changed := TRUE;
    END IF;
  END IF;

  -- Update today's nutritional_sheet
  IF macros_changed THEN
    UPDATE nutritional_sheets
    SET goal_macros = ARRAY[
      NEW.protein_goal,
      NEW.carb_goal,
      NEW.fat_goal,
      NEW.calorie_goal
    ]
    WHERE profile_id = NEW.id
      AND created_at = CURRENT_DATE;
  END IF;

  -- Handle workout_iteration only if valid user_program_id
  IF NEW.user_program_id IS NOT NULL AND NEW.user_program_id <> 0
     AND NEW.workout_iteration IS DISTINCT FROM OLD.workout_iteration THEN

    SELECT weekly_cycle INTO v_weekly_cycle
    FROM user_programs
    WHERE id = NEW.user_program_id;

    IF v_weekly_cycle IS NULL THEN
      RAISE EXCEPTION 'Weekly cycle not found for user_program_id: %', NEW.user_program_id;
    END IF;

    IF NEW.workout_iteration >= v_weekly_cycle THEN
      NEW.workout_iteration := 0;
    END IF;
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update calories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update previous weight"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$declare
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

end;$$;


ALTER FUNCTION "public"."update previous weight"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."updateExpiry"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    -- Always update expires_on when inserting a new row or when latest_start changes
    IF TG_OP = 'INSERT' OR OLD.latest_start IS DISTINCT FROM NEW.latest_start THEN
        NEW.expires_on := NEW.latest_start + INTERVAL '1 month' * NEW.months_package;
    END IF;
    
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."updateExpiry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_assessment_perf_sql"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  client_id        text;
  exercise_json    json;
  exercise_obj     jsonb;
  set_obj          jsonb;
  ex_id            text;
  weight_val       numeric;
  reps_val         numeric;
  orm              numeric;
  new_orms         jsonb := '[]'::jsonb;
  existing_profile jsonb;
  final_profile    jsonb := '[]'::jsonb;
  new_entry        jsonb;
  profile_obj      record;
  found            boolean;
  remove_index     int;
  current_best     numeric;
begin
  -- Assume first trainee is the client
  client_id := NEW.trainees[1]::text;

  -- Loop through each exercise in the json[] array
  foreach exercise_json in array NEW.drills
  loop
    exercise_obj := exercise_json::jsonb;
    ex_id := exercise_obj->>'id';

    -- Loop through true_sets
    for set_obj in select * from jsonb_array_elements(exercise_obj->'true_sets')
    loop
      weight_val := (set_obj->>'primary_done')::numeric;

      if (set_obj->>'control_abide')::boolean = true then
        reps_val := (exercise_obj->>'metric')::numeric;
      else
        reps_val := (set_obj->>'control_metric')::numeric;
      end if;

      if reps_val > 0 then
        orm := weight_val / (1 + 0.025 * reps_val);

        -- Check if there's already an ORM for this exercise
        select (entry->>'orm')::numeric
        into current_best
        from jsonb_array_elements(new_orms) entry
        where entry->>'exercise' = ex_id
        limit 1;

        -- If better or not present, replace
        if current_best is null or orm > current_best then
          select index into remove_index
          from jsonb_array_elements(new_orms) with ordinality e(elem, index)
          where e.elem->>'exercise' = ex_id
          limit 1;

          if remove_index is not null then
            new_orms := new_orms - remove_index;
          end if;

          new_orms := new_orms || jsonb_build_object('exercise', ex_id, 'orm', round(orm, 2));
        end if;
      end if;
    end loop;
  end loop;

  -- Update assessment ORM
  update assessment
  set overall_performance = new_orms
  where id = NEW.id;

  -- Get current best_perf from profile
  select test_perf
  into existing_profile
  from profiles
  where user_id = client_id::bigint;

  if existing_profile is null then
    existing_profile := '[]'::jsonb;
  end if;

  -- Merge new ORMs with profile
  for new_entry in select * from jsonb_array_elements(new_orms)
  loop
    found := false;

    for profile_obj in select jsonb_array_elements(existing_profile) as elem
    loop
      if profile_obj.elem->>'exercise' = new_entry->>'exercise' then
        found := true;
        if (new_entry->>'orm')::numeric > (profile_obj.elem->>'orm')::numeric then
          final_profile := final_profile || new_entry;
        else
          final_profile := final_profile || profile_obj.elem;
        end if;
        exit;
      end if;
    end loop;

    if not found then
      final_profile := final_profile || new_entry;
    end if;
  end loop;

  -- Update profile test_perf
  update profiles
  set test_perf = final_profile
  where user_id = client_id::bigint;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."update_assessment_perf_sql"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_average_ratings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  avg_trainer_rating numeric(10,2);
  avg_program_rating numeric(10,2);
  target_trainer_id numeric;  -- adjust datatype if needed
  target_program_id numeric;  -- adjust datatype if needed
BEGIN
  -- Determine the trainer and program IDs from the new or old row.
  target_trainer_id := COALESCE(NEW.trainer, OLD.trainer);
  target_program_id := COALESCE(NEW.program, OLD.program);

  -- Calculate the new average rating for the trainer.
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
    INTO avg_trainer_rating
    FROM reviews
    WHERE trainer = target_trainer_id;

  -- Update the trainer_profile table.
  UPDATE trainer_profile
    SET rating = avg_trainer_rating
    WHERE user_id = target_trainer_id;

  -- Calculate and update the program's overall rating, if applicable.
  IF target_program_id IS NOT NULL THEN
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      INTO avg_program_rating
      FROM reviews
      WHERE program = target_program_id;

    UPDATE programs
      SET overall_rating = avg_program_rating
      WHERE id = target_program_id;
  END IF;

  RETURN NULL;  -- AFTER triggers must return null
END;$$;


ALTER FUNCTION "public"."update_average_ratings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_best_perf_sql"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  exercise_json      json;
  exercise_obj       jsonb;
  set_obj            jsonb;
  ex_id              text;
  weight_val         numeric;
  reps_val           numeric;
  orm                numeric;
  intensity_modifier_val text;
  new_orms_b         jsonb := '[]'::jsonb;
  existing_profile_b jsonb;
  final_profile_b    jsonb := '[]'::jsonb;
  entry              jsonb;
  remove_idx         integer;
  new_orms_arr       json[];
  final_profile_arr  json[];
BEGIN
  -- 1) Build new_orms_b with best ORM per exercise and include intensity_modifier
  FOREACH exercise_json IN ARRAY NEW.exercises
  LOOP
    exercise_obj := exercise_json::jsonb;
    ex_id := exercise_obj->>'id';
    -- Extract intensity_modifier from the exercise JSON
    intensity_modifier_val := (exercise_obj->>'intensity_mod')::text;

    FOR set_obj IN
      SELECT * FROM jsonb_array_elements(exercise_obj->'true_sets')
    LOOP
      weight_val := (set_obj->>'weight_done')::numeric;
      reps_val   := (set_obj->>'reps_done')  ::numeric;
      IF reps_val > 0 THEN
        orm := weight_val / (1.0278 - 0.0278 * reps_val);

        -- Determine if this is a new best for the exercise
        IF
          NOT (new_orms_b @> jsonb_build_array(jsonb_build_object('exercise', ex_id)))
          OR orm > (
            SELECT (e->>'orm')::numeric
            FROM jsonb_array_elements(new_orms_b) AS x(e)
            WHERE e->>'exercise' = ex_id
          )
        THEN
          -- Remove old entry if present
          SELECT (idx - 1) INTO remove_idx
            FROM jsonb_array_elements(new_orms_b) WITH ORDINALITY AS x(e, idx)
            WHERE e->>'exercise' = ex_id
            LIMIT 1;

          IF remove_idx IS NOT NULL THEN
            new_orms_b := new_orms_b #- array[remove_idx::text];
          END IF;

          -- Append new best performance with intensity_modifier
          new_orms_b := new_orms_b || jsonb_build_object(
            'exercise', ex_id,
            'orm', round(orm, 2),
            'intensity_mod', intensity_modifier_val
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- 2) Write workout sheet best_perf (json[])
  SELECT array_agg(elem::json) INTO new_orms_arr
    FROM jsonb_array_elements(new_orms_b) AS x(elem);

  UPDATE workout_sheets
    SET best_perf = new_orms_arr
    WHERE id = NEW.id;

  -- 3) Load existing profile.best_perf into jsonb
  SELECT
    CASE WHEN best_perf IS NULL THEN '[]'::jsonb
         ELSE to_jsonb(best_perf)
    END
  INTO existing_profile_b
  FROM profiles
  WHERE user_id = NEW.client_id;

  -- 4a) Merge/replace same-exercise entries
  final_profile_b := '[]'::jsonb;
  FOR entry IN SELECT * FROM jsonb_array_elements(new_orms_b)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(existing_profile_b) AS old_entry(elem)
      WHERE elem->>'exercise' = entry->>'exercise'
        AND (entry->>'orm')::numeric <= (elem->>'orm')::numeric
    ) THEN
      final_profile_b := final_profile_b || (
        SELECT elem
        FROM jsonb_array_elements(existing_profile_b) AS old_entry(elem)
        WHERE elem->>'exercise' = entry->>'exercise'
        LIMIT 1
      );
    ELSE
      final_profile_b := final_profile_b || entry;
    END IF;
  END LOOP;

  -- 4b) Append any old exercises with no new sets
  FOR entry IN SELECT * FROM jsonb_array_elements(existing_profile_b) AS old_entry(elem)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(new_orms_b) AS neu(e)
      WHERE e->>'exercise' = entry->>'exercise'
    ) THEN
      final_profile_b := final_profile_b || entry;
    END IF;
  END LOOP;

  -- 5) Write profile best_perf (json[])
  SELECT array_agg(elem::json) INTO final_profile_arr
    FROM jsonb_array_elements(final_profile_b) AS x(elem);

  UPDATE profiles
    SET best_perf = final_profile_arr
    WHERE user_id = NEW.client_id;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_best_perf_sql"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_diet_streak"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  yesterday date := CURRENT_DATE - INTERVAL '1 day';
  logged_yesterday boolean;
BEGIN
  -- Check if there's a row with non-zero macros from yesterday
  SELECT EXISTS (
    SELECT 1 FROM nutritional_sheets
    WHERE profile_id = NEW.profile_id
      AND date_logged::date = yesterday
      AND overall_macros <> ARRAY[0, 0, 0, 0]::float8[]
  ) INTO logged_yesterday;

  -- Update the diet_streak in profiles
  IF logged_yesterday THEN
    UPDATE profiles
    SET diet_streak = diet_streak + 1
    WHERE id = NEW.profile_id;
  ELSE
    UPDATE profiles
    SET diet_streak = 0
    WHERE id = NEW.profile_id;
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_diet_streak"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_drills_from_template"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Only run if the assessment_template is set
  if NEW.template is not null then
    update assessment
    set drills = (
      select drills
      from assessment_template
      where id = NEW.template
    )
    where id = NEW.id;
  end if;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."update_drills_from_template"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_meal_macros"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    meal_names TEXT[] := ARRAY['breakfast', 'lunch', 'dinner', 'supper'];
    food_item json;
    meal_macros FLOAT[];
    overall_macros FLOAT[] := ARRAY[0, 0, 0, 0];
    rounded_meal_macros FLOAT[];
    rounded_overall_macros FLOAT[];
    i INTEGER;
    meal_literal TEXT;
    overall_literal TEXT;
BEGIN
    -- Loop over each meal (breakfast, lunch, dinner, supper)
    FOR i IN 1 .. array_length(meal_names, 1) LOOP
        -- Reset meal macros for current meal: [protein, carbs, fats, calories]
        meal_macros := ARRAY[0, 0, 0, 0];

        IF meal_names[i] = 'breakfast' THEN
            IF NEW.breakfast IS NOT NULL THEN
                FOREACH food_item IN ARRAY NEW.breakfast LOOP
                     meal_macros[1] := meal_macros[1] + ((food_item->>'protein')::double precision);
                    meal_macros[2] := meal_macros[2] + ((food_item->>'carbohydrates')::double precision);
                    meal_macros[3] := meal_macros[3] + ((food_item->>'fats')::double precision);
                    meal_macros[4] := meal_macros[4] + ((food_item->>'calories')::double precision);
                END LOOP;
            END IF;
            -- Round to 3 decimals
            rounded_meal_macros := ARRAY[
                round(meal_macros[1]::numeric, 3)::FLOAT,
                round(meal_macros[2]::numeric, 3)::FLOAT,
                round(meal_macros[3]::numeric, 3)::FLOAT,
                round(meal_macros[4]::numeric, 3)::FLOAT
            ];
            meal_literal := '{' || array_to_string(rounded_meal_macros, ',') || '}';
            NEW.breakfast_macros := meal_literal;
        
        ELSIF meal_names[i] = 'lunch' THEN
            IF NEW.lunch IS NOT NULL THEN
                FOREACH food_item IN ARRAY NEW.lunch LOOP
                     meal_macros[1] := meal_macros[1] + ((food_item->>'protein')::double precision);
    meal_macros[2] := meal_macros[2] + ((food_item->>'carbohydrates')::double precision);
    meal_macros[3] := meal_macros[3] + ((food_item->>'fats')::double precision);
    meal_macros[4] := meal_macros[4] + ((food_item->>'calories')::double precision);
                END LOOP;
            END IF;
            rounded_meal_macros := ARRAY[
                round(meal_macros[1]::numeric, 3)::FLOAT,
                round(meal_macros[2]::numeric, 3)::FLOAT,
                round(meal_macros[3]::numeric, 3)::FLOAT,
                round(meal_macros[4]::numeric, 3)::FLOAT
            ];
            meal_literal := '{' || array_to_string(rounded_meal_macros, ',') || '}';
            NEW.lunch_macros := meal_literal;
        
        ELSIF meal_names[i] = 'dinner' THEN
            IF NEW.dinner IS NOT NULL THEN
                FOREACH food_item IN ARRAY NEW.dinner LOOP
                     meal_macros[1] := meal_macros[1] + ((food_item->>'protein')::double precision);
    meal_macros[2] := meal_macros[2] + ((food_item->>'carbohydrates')::double precision);
    meal_macros[3] := meal_macros[3] + ((food_item->>'fats')::double precision);
    meal_macros[4] := meal_macros[4] + ((food_item->>'calories')::double precision);
                END LOOP;
            END IF;
            rounded_meal_macros := ARRAY[
                round(meal_macros[1]::numeric, 3)::FLOAT,
                round(meal_macros[2]::numeric, 3)::FLOAT,
                round(meal_macros[3]::numeric, 3)::FLOAT,
                round(meal_macros[4]::numeric, 3)::FLOAT
            ];
            meal_literal := '{' || array_to_string(rounded_meal_macros, ',') || '}';
            NEW.dinner_macros := meal_literal;
        
        ELSIF meal_names[i] = 'supper' THEN
            IF NEW.supper IS NOT NULL THEN
                FOREACH food_item IN ARRAY NEW.supper LOOP
                     meal_macros[1] := meal_macros[1] + ((food_item->>'protein')::double precision);
    meal_macros[2] := meal_macros[2] + ((food_item->>'carbohydrates')::double precision);
    meal_macros[3] := meal_macros[3] + ((food_item->>'fats')::double precision);
    meal_macros[4] := meal_macros[4] + ((food_item->>'calories')::double precision);
                END LOOP;
            END IF;
            rounded_meal_macros := ARRAY[
                round(meal_macros[1]::numeric, 3)::FLOAT,
                round(meal_macros[2]::numeric, 3)::FLOAT,
                round(meal_macros[3]::numeric, 3)::FLOAT,
                round(meal_macros[4]::numeric, 3)::FLOAT
            ];
            meal_literal := '{' || array_to_string(rounded_meal_macros, ',') || '}';
            NEW.supper_macros := meal_literal;
        END IF;

        -- Add the (non-rounded) meal totals into overall macros
        overall_macros[1] := overall_macros[1] + meal_macros[1];
        overall_macros[2] := overall_macros[2] + meal_macros[2];
        overall_macros[3] := overall_macros[3] + meal_macros[3];
        overall_macros[4] := overall_macros[4] + meal_macros[4];
    END LOOP;

    -- Round overall macros to 3 decimals and convert to proper array literal
    rounded_overall_macros := ARRAY[
        round(overall_macros[1]::numeric, 3)::FLOAT,
        round(overall_macros[2]::numeric, 3)::FLOAT,
        round(overall_macros[3]::numeric, 3)::FLOAT,
        round(overall_macros[4]::numeric, 3)::FLOAT
    ];
    overall_literal := '{' || array_to_string(rounded_overall_macros, ',') || '}';
    NEW.overall_macros := overall_literal;

    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_meal_macros"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_coach_from_user_programs"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Update the profiles table based on the new client-trainer relationship
  update profiles
  set coach = NEW.trainer_id
  where id = NEW.client_id;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."update_profile_coach_from_user_programs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_workout_streak"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  yesterday date := CURRENT_DATE - INTERVAL '1 day';
  found_yesterday boolean;
BEGIN
  -- Check if there's a workout marked "done" for yesterday
  SELECT EXISTS (
    SELECT 1 FROM workout_sheets
    WHERE client_id = NEW.client_id
      AND created_for_date::date = yesterday
      AND done = true
  ) INTO found_yesterday;

  -- Update the workout_streak in profiles table
  IF found_yesterday THEN
    UPDATE profiles
    SET workout_streak = workout_streak + 1
    WHERE user_id = NEW.client_id;
  ELSE
    UPDATE profiles
    SET workout_streak = 0
    WHERE user_id = NEW.client_id;
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_workout_streak"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."workout_new_iteration"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
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
END;$$;


ALTER FUNCTION "public"."workout_new_iteration"() OWNER TO "postgres";


ALTER TABLE "public"."exercises" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Exercises_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."nationalities" (
    "id" bigint NOT NULL,
    "nationality" "text"
);


ALTER TABLE "public"."nationalities" OWNER TO "postgres";


ALTER TABLE "public"."nationalities" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Nationalities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role_name" "text" NOT NULL,
    "role_description" "text"
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."roles" IS 'Table that holds roles and connects them to users.';



ALTER TABLE "public"."roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."slots" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "time_start" timestamp with time zone,
    "time_end" timestamp with time zone,
    "users" "text"[],
    "groups" "text"[],
    "type" "text",
    "assessment" bigint,
    "organization" bigint DEFAULT '1'::bigint NOT NULL,
    "recurrence_rule" "jsonb",
    "recurrence_parent_id" integer,
    "assessment_data" "jsonb",
    "exceptions" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."slots" OWNER TO "postgres";


COMMENT ON TABLE "public"."slots" IS 'The base editable part of the calendar component.';



ALTER TABLE "public"."slots" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Slots_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" DEFAULT ''::"text" NOT NULL,
    "last_name" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text",
    "nationality" "text",
    "avatar" "text",
    "profile_id" bigint,
    "sex" "text",
    "age" bigint,
    "is_staff" boolean DEFAULT false NOT NULL,
    "trainer_profile" bigint,
    "last_active" timestamp without time zone,
    "roles" "text"[] DEFAULT '{Trainee}'::"text"[] NOT NULL,
    "dob" timestamp with time zone,
    "audit_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "organization" bigint,
    "fcm_token" "text",
    "groups" bigint[] DEFAULT '{}'::bigint[]
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Users table for essential user data regardless of role, this is an extension of the auth table!';



COMMENT ON COLUMN "public"."users"."roles" IS 'a list of roles assigned to the user';



COMMENT ON COLUMN "public"."users"."dob" IS 'date of birth';



COMMENT ON COLUMN "public"."users"."audit_status" IS 'whether this account is active, suspended or banned';



COMMENT ON COLUMN "public"."users"."groups" IS 'groups user is aligned with';



ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."User_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ai_chat_messages" (
    "id" bigint NOT NULL,
    "user_program" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text",
    "sent_by" bigint,
    "chatbot_id" bigint,
    "role" "text" NOT NULL,
    "tokens_used" integer
);


ALTER TABLE "public"."ai_chat_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_chat_messages" IS 'This is a duplicate of chat_messages for AI chats';



ALTER TABLE "public"."ai_chat_messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ai_chat_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ai_vectors" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "extensions"."vector"(1536) NOT NULL,
    "metadata" "jsonb" NOT NULL
);


ALTER TABLE "public"."ai_vectors" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_vectors" IS 'embedded documents';



ALTER TABLE "public"."ai_vectors" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ai_documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ai_media" (
    "id" bigint NOT NULL,
    "chatbot_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "path" "text",
    "type" "text" NOT NULL,
    "extension" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_media" OWNER TO "postgres";


ALTER TABLE "public"."ai_media" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ai_media_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."assessment" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slot" bigint,
    "assessors" bigint[],
    "trainees" bigint[],
    "started" timestamp with time zone,
    "ended" timestamp with time zone,
    "comments" "json"[],
    "summary" "text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "organization" bigint,
    "template" bigint,
    "drills" "json"[],
    "overall_performance" "jsonb",
    "occurrence_date" "date"
);


ALTER TABLE "public"."assessment" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment" IS 'Assessments for trainees by their coaches to show performance.';



ALTER TABLE "public"."assessment" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."assessment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."assessment_template" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "template_name" "text",
    "created_by" bigint,
    "organization" bigint,
    "etc" bigint DEFAULT '60'::bigint NOT NULL,
    "template_description" "text",
    "drills" "json"[]
);


ALTER TABLE "public"."assessment_template" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment_template" IS 'Templates of drills and such to be added to assessment bookings. These can be edited per booking later.';



ALTER TABLE "public"."assessment_template" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."assessment_template_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."cancel_request" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "raised_by" bigint NOT NULL,
    "user_program_id" bigint NOT NULL,
    "reasoning" "text" DEFAULT ''::"text" NOT NULL,
    "media_links" "text"[],
    "status" "text" DEFAULT 'raised'::"text" NOT NULL,
    "closed_on" timestamp with time zone,
    "closure_reason" "text",
    "closed_by" bigint
);


ALTER TABLE "public"."cancel_request" OWNER TO "postgres";


COMMENT ON TABLE "public"."cancel_request" IS 'cancellation requests for clients';



ALTER TABLE "public"."cancel_request" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."cancel_request_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."certifications" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "certification_name" "text",
    "certification_board" "text",
    "certification_image" "text"
);


ALTER TABLE "public"."certifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."certifications" IS 'Table for all the certifications available';



ALTER TABLE "public"."certifications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."certifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" bigint NOT NULL,
    "user_program" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text",
    "media" "text"[],
    "seen_at" timestamp with time zone,
    "sent_by" bigint NOT NULL,
    "form" bigint,
    "sent_to" bigint,
    "group" bigint
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


ALTER TABLE "public"."chat_messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."chat_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chatbots" (
    "id" bigint NOT NULL,
    "trainer_id" bigint NOT NULL,
    "program_id" bigint NOT NULL,
    "enabled" boolean DEFAULT true,
    "system_prompt" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chatbots" OWNER TO "postgres";


ALTER TABLE "public"."chatbots" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."chatbots_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "Country" "text",
    "Code" character varying
);


ALTER TABLE "public"."countries" OWNER TO "postgres";


ALTER TABLE "public"."countries" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."countries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."debug_logs" (
    "id" integer NOT NULL,
    "log_time" timestamp with time zone DEFAULT "now"(),
    "message" "text"
);


ALTER TABLE "public"."debug_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."debug_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."debug_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."debug_logs_id_seq" OWNED BY "public"."debug_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."entitlements" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "trainer_id" bigint NOT NULL,
    "start_date" timestamp without time zone,
    "end_date" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "status" "text" DEFAULT 'available'::"text",
    "user_program_id" bigint,
    "client_email" "text",
    "program_id" bigint
);


ALTER TABLE "public"."entitlements" OWNER TO "postgres";


ALTER TABLE "public"."entitlements" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."entitlements_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."food_cache" (
    "id" bigint NOT NULL,
    "query" "text" NOT NULL,
    "normalized_query" "text",
    "response" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "user_id" bigint
);


ALTER TABLE "public"."food_cache" OWNER TO "postgres";


ALTER TABLE "public"."food_cache" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."food_cache_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."forms" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "message_id" bigint NOT NULL,
    "status" "text" DEFAULT '"pending"'::"text",
    "trainer_id" bigint NOT NULL,
    "client_id" bigint NOT NULL,
    "program_id" bigint NOT NULL,
    "type" "text" NOT NULL,
    "questions" "json"[]
);


ALTER TABLE "public"."forms" OWNER TO "postgres";


ALTER TABLE "public"."forms" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."forms_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "group_name" "text",
    "group_avatar" "text",
    "group_description" "text",
    "admins" bigint[],
    "users" bigint[],
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "organization" bigint
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


COMMENT ON TABLE "public"."groups" IS 'Groups of people which helps with bulk management and chats.';



ALTER TABLE "public"."groups" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "body" "text" NOT NULL,
    "title" "text" NOT NULL,
    "user_id" bigint NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nutritional_sheets" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" bigint NOT NULL,
    "date_logged" "date",
    "breakfast" "json"[] DEFAULT ARRAY[]::"json"[],
    "lunch" "json"[] DEFAULT ARRAY[]::"json"[],
    "dinner" "json"[] DEFAULT ARRAY[]::"json"[],
    "supper" "json"[] DEFAULT ARRAY[]::"json"[],
    "breakfast_macros" double precision[],
    "lunch_macros" double precision[],
    "dinner_macros" double precision[],
    "supper_macros" double precision[],
    "overall_macros" double precision[],
    "goal_macros" double precision[]
);


ALTER TABLE "public"."nutritional_sheets" OWNER TO "postgres";


COMMENT ON TABLE "public"."nutritional_sheets" IS 'Sheets for nutritional data of different users.';



ALTER TABLE "public"."nutritional_sheets" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."nutritional_sheets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."org_notifications" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization" bigint,
    "title" "text",
    "body" "text"
);


ALTER TABLE "public"."org_notifications" OWNER TO "postgres";


ALTER TABLE "public"."org_notifications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."org_notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "domains" "text"[],
    "description" "text",
    "logo" "text",
    "country" "text",
    "address" "text",
    "trainer_assign" boolean,
    "token" "text"
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


ALTER TABLE "public"."organizations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "height" bigint DEFAULT '0'::bigint,
    "weight_id" bigint,
    "activity_level" double precision DEFAULT '0'::double precision,
    "weight_goal" double precision DEFAULT '0'::double precision,
    "calorie_goal" double precision DEFAULT '0'::double precision,
    "user_id" bigint,
    "protein_goal" double precision DEFAULT '0'::double precision,
    "carb_goal" double precision DEFAULT '0'::double precision,
    "fat_goal" double precision DEFAULT '0'::double precision,
    "fitness_goal" smallint[],
    "diet_preference" "text"[],
    "sports_played" "text"[],
    "user_program_id" bigint,
    "last_login" timestamp without time zone,
    "experience" "text",
    "body_fat" double precision DEFAULT '0'::double precision,
    "workout_iteration" smallint DEFAULT '0'::smallint,
    "diet_last_logged" "date",
    "workout_streak" bigint DEFAULT '0'::bigint,
    "diet_streak" bigint DEFAULT '0'::bigint,
    "best_perf" "json"[],
    "test_perf" "json",
    "coach" bigint,
    "diet_profile" "jsonb" DEFAULT '{"notes": "", "trends": [], "timings": {"lunch": "1200", "dinner": "1600", "supper": "2000", "breakfast": "0800"}, "suggested_meals": {"lunch": [], "dinner": [], "supper": [], "breakfast": []}}'::"jsonb"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Table for client profiles used in analytics and program assignments';



ALTER TABLE "public"."profiles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."profiles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "program_name" "text" NOT NULL,
    "program_description" "text" NOT NULL,
    "difficulty_level" "text" NOT NULL,
    "equipment_required" "text"[],
    "trainer_id" bigint NOT NULL,
    "tags" "text"[],
    "price_one" double precision DEFAULT '0'::double precision NOT NULL,
    "price_three" double precision,
    "price_six" double precision,
    "price_year" double precision,
    "video_rating" double precision,
    "program_focus" double precision[],
    "avg_session_time" double precision DEFAULT '0'::double precision NOT NULL,
    "avg_days_per_week" integer DEFAULT 0 NOT NULL,
    "weekly_cycle" integer DEFAULT 7 NOT NULL,
    "overall_rating" double precision DEFAULT '0'::double precision NOT NULL,
    "program_photo" "text" NOT NULL,
    "workouts" "json"[],
    "seats_available" integer DEFAULT 30,
    "status" "text" DEFAULT 'Draft'::"text" NOT NULL,
    "promos" "json"[],
    "referral" "text",
    "organization" bigint,
    "inductions" "json"[],
    "follow" "json"[],
    "sets_muscle" "jsonb"
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


COMMENT ON TABLE "public"."programs" IS 'Program templates are actually the programs that a trainer adds to the market. I called them templates as they are the more constant type of product data.';



COMMENT ON COLUMN "public"."programs"."status" IS 'the review status of the program';



ALTER TABLE "public"."programs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."program_template_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user" bigint,
    "trainer" bigint,
    "rating" double precision,
    "content" "text",
    "user_name" "text",
    "program" bigint
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."reviews" IS 'Table of all the reviews';



ALTER TABLE "public"."reviews" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."secret_tokens" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_in" integer,
    "token" "text"
);


ALTER TABLE "public"."secret_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."secret_tokens" IS 'Fat Secret API access tokens';



ALTER TABLE "public"."secret_tokens" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."secret_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" bigint NOT NULL,
    "created_by" bigint NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "related_to" "text",
    "media" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated_by" bigint,
    "status" "text" DEFAULT 'open'::"text" NOT NULL
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."support_tickets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."support_tickets_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."support_tickets_id_seq" OWNED BY "public"."support_tickets"."id";



ALTER TABLE "public"."support_tickets" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."support_tickets_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ticket_messages" (
    "id" bigint NOT NULL,
    "ticket_id" bigint NOT NULL,
    "sender_id" bigint NOT NULL,
    "sender_role" "text" NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "media" "text"[],
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_messages" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ticket_messages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ticket_messages_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ticket_messages_id_seq" OWNED BY "public"."ticket_messages"."id";



ALTER TABLE "public"."ticket_messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ticket_messages_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."trainer_profile" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "years_of_experience" integer,
    "certifications" bigint[],
    "programs" bigint[],
    "rating" double precision,
    "bio" "text" DEFAULT ''::"text",
    "seats_available" integer DEFAULT 30 NOT NULL,
    "preferred_clients" "text"[],
    "certifications_links" "text"[],
    "follow_up" bigint DEFAULT '0'::bigint NOT NULL,
    "available_hours" "text" DEFAULT '8:00 AM - 4:00 PM'::"text" NOT NULL,
    "socials" "json" DEFAULT '{"instagram": null, "facebook": null, "snapchat": null, "x": null}'::"json"
);


ALTER TABLE "public"."trainer_profile" OWNER TO "postgres";


COMMENT ON TABLE "public"."trainer_profile" IS 'Profiles specific to trainers detailing everything associated to them';



COMMENT ON COLUMN "public"."trainer_profile"."seats_available" IS 'number of seats available in total';



COMMENT ON COLUMN "public"."trainer_profile"."follow_up" IS 'How often to send the clients the follow up forms! (in days)';



ALTER TABLE "public"."trainer_profile" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."trainer_profile_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_programs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_on" timestamp with time zone,
    "program_id" bigint,
    "client_id" bigint,
    "price_package" integer DEFAULT 0,
    "current_intensity" double precision DEFAULT '0'::double precision,
    "current_volume" integer DEFAULT 0,
    "intensity_progress" double precision DEFAULT '0'::double precision,
    "volume_progress" double precision DEFAULT '0'::double precision,
    "workouts" "json"[],
    "months_package" integer DEFAULT 1,
    "expired_on" timestamp with time zone,
    "cancellation_reason" "text",
    "status" "text" DEFAULT 'active'::"text",
    "weekly_cycle" integer DEFAULT 7 NOT NULL,
    "trainer_id" bigint,
    "entitlement_id" bigint,
    "latest_start" timestamp with time zone DEFAULT "now"(),
    "auto_reroll" boolean,
    "sets_muscle" "jsonb"
);


ALTER TABLE "public"."user_programs" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_programs" IS 'The programs here are instances related to customers that vary according to their performance, preferences and coaching feedback. Changes in this program do not reflect with any other user and can only be seen by the coach and client involved:';



ALTER TABLE "public"."user_programs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_programs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" bigint NOT NULL,
    "language" "text" DEFAULT 'en'::"text",
    "dark_mode" boolean DEFAULT true,
    "units" integer DEFAULT 0,
    "notifications" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_settings" IS 'table that defines settings related to the user';



ALTER TABLE "public"."user_settings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."weights" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "weight" double precision,
    "previous" bigint,
    "profile_id" bigint,
    "image" "text",
    "goal_weight" double precision
);


ALTER TABLE "public"."weights" OWNER TO "postgres";


COMMENT ON TABLE "public"."weights" IS 'tracking of weight progress';



ALTER TABLE "public"."weights" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."weights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."workout_sheets" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workout_name" "text" DEFAULT ''::"text",
    "client_id" bigint,
    "user_program_id" bigint,
    "exercises" "json"[],
    "average_intensity" double precision,
    "average_volume" double precision,
    "done" boolean DEFAULT false,
    "date_started" timestamp with time zone,
    "iteration" integer DEFAULT 0,
    "time_to_complete" integer DEFAULT 0 NOT NULL,
    "sets_per_session" integer,
    "predicted_intensity" integer DEFAULT 75,
    "workout_summary" "text",
    "created_for_date" "date" NOT NULL,
    "rest_day" boolean DEFAULT false,
    "date_completed" timestamp with time zone,
    "week_of_program" integer DEFAULT 1 NOT NULL,
    "previous_id" integer,
    "best_perf" "json"[],
    "feel" "json" DEFAULT '{}'::"json"
);


ALTER TABLE "public"."workout_sheets" OWNER TO "postgres";


COMMENT ON TABLE "public"."workout_sheets" IS 'Individual workout sheets to track progress';



ALTER TABLE "public"."workout_sheets" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."workout_sheets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."debug_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."debug_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "Exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nationalities"
    ADD CONSTRAINT "Nationalities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_vectors"
    ADD CONSTRAINT "ai_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_media"
    ADD CONSTRAINT "ai_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment"
    ADD CONSTRAINT "assessment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment"
    ADD CONSTRAINT "assessment_slot_occurrence_unique" UNIQUE ("slot", "occurrence_date");



ALTER TABLE ONLY "public"."assessment_template"
    ADD CONSTRAINT "assessment_template_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cancel_request"
    ADD CONSTRAINT "cancel_request_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chatbots"
    ADD CONSTRAINT "chatbots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chatbots"
    ADD CONSTRAINT "chatbots_program_id_key" UNIQUE ("program_id");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."debug_logs"
    ADD CONSTRAINT "debug_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."food_cache"
    ADD CONSTRAINT "food_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutritional_sheets"
    ADD CONSTRAINT "nutritional_sheets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_notifications"
    ADD CONSTRAINT "org_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_domains_key" UNIQUE ("domains");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_program_id_key" UNIQUE ("user_program_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_weight_id_key" UNIQUE ("weight_id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "program_template_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_role_name_key" UNIQUE ("role_name");



ALTER TABLE ONLY "public"."secret_tokens"
    ADD CONSTRAINT "secret_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slots"
    ADD CONSTRAINT "slots_assessment_key" UNIQUE ("assessment");



ALTER TABLE ONLY "public"."slots"
    ADD CONSTRAINT "slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_profile"
    ADD CONSTRAINT "trainer_profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_profile"
    ADD CONSTRAINT "trainer_profile_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_programs"
    ADD CONSTRAINT "user_programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."weights"
    ADD CONSTRAINT "weights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_sheets"
    ADD CONSTRAINT "workout_sheets_pkey" PRIMARY KEY ("id");



CREATE INDEX "food_cache_gin_idx" ON "public"."food_cache" USING "gin" ("to_tsvector"('"english"'::"regconfig", "normalized_query"));



CREATE INDEX "idx_assessment_slot_occurrence" ON "public"."assessment" USING "btree" ("slot", "occurrence_date");



CREATE INDEX "idx_slots_assessment_data" ON "public"."slots" USING "gin" ("assessment_data") WHERE ("assessment_data" IS NOT NULL);



CREATE INDEX "idx_slots_recurrence_parent_id" ON "public"."slots" USING "btree" ("recurrence_parent_id");



CREATE INDEX "idx_slots_recurrence_rule" ON "public"."slots" USING "gin" ("recurrence_rule") WHERE ("recurrence_rule" IS NOT NULL);



CREATE OR REPLACE TRIGGER "StartEndDatesEntitlements" BEFORE UPDATE ON "public"."entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."Start and end dates Entitlement"();



CREATE OR REPLACE TRIGGER "UpdateEquipmentRequired" BEFORE UPDATE ON "public"."programs" FOR EACH ROW EXECUTE FUNCTION "public"."update Equipment Required"();



CREATE OR REPLACE TRIGGER "UpdateMacrosTrigger2" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update calories"();



CREATE OR REPLACE TRIGGER "UpdatePreviousWeight" BEFORE INSERT ON "public"."weights" FOR EACH ROW EXECUTE FUNCTION "public"."update previous weight"();



CREATE OR REPLACE TRIGGER "WorkoutSheetIteration" BEFORE INSERT ON "public"."workout_sheets" FOR EACH ROW EXECUTE FUNCTION "public"."workout_new_iteration"();



CREATE OR REPLACE TRIGGER "insertEmailLowerCase" BEFORE INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."lowerCaseEmail"();



CREATE OR REPLACE TRIGGER "notifications-hook" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://pexviywnztvqomfosvho.supabase.co/functions/v1/push', 'POST', '{"Content-type":"application/json"}', '{}', '1000');



CREATE OR REPLACE TRIGGER "org-notifications-hook" AFTER INSERT ON "public"."org_notifications" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://pexviywnztvqomfosvho.supabase.co/functions/v1/org-push', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "ratings_after_delete" AFTER DELETE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_average_ratings"();



CREATE OR REPLACE TRIGGER "ratings_after_insert" AFTER INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_average_ratings"();



CREATE OR REPLACE TRIGGER "trg_apply_progression" AFTER UPDATE ON "public"."workout_sheets" FOR EACH ROW WHEN (("new"."done" IS TRUE)) EXECUTE FUNCTION "public"."apply_progression_on_workout_update"();



CREATE OR REPLACE TRIGGER "trg_check_domain_uniqueness" BEFORE INSERT OR UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."check_domain_uniqueness"();



CREATE OR REPLACE TRIGGER "trg_notify_program_update" AFTER UPDATE ON "public"."user_programs" FOR EACH ROW EXECUTE FUNCTION "public"."notify_program_update"();



CREATE OR REPLACE TRIGGER "trg_program_sync_sets_muscle" BEFORE INSERT OR UPDATE ON "public"."programs" FOR EACH ROW EXECUTE FUNCTION "public"."fn_sync_sets_muscle"();



CREATE OR REPLACE TRIGGER "trg_update_assessment_drills" AFTER INSERT OR UPDATE OF "template" ON "public"."assessment" FOR EACH ROW EXECUTE FUNCTION "public"."update_drills_from_template"();



CREATE OR REPLACE TRIGGER "trg_update_best_perf" AFTER UPDATE OF "exercises" ON "public"."workout_sheets" FOR EACH ROW WHEN ((("new"."exercises")::"text" IS DISTINCT FROM ("old"."exercises")::"text")) EXECUTE FUNCTION "public"."update_best_perf_sql"();



CREATE OR REPLACE TRIGGER "trg_update_diet_streak" AFTER INSERT ON "public"."nutritional_sheets" FOR EACH ROW EXECUTE FUNCTION "public"."update_diet_streak"();



CREATE OR REPLACE TRIGGER "trg_update_profile_coach" AFTER INSERT OR UPDATE ON "public"."user_programs" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_coach_from_user_programs"();



CREATE OR REPLACE TRIGGER "trg_update_test_perf" AFTER UPDATE OF "drills" ON "public"."assessment" FOR EACH ROW WHEN ((("new"."drills")::"text" IS DISTINCT FROM ("old"."drills")::"text")) EXECUTE FUNCTION "public"."update_assessment_perf_sql"();



CREATE OR REPLACE TRIGGER "trg_update_workout_streak" AFTER INSERT ON "public"."workout_sheets" FOR EACH ROW EXECUTE FUNCTION "public"."update_workout_streak"();



CREATE OR REPLACE TRIGGER "trg_user_program_sync_sets_muscle" BEFORE INSERT OR UPDATE ON "public"."user_programs" FOR EACH ROW EXECUTE FUNCTION "public"."fn_sync_sets_muscle"();



CREATE OR REPLACE TRIGGER "trigger_copy_workouts" BEFORE INSERT ON "public"."user_programs" FOR EACH ROW EXECUTE FUNCTION "public"."copy_workouts_to_user_programs"();



CREATE OR REPLACE TRIGGER "trigger_delete_incomplete_workouts" AFTER UPDATE ON "public"."user_programs" FOR EACH ROW EXECUTE FUNCTION "public"."delete_incomplete_workout_sheets"();



CREATE OR REPLACE TRIGGER "trigger_set_user_organization" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_user_organization"();



CREATE OR REPLACE TRIGGER "trigger_user_program_inductions" AFTER INSERT ON "public"."user_programs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_user_program_inductions"();



CREATE OR REPLACE TRIGGER "updateExpiryTrigger" BEFORE INSERT OR UPDATE ON "public"."user_programs" FOR EACH ROW EXECUTE FUNCTION "public"."updateExpiry"();



CREATE OR REPLACE TRIGGER "update_macros" BEFORE UPDATE ON "public"."nutritional_sheets" FOR EACH ROW EXECUTE FUNCTION "public"."update_meal_macros"();



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "Exercises_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_chatbot_id_fkey" FOREIGN KEY ("chatbot_id") REFERENCES "public"."chatbots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ai_chat_messages"
    ADD CONSTRAINT "ai_chat_messages_user_program_fkey" FOREIGN KEY ("user_program") REFERENCES "public"."user_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_media"
    ADD CONSTRAINT "ai_media_chatbot_id_fkey" FOREIGN KEY ("chatbot_id") REFERENCES "public"."chatbots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment"
    ADD CONSTRAINT "assessment_organization_fkey" FOREIGN KEY ("organization") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment"
    ADD CONSTRAINT "assessment_slot_fkey" FOREIGN KEY ("slot") REFERENCES "public"."slots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_template"
    ADD CONSTRAINT "assessment_template_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment"
    ADD CONSTRAINT "assessment_template_fkey" FOREIGN KEY ("template") REFERENCES "public"."assessment_template"("id");



ALTER TABLE ONLY "public"."assessment_template"
    ADD CONSTRAINT "assessment_template_organization_fkey" FOREIGN KEY ("organization") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cancel_request"
    ADD CONSTRAINT "cancel_request_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cancel_request"
    ADD CONSTRAINT "cancel_request_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cancel_request"
    ADD CONSTRAINT "cancel_request_user_program_id_fkey" FOREIGN KEY ("user_program_id") REFERENCES "public"."user_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_form_fkey" FOREIGN KEY ("form") REFERENCES "public"."forms"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_group_fkey" FOREIGN KEY ("group") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sent_to_fkey" FOREIGN KEY ("sent_to") REFERENCES "public"."users"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_program_fkey" FOREIGN KEY ("user_program") REFERENCES "public"."user_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chatbots"
    ADD CONSTRAINT "chatbots_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chatbots"
    ADD CONSTRAINT "chatbots_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id");



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entitlements"
    ADD CONSTRAINT "entitlements_user_program_id_fkey" FOREIGN KEY ("user_program_id") REFERENCES "public"."user_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."food_cache"
    ADD CONSTRAINT "food_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_organization_fkey" FOREIGN KEY ("organization") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."nutritional_sheets"
    ADD CONSTRAINT "nutritional_sheets_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_notifications"
    ADD CONSTRAINT "org_notifications_organization_fkey" FOREIGN KEY ("organization") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_program_id_fkey" FOREIGN KEY ("user_program_id") REFERENCES "public"."user_programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_weight_id_fkey" FOREIGN KEY ("weight_id") REFERENCES "public"."weights"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "program_template_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_organization_fkey" FOREIGN KEY ("organization") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_program_fkey" FOREIGN KEY ("program") REFERENCES "public"."programs"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_trainer_fkey" FOREIGN KEY ("trainer") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_fkey" FOREIGN KEY ("user") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."slots"
    ADD CONSTRAINT "slots_assessment_fkey" FOREIGN KEY ("assessment") REFERENCES "public"."assessment"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slots"
    ADD CONSTRAINT "slots_organization_fkey" FOREIGN KEY ("organization") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."slots"
    ADD CONSTRAINT "slots_recurrence_parent_id_fkey" FOREIGN KEY ("recurrence_parent_id") REFERENCES "public"."slots"("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id");



ALTER TABLE ONLY "public"."trainer_profile"
    ADD CONSTRAINT "trainer_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_programs"
    ADD CONSTRAINT "user_programs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_programs"
    ADD CONSTRAINT "user_programs_entitlement_id_fkey" FOREIGN KEY ("entitlement_id") REFERENCES "public"."entitlements"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_programs"
    ADD CONSTRAINT "user_programs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_programs"
    ADD CONSTRAINT "user_programs_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_organisation_fkey" FOREIGN KEY ("organization") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_profile_id_fkey1" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_trainer_profile_fkey" FOREIGN KEY ("trainer_profile") REFERENCES "public"."trainer_profile"("id");



ALTER TABLE ONLY "public"."weights"
    ADD CONSTRAINT "weights_previous_fkey" FOREIGN KEY ("previous") REFERENCES "public"."weights"("id");



ALTER TABLE ONLY "public"."weights"
    ADD CONSTRAINT "weights_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_sheets"
    ADD CONSTRAINT "workout_sheets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_sheets"
    ADD CONSTRAINT "workout_sheets_user_program_id_fkey" FOREIGN KEY ("user_program_id") REFERENCES "public"."user_programs"("id") ON DELETE CASCADE;



CREATE POLICY "Policy with table joins" ON "public"."secret_tokens" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."secret_tokens" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."Start and end dates Entitlement"() TO "anon";
GRANT ALL ON FUNCTION "public"."Start and end dates Entitlement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."Start and end dates Entitlement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_progression_on_workout_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."apply_progression_on_workout_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_progression_on_workout_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_domain_uniqueness"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_domain_uniqueness"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_domain_uniqueness"() TO "service_role";



GRANT ALL ON FUNCTION "public"."copy_workouts_to_user_programs"() TO "anon";
GRANT ALL ON FUNCTION "public"."copy_workouts_to_user_programs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."copy_workouts_to_user_programs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_incomplete_workout_sheets"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_incomplete_workout_sheets"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_incomplete_workout_sheets"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_workout_sheet"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_workout_sheet"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_workout_sheet"() TO "service_role";



GRANT ALL ON FUNCTION "public"."find_kinda_similar_food"("input_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_kinda_similar_food"("input_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_kinda_similar_food"("input_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_similar_food"("input_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_similar_food"("input_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_similar_food"("input_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_sync_sets_muscle"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_sync_sets_muscle"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_sync_sets_muscle"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_latest_group_messages"("group_ids" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_latest_group_messages"("group_ids" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_latest_group_messages"("group_ids" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_latest_messages2"("program_ids" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_latest_messages2"("program_ids" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_latest_messages2"("program_ids" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_program_inductions"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_program_inductions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_program_inductions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."json_merge"("json1" "json", "json2" "json") TO "anon";
GRANT ALL ON FUNCTION "public"."json_merge"("json1" "json", "json2" "json") TO "authenticated";
GRANT ALL ON FUNCTION "public"."json_merge"("json1" "json", "json2" "json") TO "service_role";



GRANT ALL ON FUNCTION "public"."lowerCaseEmail"() TO "anon";
GRANT ALL ON FUNCTION "public"."lowerCaseEmail"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lowerCaseEmail"() TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("query_vector" "extensions"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("query_vector" "extensions"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("query_vector" "extensions"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_program_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_program_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_program_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer, "filter" "json") TO "anon";
GRANT ALL ON FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer, "filter" "json") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer, "filter" "json") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_ai_documents"("query_embedding" "extensions"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_exercises"("search_query" "text", "user_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."search_exercises"("search_query" "text", "user_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_exercises"("search_query" "text", "user_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."send_workout_feedback"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_workout_feedback"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_workout_feedback"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_organization"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_organization"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_organization"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update Equipment Required"() TO "anon";
GRANT ALL ON FUNCTION "public"."update Equipment Required"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update Equipment Required"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update calories"() TO "anon";
GRANT ALL ON FUNCTION "public"."update calories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update calories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update previous weight"() TO "anon";
GRANT ALL ON FUNCTION "public"."update previous weight"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update previous weight"() TO "service_role";



GRANT ALL ON FUNCTION "public"."updateExpiry"() TO "anon";
GRANT ALL ON FUNCTION "public"."updateExpiry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."updateExpiry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_assessment_perf_sql"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_assessment_perf_sql"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_assessment_perf_sql"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_average_ratings"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_average_ratings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_average_ratings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_best_perf_sql"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_best_perf_sql"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_best_perf_sql"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_diet_streak"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_diet_streak"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_diet_streak"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_drills_from_template"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_drills_from_template"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_drills_from_template"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_meal_macros"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_meal_macros"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_meal_macros"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_coach_from_user_programs"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_coach_from_user_programs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_coach_from_user_programs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_workout_streak"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_workout_streak"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_workout_streak"() TO "service_role";



GRANT ALL ON FUNCTION "public"."workout_new_iteration"() TO "anon";
GRANT ALL ON FUNCTION "public"."workout_new_iteration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."workout_new_iteration"() TO "service_role";



GRANT ALL ON SEQUENCE "public"."Exercises_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Exercises_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Exercises_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."nationalities" TO "anon";
GRANT ALL ON TABLE "public"."nationalities" TO "authenticated";
GRANT ALL ON TABLE "public"."nationalities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Nationalities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Nationalities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Nationalities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."slots" TO "anon";
GRANT ALL ON TABLE "public"."slots" TO "authenticated";
GRANT ALL ON TABLE "public"."slots" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Slots_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Slots_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Slots_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."User_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."User_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."User_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_chat_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_chat_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_chat_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_chat_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_vectors" TO "anon";
GRANT ALL ON TABLE "public"."ai_vectors" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_vectors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ai_media" TO "anon";
GRANT ALL ON TABLE "public"."ai_media" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_media" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ai_media_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ai_media_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ai_media_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."assessment" TO "anon";
GRANT ALL ON TABLE "public"."assessment" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment" TO "service_role";



GRANT ALL ON SEQUENCE "public"."assessment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."assessment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."assessment_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_template" TO "anon";
GRANT ALL ON TABLE "public"."assessment_template" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_template" TO "service_role";



GRANT ALL ON SEQUENCE "public"."assessment_template_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."assessment_template_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."assessment_template_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cancel_request" TO "anon";
GRANT ALL ON TABLE "public"."cancel_request" TO "authenticated";
GRANT ALL ON TABLE "public"."cancel_request" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cancel_request_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cancel_request_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cancel_request_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."certifications" TO "anon";
GRANT ALL ON TABLE "public"."certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."certifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."certifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."certifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."certifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chatbots" TO "anon";
GRANT ALL ON TABLE "public"."chatbots" TO "authenticated";
GRANT ALL ON TABLE "public"."chatbots" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chatbots_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chatbots_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chatbots_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."debug_logs" TO "anon";
GRANT ALL ON TABLE "public"."debug_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."debug_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."debug_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."debug_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."debug_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."entitlements" TO "anon";
GRANT ALL ON TABLE "public"."entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."entitlements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."entitlements_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."entitlements_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."entitlements_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."food_cache" TO "anon";
GRANT ALL ON TABLE "public"."food_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."food_cache" TO "service_role";



GRANT ALL ON SEQUENCE "public"."food_cache_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."food_cache_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."food_cache_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."forms" TO "anon";
GRANT ALL ON TABLE "public"."forms" TO "authenticated";
GRANT ALL ON TABLE "public"."forms" TO "service_role";



GRANT ALL ON SEQUENCE "public"."forms_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."forms_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."forms_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."nutritional_sheets" TO "anon";
GRANT ALL ON TABLE "public"."nutritional_sheets" TO "authenticated";
GRANT ALL ON TABLE "public"."nutritional_sheets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nutritional_sheets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nutritional_sheets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nutritional_sheets_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."org_notifications" TO "anon";
GRANT ALL ON TABLE "public"."org_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."org_notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."org_notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."org_notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."org_notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."program_template_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."program_template_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."program_template_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."secret_tokens" TO "anon";
GRANT ALL ON TABLE "public"."secret_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."secret_tokens" TO "service_role";



GRANT ALL ON SEQUENCE "public"."secret_tokens_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."secret_tokens_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."secret_tokens_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."support_tickets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."support_tickets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."support_tickets_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."support_tickets_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."support_tickets_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."support_tickets_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_messages" TO "anon";
GRANT ALL ON TABLE "public"."ticket_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ticket_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ticket_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ticket_messages_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ticket_messages_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."ticket_messages_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ticket_messages_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."trainer_profile" TO "anon";
GRANT ALL ON TABLE "public"."trainer_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."trainer_profile" TO "service_role";



GRANT ALL ON SEQUENCE "public"."trainer_profile_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trainer_profile_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trainer_profile_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_programs" TO "anon";
GRANT ALL ON TABLE "public"."user_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_programs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_programs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_programs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_programs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."weights" TO "anon";
GRANT ALL ON TABLE "public"."weights" TO "authenticated";
GRANT ALL ON TABLE "public"."weights" TO "service_role";



GRANT ALL ON SEQUENCE "public"."weights_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."weights_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."weights_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."workout_sheets" TO "anon";
GRANT ALL ON TABLE "public"."workout_sheets" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_sheets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."workout_sheets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."workout_sheets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."workout_sheets_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






