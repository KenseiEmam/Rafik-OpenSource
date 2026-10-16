-- Captured definition for audit reference; not a migration.
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
