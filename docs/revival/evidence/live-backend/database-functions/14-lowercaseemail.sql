-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public."lowerCaseEmail"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  NEW.email := LOWER(NEW.email);
  RETURN NEW;
END;$function$
;
