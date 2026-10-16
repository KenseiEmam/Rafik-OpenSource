-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector)
 RETURNS TABLE(id bigint, content text, metadata jsonb, embedding vector, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        d.embedding,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM ai_vectors d
    ORDER BY d.embedding <=> query_embedding
    LIMIT 5;
END;
$function$
;
