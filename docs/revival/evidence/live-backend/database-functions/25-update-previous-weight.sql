-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public."update previous weight"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
previous_id int8; 
begin

SELECT id
FROM weights
into previous_id
WHERE profile_id = new.profile_id
ORDER BY created_at DESC
LIMIT 1;

UPDATE weights
SET previous = previous_id
WHERE id = new.id;

return new;

end;$function$
;
