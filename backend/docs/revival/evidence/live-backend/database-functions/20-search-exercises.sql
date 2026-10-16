-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.search_exercises(search_query text, user_id bigint)
 RETURNS SETOF exercises
 LANGUAGE sql
AS $function$
  select *
  from exercises
  where (trainer_id = user_id or trainer_id is null)
    and (
      exercise_name ilike '%' || search_query || '%'
      or exercise_detail ilike '%' || search_query || '%'
      or array_to_string(prime, ' ') ilike '%' || search_query || '%'
    );
$function$
;
