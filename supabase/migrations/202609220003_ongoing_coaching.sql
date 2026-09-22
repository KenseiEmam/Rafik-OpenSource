-- Small explicit coaching domains. No delivery provider or workflow triggers.
create table public.coaching_forms (
 id uuid primary key, coach_id uuid not null references public.profiles(id) on delete cascade,
 title text not null, kind text not null check(kind in('checkin','assessment')), fields jsonb not null,
 revision int not null default 1, updated_at timestamptz not null default now()
);
create table public.coaching_requests (
 id uuid primary key default gen_random_uuid(), series_id uuid not null, relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 form_id uuid references public.coaching_forms(id) on delete set null, form_revision int not null,
 title text not null, kind text not null, fields jsonb not null, due_date date not null,
 answers jsonb not null default '{}', revision int not null default 1,
 submitted_at timestamptz, reviewed_at timestamptz, feedback text not null default '', cancelled boolean not null default false,
 updated_at timestamptz not null default now(), unique(series_id,due_date)
);
create index requests_relationship_due on public.coaching_requests(relationship_id,due_date);
create table public.measurements (
 id uuid primary key, client_id uuid not null references public.profiles(id) on delete cascade,
 relationship_id uuid references public.coach_clients(id) on delete cascade,
 metric text not null check(metric in('weight','waist')), measured_on date not null,
 value numeric not null check(value>0 and value<=2000), unit text not null check(unit in('kg','lb','cm','in')),
 revision int not null default 1, check((metric='weight' and unit in('kg','lb')) or (metric='waist' and unit in('cm','in')))
);
create index measurements_owner_date on public.measurements(client_id,measured_on);
create table public.messages (
 id uuid primary key, sequence bigint generated always as identity unique,
 relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 sender_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 4000),
 session_id uuid references public.sessions(id) on delete set null,
 request_id uuid references public.coaching_requests(id) on delete set null,
 created_at timestamptz not null default now(), check(session_id is null or request_id is null)
);
create index messages_conversation on public.messages(relationship_id,sequence desc);
create table public.conversation_reads (
 id uuid primary key default gen_random_uuid(), relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade, last_sequence bigint not null default 0,
 unique(relationship_id,user_id)
);

