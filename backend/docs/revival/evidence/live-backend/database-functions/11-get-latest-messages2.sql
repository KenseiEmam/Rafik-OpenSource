-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.get_latest_messages2(program_ids integer[])
 RETURNS TABLE(id bigint, user_program bigint, content text, created_at timestamp with time zone, seen_at timestamp with time zone, media text[], sent_by bigint, form bigint)
 LANGUAGE plpgsql
AS $function$
begin
  return query
  select distinct on (cm.user_program) 
    cm.id, 
    cm.user_program,
    cm.content,
    cm.created_at,
    cm.seen_at,
    cm.media,
    cm.sent_by,
    cm.form
  from
    chat_messages cm
  where
    cm.user_program = any(program_ids)
  order by
    cm.user_program, cm.created_at desc;
end;
$function$
;
