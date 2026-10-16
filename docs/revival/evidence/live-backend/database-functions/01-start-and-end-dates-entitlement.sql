-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public."Start and end dates Entitlement"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Check if the status is being updated to 'active'
  IF NEW.status = 'active' THEN
    -- Set start_date to the current date
    NEW.start_date := CURRENT_DATE;
    -- Set end_date to one month later
    NEW.end_date := CURRENT_DATE + INTERVAL '1 month';
  END IF;
  
  RETURN NEW;
END;$function$
;
