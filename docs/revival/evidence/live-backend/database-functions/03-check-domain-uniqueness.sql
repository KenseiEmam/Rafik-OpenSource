-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.check_domain_uniqueness()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- If the new record doesn't have domains, no check is needed.
  IF NEW.domains IS NULL OR cardinality(NEW.domains) = 0 THEN
    RETURN NEW;
  END IF;

  -- Check for any existing organization (other than the current one) that has overlapping domains
  SELECT count(*) INTO conflict_count
  FROM organizations
  WHERE id <> COALESCE(NEW.id, 0)
    AND domains && NEW.domains;

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'The provided domains conflict with an existing organization''s domains.';
  END IF;

  RETURN NEW;
END;
$function$
;
