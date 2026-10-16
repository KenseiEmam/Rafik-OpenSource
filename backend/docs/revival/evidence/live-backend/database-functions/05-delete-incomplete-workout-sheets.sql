-- Captured definition for audit reference; not a migration.
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
