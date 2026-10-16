-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.update_best_perf_sql()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
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
END;$function$
;
