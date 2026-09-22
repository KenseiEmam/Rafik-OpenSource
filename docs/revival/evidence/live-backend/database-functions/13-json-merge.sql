-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.json_merge(json1 json, json2 json)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_object_agg(key, value)
  INTO result
  FROM (
    SELECT key, value FROM json_each(json1)
    UNION ALL
    SELECT key, value FROM json_each(json2)
  ) AS kv;
  RETURN result;
END;
$function$
;
