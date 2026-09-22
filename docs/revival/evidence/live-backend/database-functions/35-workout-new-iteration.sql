-- Captured definition for audit reference; not a migration.
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
