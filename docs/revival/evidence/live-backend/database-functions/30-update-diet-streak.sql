-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.update_diet_streak()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
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
END;$function$
;