create function public.validate_coaching_fields(p jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
declare f jsonb; ids text[]:='{}'::text[]; begin
 if jsonb_typeof(p) is distinct from 'array' then raise exception 'invalid_fields'; end if;
 if jsonb_array_length(p) not between 1 and 10 then raise exception 'invalid_fields'; end if;
 for f in select value from jsonb_array_elements(p) loop
  if jsonb_typeof(f) is distinct from 'object' or coalesce(f->>'id','') !~ '^[a-zA-Z0-9_-]{1,64}$' or f->>'id'=any(ids)
   or char_length(trim(coalesce(f->>'label',''))) not between 1 and 160 or coalesce(f->>'type','') not in('text','number','boolean')
   or jsonb_typeof(f->'required') is distinct from 'boolean' or char_length(coalesce(f->>'unit',''))>24 then raise exception 'invalid_fields'; end if;
  if f->>'type'='number' then
   if (f ? 'min' and jsonb_typeof(f->'min')<>'number') or (f ? 'max' and jsonb_typeof(f->'max')<>'number') then raise exception 'invalid_fields'; end if;
   if (f->>'min')::numeric>(f->>'max')::numeric then raise exception 'invalid_fields'; end if;
  end if;
  ids:=array_append(ids,f->>'id');
 end loop;
end $$;
create function public.save_coaching_form(p_id uuid,p_title text,p_kind text,p_fields jsonb,p_revision int) returns public.coaching_forms
language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.coaching_forms; begin
 if auth.uid() is null then raise exception 'forbidden'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into f from public.coaching_forms where id=p_id;
 if found and f.coach_id<>auth.uid() then raise exception 'forbidden'; end if;
 perform public.validate_coaching_fields(p_fields);
 if char_length(trim(coalesce(p_title,''))) not between 1 and 100 or coalesce(p_kind,'') not in('checkin','assessment') then raise exception 'invalid_form'; end if;
 if f.id is not null and f.title=trim(p_title) and f.kind=p_kind and f.fields=p_fields then return f; end if;
 if p_revision is null or coalesce(f.revision,0)<>p_revision then raise exception 'conflict'; end if;
 insert into public.coaching_forms(id,coach_id,title,kind,fields) values(p_id,auth.uid(),trim(p_title),p_kind,p_fields)
 on conflict(id) do update set title=excluded.title,kind=excluded.kind,fields=excluded.fields,revision=coaching_forms.revision+1,updated_at=now() returning * into f;
 return f;
end $$;
create function public.assign_coaching_form(p_series uuid,p_relationship uuid,p_form uuid,p_revision int,p_due date,p_count int,p_interval int) returns setof public.coaching_requests
language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.coaching_forms; r public.coach_clients; existing public.coaching_requests; begin
 select * into r from public.coach_clients where id=p_relationship and coach_id=auth.uid() for update;
 if not found then raise exception 'forbidden'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_series::text,0));
 select * into existing from public.coaching_requests where series_id=p_series order by due_date limit 1;
 if found then
  if existing.relationship_id<>p_relationship or existing.form_id<>p_form or existing.form_revision<>p_revision or existing.due_date<>p_due
   or (select count(*) from public.coaching_requests where series_id=p_series)<>p_count
   or exists(select 1 from (select due_date,row_number() over(order by due_date)-1 n from public.coaching_requests where series_id=p_series) x where x.due_date<>p_due+x.n::int*p_interval)
   then raise exception 'conflict'; end if;
  return query select * from public.coaching_requests where series_id=p_series order by due_date; return;
 end if;
 if r.state<>'active' then raise exception 'relationship_archived'; end if;
 select * into f from public.coaching_forms where id=p_form and coach_id=auth.uid();
 if not found then raise exception 'forbidden'; end if;
 if f.revision is distinct from p_revision then raise exception 'conflict'; end if;
 if p_due is null or p_due<current_date-366 or p_due>current_date+366 or p_count is null or p_count not between 1 and 12 or p_interval is null or p_interval not in(7,14) then raise exception 'invalid_schedule'; end if;
 return query insert into public.coaching_requests(series_id,relationship_id,form_id,form_revision,title,kind,fields,due_date)
 select p_series,r.id,f.id,f.revision,f.title,f.kind,f.fields,p_due+n*p_interval from generate_series(0,p_count-1) n returning *;
