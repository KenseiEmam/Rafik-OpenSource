-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.search_ai_documents(query_embedding vector, match_count integer, filter json DEFAULT NULL::json)
 RETURNS TABLE(id uuid, content text, chatbot_id uuid, metadata json, embedding vector, similarity numeric)
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.chatbot_id,
    d.metadata,
    d.embedding,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE
    (filter IS NULL OR d.metadata ->> 'chatbot_id' = filter ->> 'chatbot_id')
  ORDER BY similarity DESC
  LIMIT match_count;
END;$function$
;
