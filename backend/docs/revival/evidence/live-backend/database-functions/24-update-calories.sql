-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public."update calories"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
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
END;$function$
;
