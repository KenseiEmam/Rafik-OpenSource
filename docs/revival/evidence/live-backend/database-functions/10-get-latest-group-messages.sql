-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.get_latest_group_messages(group_ids bigint[])
 RETURNS TABLE(id bigint, group_id bigint, content text, created_at timestamp with time zone, seen_at timestamp with time zone, media text[], sent_by bigint, sender_first_name text, sender_last_name text, sender_avatar text)
 LANGUAGE plpgsql
AS $function$
begin
  return query
  select distinct on (cm.group)
    cm.id,
    cm.group,
    cm.content,
    cm.created_at,
    cm.seen_at,
    cm.media,
    cm.sent_by,
    u.first_name,
    u.last_name,
    u.avatar
  from chat_messages cm
  join users u on cm.sent_by = u.id
  where cm.group = any(group_ids)
  order by cm.group, cm.created_at desc;
end;
$function$
;
