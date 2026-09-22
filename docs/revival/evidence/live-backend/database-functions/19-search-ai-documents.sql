-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.search_ai_documents(query_embedding vector, match_count integer DEFAULT 5, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id bigint, content text, metadata jsonb, embedding jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ai_vectors.id,
    ai_vectors.content,
    ai_vectors.metadata,
    (ai_vectors.embedding::text)::jsonb as embedding,
    1 - (ai_vectors.embedding <=> query_embedding) as similarity
  FROM ai_vectors
  WHERE
    ai_vectors.metadata @> filter   -- apply metadata filter if provided
  ORDER BY ai_vectors.embedding <=> query_embedding DESC
  LIMIT match_count;
END;
$function$
;
