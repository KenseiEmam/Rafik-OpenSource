-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.match_documents(query_vector vector, match_count integer DEFAULT 5, filter jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(id bigint, content text, metadata jsonb, embedding vector, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
    SELECT
      d.id,
      d.content,
      d.metadata,
      d.embedding,
      1 - (d.embedding <=> query_vector) AS similarity
    FROM ai_vectors d
    WHERE filter IS NULL OR d.metadata @> filter
    ORDER BY d.embedding <=> query_vector
    LIMIT match_count;
END;
$function$
;