end $$;
create function public.save_coaching_response(p_id uuid,p_answers jsonb,p_revision int,p_submit boolean) returns public.coaching_requests
language plpgsql security definer set search_path=public,pg_temp as $$
declare q public.coaching_requests; r public.coach_clients; f jsonb; a jsonb; begin
 select c.* into r from public.coach_clients c join public.coaching_requests x on x.relationship_id=c.id where x.id=p_id and c.client_id=auth.uid() for update of c;
 if not found then raise exception 'forbidden'; end if;
 select * into q from public.coaching_requests where id=p_id for update;
 if q.answers=p_answers and (not p_submit or q.submitted_at is not null) and not q.cancelled then return q; end if;
 if r.state<>'active' or q.cancelled then raise exception 'request_unavailable'; end if;
 if p_revision is distinct from q.revision then raise exception 'conflict'; end if;
 if p_submit is null or jsonb_typeof(p_answers) is distinct from 'object' then raise exception 'invalid_answers'; end if;
 if exists(select 1 from jsonb_object_keys(p_answers) k where not exists(select 1 from jsonb_array_elements(q.fields) field where field->>'id'=k)) then raise exception 'invalid_answers'; end if;
 for f in select value from jsonb_array_elements(q.fields) loop
  a:=p_answers->(f->>'id');
  if a is null or a='null'::jsonb or a='""'::jsonb then
   if (p_submit or q.submitted_at is not null) and (f->>'required')::boolean then raise exception 'required_answer'; end if;
  elsif f->>'type'='text' then
   if jsonb_typeof(a)<>'string' or char_length(a#>>'{}')>2000 then raise exception 'invalid_answers'; end if;
   if (p_submit or q.submitted_at is not null) and (f->>'required')::boolean and trim(a#>>'{}')='' then raise exception 'required_answer'; end if;
  elsif f->>'type'='boolean' then
   if jsonb_typeof(a)<>'boolean' then raise exception 'invalid_answers'; end if;
  else
   if jsonb_typeof(a)<>'number' then raise exception 'invalid_answers'; end if;
   if abs((a#>>'{}')::numeric)>1000000 or (a#>>'{}')::numeric<(f->>'min')::numeric or (a#>>'{}')::numeric>(f->>'max')::numeric then raise exception 'invalid_answers'; end if;
  end if;
 end loop;
 update public.coaching_requests set answers=p_answers,submitted_at=case when p_submit then coalesce(submitted_at,now()) else submitted_at end,
 reviewed_at=null,feedback='',revision=revision+1,updated_at=now() where id=p_id returning * into q; return q;
end $$;
create function public.review_coaching_response(p_id uuid,p_revision int,p_feedback text) returns public.coaching_requests
language plpgsql security definer set search_path=public,pg_temp as $$
declare q public.coaching_requests; begin
 select x.* into q from public.coaching_requests x join public.coach_clients c on c.id=x.relationship_id where x.id=p_id and c.coach_id=auth.uid() for update of x;
 if not found then raise exception 'forbidden'; end if;
 if q.submitted_at is null or char_length(coalesce(p_feedback,''))>2000 then raise exception 'invalid_review'; end if;
 if q.reviewed_at is not null and q.feedback=p_feedback and q.revision=p_revision+1 then return q; end if;
 if p_revision is distinct from q.revision then raise exception 'conflict'; end if;
 update public.coaching_requests set feedback=coalesce(p_feedback,''),reviewed_at=now(),revision=revision+1,updated_at=now() where id=p_id returning * into q; return q;
end $$;
create function public.cancel_coaching_request(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare q public.coaching_requests; begin
 select x.* into q from public.coaching_requests x join public.coach_clients c on c.id=x.relationship_id where x.id=p_id and c.coach_id=auth.uid() for update of x;
 if not found then raise exception 'forbidden'; end if;
 if q.cancelled then return; end if;
 if q.submitted_at is not null then raise exception 'already_submitted'; end if;
 if q.revision is distinct from p_revision then raise exception 'conflict'; end if;
 update public.coaching_requests set cancelled=true,revision=revision+1 where id=p_id;
end $$;
create function public.save_measurement(p_id uuid,p_relationship uuid,p_metric text,p_date date,p_value numeric,p_unit text,p_revision int) returns public.measurements
language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.measurements; begin
 if auth.uid() is null then raise exception 'forbidden'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into m from public.measurements where id=p_id;
 if found and m.client_id<>auth.uid() then raise exception 'forbidden'; end if;
 if m.id is not null and m.relationship_id is not distinct from p_relationship and m.metric=p_metric and m.measured_on=p_date and m.value=p_value and m.unit=p_unit then return m; end if;
 if p_revision is distinct from coalesce(m.revision,0) then raise exception 'conflict'; end if;
 if p_relationship is not null and not exists(select 1 from public.coach_clients where id=p_relationship and client_id=auth.uid() and state='active') then raise exception 'forbidden'; end if;
 if p_date is null or p_date> (select (now() at time zone timezone)::date from public.profiles where id=auth.uid()) or p_date<current_date-3650
 or p_value is null or p_value<=0 or p_value>2000 or coalesce(p_metric,'') not in('weight','waist')
 or not ((p_metric='weight' and p_unit in('kg','lb')) or (p_metric='waist' and p_unit in('cm','in'))) or p_unit is null then raise exception 'invalid_measurement'; end if;
 insert into public.measurements(id,client_id,relationship_id,metric,measured_on,value,unit) values(p_id,auth.uid(),p_relationship,p_metric,p_date,p_value,p_unit)
 on conflict(id) do update set relationship_id=excluded.relationship_id,metric=excluded.metric,measured_on=excluded.measured_on,value=excluded.value,unit=excluded.unit,revision=measurements.revision+1 returning * into m; return m;
end $$;
create function public.remove_measurement(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.measurements; begin
 select * into m from public.measurements where id=p_id for update;
 if not found then return; end if;
 if m.client_id<>auth.uid() then raise exception 'forbidden'; end if;
 if m.revision is distinct from p_revision then raise exception 'conflict'; end if;
 delete from public.measurements where id=p_id;
end $$;
create function public.send_message(p_id uuid,p_relationship uuid,p_body text,p_session uuid default null,p_request uuid default null) returns public.messages
language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.messages;r public.coach_clients;begin
 select * into r from public.coach_clients where id=p_relationship and auth.uid() in(coach_id,client_id) for update;
 if not found then raise exception 'forbidden'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into m from public.messages where id=p_id;
 if found then
  if m.sender_id<>auth.uid() or m.relationship_id<>p_relationship or m.body is distinct from trim(p_body) or m.session_id is distinct from p_session or m.request_id is distinct from p_request then raise exception 'conflict'; end if;
  return m;
 end if;
 if r.state<>'active' then raise exception 'relationship_archived'; end if;
 if char_length(trim(coalesce(p_body,''))) not between 1 and 4000 or (p_session is not null and p_request is not null) then raise exception 'invalid_message'; end if;
 if p_session is not null and not exists(select 1 from public.sessions where id=p_session and coach_id=r.coach_id and client_id=r.client_id) then raise exception 'invalid_context'; end if;
 if p_request is not null and not exists(select 1 from public.coaching_requests where id=p_request and relationship_id=r.id) then raise exception 'invalid_context'; end if;
 insert into public.messages(id,relationship_id,sender_id,body,session_id,request_id) values(p_id,r.id,auth.uid(),trim(p_body),p_session,p_request) returning * into m;return m;
end $$;
create function public.mark_conversation_read(p_relationship uuid,p_sequence bigint) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from public.coach_clients where id=p_relationship and auth.uid() in(coach_id,client_id)) then raise exception 'forbidden'; end if;
 if not exists(select 1 from public.messages where relationship_id=p_relationship and sequence=p_sequence) then raise exception 'invalid_cursor'; end if;
 insert into public.conversation_reads(relationship_id,user_id,last_sequence) values(p_relationship,auth.uid(),p_sequence)
 on conflict(relationship_id,user_id) do update set last_sequence=greatest(conversation_reads.last_sequence,excluded.last_sequence);
end $$;
create function public.conversation_inbox() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'state',c.state,'coach_id',c.coach_id,'client_id',c.client_id,'name',p.display_name,
 'unread',(select count(*) from public.messages m where m.relationship_id=c.id and m.sender_id<>auth.uid() and m.sequence>coalesce(r.last_sequence,0)),
 'latest',(select body from public.messages where relationship_id=c.id order by sequence desc limit 1),
 'updated_at',(select created_at from public.messages where relationship_id=c.id order by sequence desc limit 1)) order by c.created_at desc),'[]'::jsonb)
 from public.coach_clients c join public.profiles p on p.id=case when c.coach_id=auth.uid() then c.client_id else c.coach_id end
 left join public.conversation_reads r on r.relationship_id=c.id and r.user_id=auth.uid() where auth.uid() in(c.coach_id,c.client_id);
$$;
-- Returns only acknowledged actuals visible in this relationship, or the client's own records.
create function public.training_progress(p_relationship uuid,p_from date,p_to date) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; client uuid:=auth.uid(); result jsonb;begin
 if client is null then raise exception 'forbidden'; end if;
 if p_relationship is not null then
 select * into c from public.coach_clients where id=p_relationship and auth.uid() in(coach_id,client_id);
 if not found then raise exception 'forbidden'; end if; client:=c.client_id;
 end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>365 then raise exception 'invalid_window'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'date',s.local_date,'title',s.title,'exercises',(
 select coalesce(jsonb_agg(jsonb_build_object('id',e->>'exerciseId','name',coalesce(e#>>'{info,name}',(select name from public.exercises where id=e->>'exerciseId'),e->>'exerciseId'),'name_ar',coalesce(e#>>'{info,name_ar}',e#>>'{info,name}',(select name_ar from public.exercises where id=e->>'exerciseId'),e->>'exerciseId'),'kind',coalesce(e->>'kind','strength'),
 'sets',(select coalesce(jsonb_agg(to_jsonb(x)-'session_id' order by x.set_index),'[]'::jsonb) from public.set_entries x where x.session_id=s.id and x.exercise_key=e->>'key' and x.completed))),'[]'::jsonb) from jsonb_array_elements(s.prescription->'exercises') e
 )) order by s.local_date,s.completed_at),'[]'::jsonb) into result from public.sessions s
 where s.client_id=client and (p_relationship is null or s.coach_id=c.coach_id) and s.status='completed' and s.local_date between p_from and p_to; return result;
