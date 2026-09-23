-- Read projections only: source records remain authoritative. Invoker functions retain RLS.
create index if not exists sessions_pending_review on public.sessions(coach_id,completed_at,id) where status='completed' and reviewed_at is null;
create index if not exists sessions_client_feedback on public.sessions(client_id,reviewed_at desc) where coach_note<>'';
drop function if exists public.coach_attention(text,timestamptz,text,int);
create or replace function public.coach_attention(p_kind text default 'all',p_after_time timestamptz default null,p_after_key text default '',p_limit int default 12,p_search text default '')
returns jsonb language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'forbidden'; end if;
 if length(p_search)>100 or p_kind not in('all','workout','checkin','message') or p_limit not between 1 and 50 or p_limit is null then raise exception 'invalid_filter'; end if;
 with tasks as (
 select 'workout:'||s.id as key,'workout'::text as kind,s.id,c.id relationship_id,p.display_name as name,s.prescription->>'name' as title,s.completed_at as happened_at,0::bigint unread,s.note as detail
 from sessions s join coach_clients c on c.coach_id=s.coach_id and c.client_id=s.client_id join profiles p on p.id=s.client_id
 where s.coach_id=auth.uid() and s.status='completed' and s.reviewed_at is null
 union all
 select 'checkin:'||q.id,'checkin',q.id,c.id,p.display_name,q.title,q.submitted_at,0::bigint,''::text
 from coaching_requests q join coach_clients c on c.id=q.relationship_id join profiles p on p.id=c.client_id
 where c.coach_id=auth.uid() and q.submitted_at is not null and q.reviewed_at is null and not q.cancelled
 union all
 select 'message:'||c.id,'message',c.id,c.id,p.display_name,''::text,max(m.created_at),count(*),''::text
 from coach_clients c join profiles p on p.id=c.client_id join messages m on m.relationship_id=c.id and m.sender_id<>auth.uid()
 left join conversation_reads r on r.relationship_id=c.id and r.user_id=auth.uid()
 where c.coach_id=auth.uid() and m.sequence>coalesce(r.last_sequence,0) group by c.id,p.display_name
 ), filtered as (select * from tasks where (p_kind='all' or kind=p_kind) and strpos(lower(name||' '||title||' '||detail),lower(trim(p_search)))>0), page as (
 select * from filtered where p_after_time is null or (happened_at,key)>(p_after_time,p_after_key) order by happened_at,key limit p_limit
 ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(page) order by happened_at,key) from page),'[]'),
 'total',(select count(*) from filtered),'clients',(select count(*) from coach_clients where coach_id=auth.uid() and state='active'),
 'plans',(select count(*) from plans where coach_id=auth.uid())) into result;
 return result;
end $$;
create or replace function public.client_today() returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object(
 'relationships',coalesce((select jsonb_agg(c) from coach_clients c where client_id=auth.uid()),'[]'),
 'assignments',coalesce((select jsonb_agg(a) from assignments a join coach_clients c on c.id=a.relationship_id where a.client_id=auth.uid() and a.state='active' and c.state='active'),'[]'),
 'versions',coalesce((select jsonb_agg(v) from plan_versions v where id in(select a.version_id from assignments a join coach_clients c on c.id=a.relationship_id where a.client_id=auth.uid() and a.state='active' and c.state='active')),'[]'),
 'people',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'display_name',p.display_name)) from profiles p where id in(select coach_id from coach_clients where client_id=auth.uid())),'[]'),
 'feedback',coalesce((select jsonb_agg(s) from (select id,coach_note,reviewed_at from sessions where client_id=auth.uid() and coach_note<>'' order by reviewed_at desc,id limit 1) s),'[]')) where auth.uid() is not null;
$$;
create or replace function public.coach_roster(p_search text default '',p_state text default 'active',p_after_name text default null,p_after_id uuid default null,p_limit int default 12)
returns jsonb language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'forbidden'; end if;
 if p_state not in('active','archived') or length(p_search)>100 or p_limit not between 1 and 50 or p_limit is null then raise exception 'invalid_filter'; end if;
 with found as (
 select c.*,p.display_name from coach_clients c join profiles p on p.id=c.client_id
 where c.coach_id=auth.uid() and c.state=p_state and strpos(lower(p.display_name),lower(trim(p_search)))>0
 ), page as (select * from found where p_after_name is null or (lower(display_name),id)>(p_after_name,p_after_id) order by lower(display_name),id limit p_limit)
 select jsonb_build_object('total',(select count(*) from found),'items',coalesce((select jsonb_agg(to_jsonb(page) order by lower(display_name),id) from page),'[]'),
 'assignments',coalesce((select jsonb_agg(a) from assignments a where a.state='active' and a.relationship_id in(select id from page)),'[]')) into result;
 return result;
end $$;
revoke all on function public.coach_attention(text,timestamptz,text,int,text),public.client_today(),public.coach_roster(text,text,text,uuid,int) from public,anon;
grant execute on function public.coach_attention(text,timestamptz,text,int,text),public.client_today(),public.coach_roster(text,text,text,uuid,int) to authenticated;
notify pgrst,'reload schema';
