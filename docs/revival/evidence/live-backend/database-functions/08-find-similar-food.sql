-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.find_similar_food(input_query text)
 RETURNS TABLE(id bigint, normalized_query text, response jsonb, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$SELECT id, normalized_query, response,
         similarity(normalized_query, input_query) AS similarity
  FROM food_cache
  WHERE similarity(normalized_query, input_query) > 0.9
  ORDER BY similarity DESC
  LIMIT 1;$function$
;
