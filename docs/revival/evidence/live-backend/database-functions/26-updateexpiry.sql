-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public."updateExpiry"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    -- Always update expires_on when inserting a new row or when latest_start changes
    IF TG_OP = 'INSERT' OR OLD.latest_start IS DISTINCT FROM NEW.latest_start THEN
        NEW.expires_on := NEW.latest_start + INTERVAL '1 month' * NEW.months_package;
    END IF;
    
    RETURN NEW;
END;$function$
;
