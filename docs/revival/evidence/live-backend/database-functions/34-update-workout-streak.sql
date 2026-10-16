-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.update_workout_streak()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
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
END;$function$
;