end $$;

alter table public.coaching_forms enable row level security;
alter table public.coaching_requests enable row level security;
alter table public.measurements enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;
create policy forms_owner on public.coaching_forms for select to authenticated using(coach_id=auth.uid());
create policy requests_participant on public.coaching_requests for select to authenticated using(exists(select 1 from public.coach_clients c where c.id=relationship_id and auth.uid() in(c.coach_id,c.client_id)));
create policy measurements_shared on public.measurements for select to authenticated using(client_id=auth.uid() or exists(select 1 from public.coach_clients c where c.id=relationship_id and c.coach_id=auth.uid()));
create policy messages_participant on public.messages for select to authenticated using(exists(select 1 from public.coach_clients c where c.id=relationship_id and auth.uid() in(c.coach_id,c.client_id)));
create policy reads_owner on public.conversation_reads for select to authenticated using(user_id=auth.uid());
revoke all on public.coaching_forms,public.coaching_requests,public.measurements,public.messages,public.conversation_reads from anon,authenticated;
grant select on public.coaching_forms,public.coaching_requests,public.measurements,public.messages,public.conversation_reads to authenticated;
revoke all on function public.validate_coaching_fields(jsonb),public.save_coaching_form(uuid,text,text,jsonb,int),public.assign_coaching_form(uuid,uuid,uuid,int,date,int,int),public.save_coaching_response(uuid,jsonb,int,boolean),public.review_coaching_response(uuid,int,text),public.cancel_coaching_request(uuid,int),public.save_measurement(uuid,uuid,text,date,numeric,text,int),public.remove_measurement(uuid,int),public.send_message(uuid,uuid,text,uuid,uuid),public.mark_conversation_read(uuid,bigint),public.conversation_inbox(),public.training_progress(uuid,date,date) from public,anon;
grant execute on function public.save_coaching_form(uuid,text,text,jsonb,int),public.assign_coaching_form(uuid,uuid,uuid,int,date,int,int),public.save_coaching_response(uuid,jsonb,int,boolean),public.review_coaching_response(uuid,int,text),public.cancel_coaching_request(uuid,int),public.save_measurement(uuid,uuid,text,date,numeric,text,int),public.remove_measurement(uuid,int),public.send_message(uuid,uuid,text,uuid,uuid),public.mark_conversation_read(uuid,bigint),public.conversation_inbox(),public.training_progress(uuid,date,date) to authenticated;
