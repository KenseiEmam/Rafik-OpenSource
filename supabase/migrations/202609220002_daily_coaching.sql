-- Daily coaching: explicit ownership, richer prescriptions and bounded schedules.
alter table public.exercises add column owner_id uuid references public.profiles(id) on delete cascade;
alter table public.exercises add column kind text not null default 'strength' check(kind in ('strength','timed','distance'));
alter table public.exercises add column media_url text not null default '';
alter table public.exercises add column revision integer not null default 1;
create index exercises_owner on public.exercises(owner_id);
drop policy catalog_read on public.exercises;
create policy shared_catalog on public.exercises for select to anon,authenticated using(owner_id is null and active);
create policy own_catalog on public.exercises for select to authenticated using(owner_id=auth.uid());

create table public.client_context (
 id uuid primary key references public.coach_clients(id) on delete cascade,
 goals text not null default '' check(length(goals)<=2000),
 constraints text not null default '' check(length(constraints)<=2000),
 notes text not null default '' check(length(notes)<=5000),
 revision integer not null default 1, updated_at timestamptz not null default now()
);
alter table public.client_context enable row level security;
create policy coach_context on public.client_context for select to authenticated using(exists(select 1 from public.coach_clients c where c.id=client_context.id and c.coach_id=auth.uid()));
grant select on public.client_context to authenticated;

create function public.save_client_context(p_id uuid,p_goals text,p_constraints text,p_notes text,p_revision int) returns public.client_context
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.client_context;
begin
 perform 1 from public.coach_clients where id=p_id and coach_id=auth.uid() for update;
 if not found then raise exception 'forbidden'; end if;
 select * into r from public.client_context where id=p_id;
 if found then
  if r.goals=p_goals and r.constraints=p_constraints and r.notes=p_notes and r.revision in(p_revision,p_revision+1) then return r; end if;
  if r.revision is distinct from p_revision then raise exception 'conflict'; end if;
  update public.client_context set goals=p_goals,constraints=p_constraints,notes=p_notes,revision=revision+1,updated_at=now() where id=p_id returning * into r;
 else
  if p_revision is distinct from 0 then raise exception 'conflict'; end if;
  insert into public.client_context(id,goals,constraints,notes) values(p_id,p_goals,p_constraints,p_notes) returning * into r;
 end if; return r;
end $$;
create function public.set_client_state(p_id uuid,p_state text) returns public.coach_clients
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.coach_clients;
begin
 update public.coach_clients set state=p_state where id=p_id and coach_id=auth.uid() returning * into r;
 if not found then raise exception 'forbidden'; end if; return r;
end $$;
create function public.save_exercise(p_id text,p_data jsonb,p_revision int) returns public.exercises
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.exercises;
begin
 if auth.uid() is null then raise exception 'unauthenticated'; end if;
 if length(p_id) not between 1 and 100 or length(coalesce(p_data->>'name','')) not between 1 and 120
 or length(coalesce(p_data->>'instructions','')) not between 1 and 2000
 or length(coalesce(p_data->>'name_ar',''))>120 or length(coalesce(p_data->>'instructions_ar',''))>2000
 or length(coalesce(p_data->>'equipment',''))>120 or length(coalesce(p_data->>'movement',''))>80
 or length(coalesce(p_data->>'equipment_ar',''))>120
 or coalesce(p_data->>'kind','') not in('strength','timed','distance')
 or (coalesce(p_data->>'media_url','')<>'' and (p_data->>'media_url' !~ '^https://[^[:space:]]+$' or length(p_data->>'media_url')>1000))
 then raise exception 'invalid_exercise'; end if;
 -- Serialize creates and edits of this catalog identity without locking unrelated exercises.
 perform pg_advisory_xact_lock(hashtextextended(p_id,0));
 select * into r from public.exercises where id=p_id for update;
 if found then
  if r.owner_id is distinct from auth.uid() then raise exception 'forbidden'; end if;
  if r.revision is distinct from p_revision then
   if r.revision=p_revision+1 and (to_jsonb(r)-'id'-'owner_id'-'revision'-'active')=p_data then return r; end if;
   raise exception 'conflict';
  end if;
  update public.exercises set name=p_data->>'name',name_ar=coalesce(nullif(p_data->>'name_ar',''),p_data->>'name'),equipment=coalesce(p_data->>'equipment',''),equipment_ar=coalesce(p_data->>'equipment_ar',''),instructions=p_data->>'instructions',instructions_ar=coalesce(nullif(p_data->>'instructions_ar',''),p_data->>'instructions'),movement=coalesce(p_data->>'movement',''),kind=p_data->>'kind',media_url=coalesce(p_data->>'media_url',''),revision=revision+1 where id=p_id returning * into r;
 else
  if p_revision is distinct from 0 then raise exception 'conflict'; end if;
  insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url)
  values(p_id,auth.uid(),p_data->>'name',coalesce(nullif(p_data->>'name_ar',''),p_data->>'name'),coalesce(p_data->>'equipment',''),coalesce(p_data->>'equipment_ar',''),p_data->>'instructions',coalesce(nullif(p_data->>'instructions_ar',''),p_data->>'instructions'),coalesce(p_data->>'movement',''),p_data->>'kind',coalesce(p_data->>'media_url','')) returning * into r;
 end if; return r;
end $$;
create function public.set_exercise_active(p_id text,p_active boolean) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.exercises set active=p_active where id=p_id and owner_id=auth.uid();
 if not found then raise exception 'forbidden'; end if;
end $$;

create or replace function public.validate_prescription(p jsonb) returns void
language plpgsql set search_path=public,pg_temp as $$
declare d jsonb; e jsonb; target jsonb; day_ids text[]:=array[]::text[]; slots text[]:=array[]::text[]; keys text[]; slot text; kind text; training int:=0;
begin
 if jsonb_typeof(p) is distinct from 'object' or coalesce(p->>'schema','') not in('1','2') or jsonb_typeof(p->'days') is distinct from 'array' then raise exception 'invalid_plan'; end if;
 if jsonb_array_length(p->'days') not between 1 and 84 or coalesce((p->>'cycleWeeks')::int,1) not between 1 and 12 then raise exception 'invalid_day_count'; end if;
 for d in select value from jsonb_array_elements(p->'days') loop
  if nullif(d->>'id','') is null or d->>'id'=any(day_ids) or length(coalesce(d->>'name','')) not between 1 and 80
   or jsonb_typeof(d->'exercises') is distinct from 'array' then raise exception 'invalid_day'; end if;
  day_ids:=array_append(day_ids,d->>'id'); keys:=array[]::text[];
  if p->>'schema'='2' then
   if coalesce((d->>'week')::int,0) not between 1 and coalesce((p->>'cycleWeeks')::int,1) or coalesce((d->>'weekday')::int,-1) not between 0 and 6 then raise exception 'invalid_schedule'; end if;
   slot:=(d->>'week')||':'||(d->>'weekday');
   if slot=any(slots) then raise exception 'invalid_duplicate_day'; end if;
   slots:=array_append(slots,slot);
  end if;
  if coalesce((d->>'restDay')::boolean,false) then
   if jsonb_array_length(d->'exercises')<>0 then raise exception 'invalid_rest_day'; end if;
   continue;
  end if;
  training:=training+1;
  if jsonb_array_length(d->'exercises') not between 1 and 12 then raise exception 'invalid_exercise_count'; end if;
  for e in select value from jsonb_array_elements(d->'exercises') loop
   kind:=coalesce(e->>'kind','strength');
   if nullif(e->>'key','') is null or e->>'key'=any(keys)
    or not exists(select 1 from public.exercises x where x.id=e->>'exerciseId' and x.active and (x.owner_id is null or x.owner_id=auth.uid()))
    or coalesce((e->>'sets')::int,0) not between 1 and 10 or kind not in('strength','timed','distance')
    or coalesce((e->>'reps')::int,0) not between 1 and 100 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
    or coalesce(e->>'unit','') not in('kg','lb') or coalesce((e->>'rest')::int,-1) not between 0 and 600
    or length(coalesce(e->>'note',''))>500 or length(coalesce(e->>'group',''))>40 then raise exception 'invalid_exercise'; end if;
   if e ? 'targets' and (jsonb_typeof(e->'targets') is distinct from 'array' or jsonb_array_length(e->'targets')<>(e->>'sets')::int) then raise exception 'invalid_targets'; end if;
   for target in select value from jsonb_array_elements(coalesce(e->'targets',jsonb_build_array(e))) loop
    if coalesce((target->>'reps')::int,0) not between 1 and 100 or coalesce((target->>'load')::numeric,-1) not between 0 and 1000
      or (kind='timed' and coalesce((target->>'seconds')::int,0) not between 1 and 86400)
      or (kind='distance' and coalesce((target->>'metres')::numeric,0) not between 1 and 1000000)
      or (target->>'effort' is not null and (target->>'effort')::numeric not between 1 and 10) then raise exception 'invalid_target'; end if;
   end loop;
   keys:=array_append(keys,e->>'key');
  end loop;
 end loop;
 if training=0 then raise exception 'invalid_empty_plan'; end if;
end $$;
create function public.snapshot_prescription(p jsonb) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 select jsonb_set(p,'{days}',(select jsonb_agg(jsonb_set(d.value,'{exercises}',coalesce((select jsonb_agg(e.value||jsonb_build_object('info',to_jsonb(x)-'owner_id'-'revision'-'active') order by e.n) from jsonb_array_elements(d.value->'exercises') with ordinality e(value,n) join public.exercises x on x.id=e.value->>'exerciseId'),'[]'::jsonb)) order by d.n) from jsonb_array_elements(p->'days') with ordinality d(value,n)));
$$;

alter table public.assignments add column schedule_mode text not null default 'flexible' check(schedule_mode in('flexible','cycle'));
alter table public.assignments add column end_date date;
alter table public.assignments add column revision int not null default 1;
alter table public.assignments add constraint assignment_dates check(end_date is null or end_date>=start_date);
alter table public.set_entries add column seconds integer check(seconds between 0 and 86400);
alter table public.set_entries add column metres numeric(12,2) check(metres between 0 and 1000000);
alter table public.set_entries add column effort numeric(3,1) check(effort between 1 and 10);

create table public.schedule_exceptions (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments(id) on delete cascade,
 day_id text not null, scheduled_date date not null, target_date date not null,
 state text not null check(state in('moved','skipped')), unique(assignment_id,day_id,scheduled_date)
);
alter table public.schedule_exceptions enable row level security;
create policy participant_schedule on public.schedule_exceptions for select to authenticated using(exists(select 1 from public.assignments a where a.id=assignment_id and (a.coach_id=auth.uid() or a.client_id=auth.uid())));
grant select on public.schedule_exceptions to authenticated;

create function public.configure_assignment(p_id uuid,p_version_id uuid,p_start date,p_end date,p_mode text,p_revision int) returns public.assignments
language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.assignments; v public.plan_versions;
begin
 select * into a from public.assignments where id=p_id and coach_id=auth.uid() for update;
 if not found then raise exception 'forbidden'; end if;
 if a.version_id=p_version_id and a.start_date=p_start and a.end_date is not distinct from p_end and a.schedule_mode=p_mode and a.revision in(p_revision,p_revision+1) then return a; end if;
 if a.revision is distinct from p_revision then raise exception 'conflict'; end if;
 select * into v from public.plan_versions where id=p_version_id and coach_id=auth.uid();
 if not found or (p_mode='cycle' and v.prescription->>'schema'<>'2') then raise exception 'invalid_schedule'; end if;
 if p_start is null then raise exception 'invalid_schedule'; end if;
 update public.assignments set version_id=p_version_id,start_date=p_start,end_date=p_end,schedule_mode=p_mode,revision=revision+1 where id=p_id returning * into a;
 delete from public.schedule_exceptions where assignment_id=p_id;
 return a;
end $$;

-- A bounded projection, not a pre-generated future-session queue.
create function public.assignment_schedule(p_id uuid,p_from date,p_to date) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare a public.assignments; p jsonb; result jsonb;
begin
 select * into a from public.assignments where id=p_id and (coach_id=auth.uid() or client_id=auth.uid());
 if not found then raise exception 'forbidden'; end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>41 then raise exception 'invalid_window'; end if;
 if a.schedule_mode='flexible' then return '[]'::jsonb; end if;
 select prescription into p from public.plan_versions where id=a.version_id;
 with base as (
  select g::date as original_date,d.value as day from generate_series(greatest(a.start_date,p_from-41)::timestamp,least(coalesce(a.end_date,p_to+41),p_to+41)::timestamp,'1 day') g
  cross join jsonb_array_elements(p->'days') d
  where mod(g::date-a.start_date,coalesce((p->>'cycleWeeks')::int,1)*7)=((d.value->>'week')::int-1)*7+(d.value->>'weekday')::int
 ), projected as (
  select b.*,coalesce(x.target_date,b.original_date) as date,coalesce(x.state,case when coalesce((b.day->>'restDay')::boolean,false) then 'rest' else 'planned' end) as state
  from base b left join public.schedule_exceptions x on x.assignment_id=a.id and x.day_id=b.day->>'id' and x.scheduled_date=b.original_date
 )
 select coalesce(jsonb_agg(jsonb_build_object('date',q.date,'scheduled_date',q.original_date,'day',q.day,'state',coalesce(s.status,q.state),'session_id',s.id) order by q.date,q.day->>'id'),'[]'::jsonb) into result
 from projected q left join public.sessions s on s.client_id=a.client_id and s.occurrence_key=a.id::text||':'||q.original_date::text||':'||(q.day->>'id')
 where q.date between p_from and p_to;
 return result;
end $$;
create function public.change_scheduled_day(p_id uuid,p_day_id text,p_date date,p_target date,p_state text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.assignments; p jsonb; d jsonb;
begin
 select * into a from public.assignments where id=p_id and coach_id=auth.uid() and state='active' for update;
 if not found then raise exception 'forbidden'; end if;
 select prescription into p from public.plan_versions where id=a.version_id;
 select value into d from jsonb_array_elements(p->'days') where value->>'id'=p_day_id;
 if a.schedule_mode<>'cycle' or d is null or coalesce((d->>'restDay')::boolean,false) or p_date<a.start_date or p_date>coalesce(a.end_date,p_date)
 or mod(p_date-a.start_date,coalesce((p->>'cycleWeeks')::int,1)*7)<>((d->>'week')::int-1)*7+(d->>'weekday')::int
 or p_date is null or p_target is null or abs(p_target-p_date)>41 or p_target<a.start_date or p_target>coalesce(a.end_date,p_target)
 or p_state not in('moved','skipped','planned') then raise exception 'invalid_schedule'; end if;
 if exists(select 1 from public.sessions where client_id=a.client_id and occurrence_key=a.id::text||':'||p_date::text||':'||p_day_id) then raise exception 'session_started'; end if;
 if p_state='planned' then delete from public.schedule_exceptions where assignment_id=p_id and day_id=p_day_id and scheduled_date=p_date;
 else insert into public.schedule_exceptions(assignment_id,day_id,scheduled_date,target_date,state) values(p_id,p_day_id,p_date,p_target,p_state)
 on conflict(assignment_id,day_id,scheduled_date) do update set target_date=excluded.target_date,state=excluded.state; end if;
end $$;

create or replace function public.publish_plan(p_id uuid,p_expected_version integer) returns public.plan_versions
language plpgsql security definer set search_path = public, pg_temp as $$
declare p public.plans; v public.plan_versions;
begin
  select * into p from public.plans where id=p_id and coach_id=auth.uid() and not archived for update;
  if not found then raise exception 'forbidden'; end if;
  if p_expected_version is null or p.draft_version<>p_expected_version then raise exception 'conflict'; end if;
  perform public.validate_prescription(p.draft);
  select * into v from public.plan_versions where plan_id=p_id and revision=p.draft_version;
  if found then return v; end if;
  insert into public.plan_versions(plan_id,coach_id,revision,title,prescription) values(p.id,p.coach_id,p.draft_version,p.title,public.snapshot_prescription(p.draft)) returning * into v;
  return v;
end $$;
create or replace function public.assign_plan(p_relationship_id uuid,p_version_id uuid) returns public.assignments
language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.coach_clients; a public.assignments;
begin
  select * into c from public.coach_clients where id=p_relationship_id and coach_id=auth.uid() and state='active' for update;
  if not found or not exists(select 1 from public.plan_versions where id=p_version_id and coach_id=auth.uid()) then raise exception 'forbidden'; end if;
  select * into a from public.assignments where relationship_id=c.id and state='active';
  if found then
    update public.assignments set version_id=p_version_id,revision=revision+1 where id=a.id returning * into a;
  else
    insert into public.assignments(relationship_id,coach_id,client_id,version_id) values(c.id,c.coach_id,c.client_id,p_version_id) returning * into a;
  end if; delete from public.schedule_exceptions where assignment_id=a.id; return a;
end $$;
drop function public.start_session(uuid,uuid,text,uuid);
create or replace function public.start_session(p_id uuid,p_version_id uuid,p_day_id text,p_assignment_id uuid default null,p_scheduled_date date default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.plan_versions; a public.assignments; d jsonb; e jsonb; s public.sessions; local_day date; preferred_unit text; occurrence text; c public.coach_clients; target jsonb; scheduled date; projection jsonb;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  select (now() at time zone timezone)::date,units into local_day,preferred_unit from public.profiles where id=auth.uid();
  if not found then raise exception 'profile_required'; end if;
  if p_assignment_id is not null then
    select c0.* into c from public.coach_clients c0 join public.assignments a0 on a0.relationship_id=c0.id where a0.id=p_assignment_id and a0.client_id=auth.uid() for update of c0;
    if not found or c.state<>'active' then raise exception 'assignment_unavailable'; end if;
    select * into a from public.assignments where id=p_assignment_id and client_id=auth.uid() and state='active' for update;
    if not found or (a.start_date>local_day or a.end_date<local_day) then raise exception 'assignment_unavailable'; end if;
    -- The server selects the assignment's authoritative revision; a stale client must reload it.
    if a.version_id<>p_version_id then raise exception 'plan_changed'; end if;
  end if;
  select * into v from public.plan_versions where id=p_version_id;
  if not found or (p_assignment_id is null and not v.is_public) then raise exception 'forbidden'; end if;
  select value into d from jsonb_array_elements(v.prescription->'days') where value->>'id'=p_day_id;
  if d is null or coalesce((d->>'restDay')::boolean,false) then raise exception 'invalid_day'; end if;
  -- Older shared starter versions predate catalog snapshots; freeze their content at start.
  d:=jsonb_set(d,'{exercises}',(select jsonb_agg(e.value||jsonb_build_object('info',coalesce(e.value->'info',to_jsonb(x)-'owner_id'-'revision'-'active')) order by e.n) from jsonb_array_elements(d->'exercises') with ordinality e(value,n) left join public.exercises x on x.id=e.value->>'exerciseId'));
  scheduled:=local_day;
  if a.schedule_mode='cycle' then
    scheduled:=coalesce(p_scheduled_date,local_day);
    select value into projection from jsonb_array_elements(public.assignment_schedule(a.id,local_day,local_day)) where value->>'scheduled_date'=scheduled::text and value->'day'->>'id'=p_day_id and value->>'state' not in('skipped','rest');
    if projection is null then raise exception 'assignment_unavailable'; end if;
  end if;
  occurrence := case when a.id is not null then a.id::text||':'||scheduled::text||':'||p_day_id else 'sample:'||p_id::text end;
  insert into public.sessions(id,client_id,coach_id,assignment_id,version_id,day_id,occurrence_key,local_date,title,prescription)
    values(p_id,auth.uid(),a.coach_id,a.id,v.id,p_day_id,occurrence,local_day,v.title,d)
    on conflict(client_id,occurrence_key) do nothing returning * into s;
  if not found then select * into s from public.sessions where client_id=auth.uid() and occurrence_key=occurrence; end if;
  for e in select value from jsonb_array_elements(s.prescription->'exercises') loop
    for n in 0..(e->>'sets')::int-1 loop
      target:=coalesce(e->'targets'->n,e);
      insert into public.set_entries(session_id,exercise_key,set_index,reps,load,unit,seconds,metres,effort)
        values(s.id,e->>'key',n,(target->>'reps')::int,round((target->>'load')::numeric * case when preferred_unit=e->>'unit' then 1 when preferred_unit='lb' then 2.2046226218 else 1/2.2046226218 end,2),preferred_unit,(target->>'seconds')::int,(target->>'metres')::numeric,null) on conflict do nothing;
    end loop;
  end loop;
  return public.session_document(s.id);
end $$;
create or replace function public.save_session(p_id uuid,p_expected_version int,p_operation_id uuid,p_entries jsonb,p_note text,p_complete boolean default false) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare s public.sessions; op public.session_operations; h text; e jsonb; result jsonb; expected_count int; kind text;
begin
  select * into s from public.sessions where id=p_id and client_id=auth.uid() for update;
  if not found then raise exception 'forbidden'; end if;
  h:=encode(digest(jsonb_build_object('entries',p_entries,'note',p_note,'complete',p_complete,'version',p_expected_version)::text,'sha256'),'hex');
  select * into op from public.session_operations where session_id=p_id and operation_id=p_operation_id;
  if found then
    if op.request_hash<>h then raise exception 'operation_reused'; end if;
    return op.result;
  end if;
  if p_expected_version is null or s.version<>p_expected_version then raise exception 'conflict'; end if;
  if jsonb_typeof(p_entries) is distinct from 'array' or p_note is null or char_length(p_note)>2000 then raise exception 'invalid_session'; end if;
  select count(*) into expected_count from public.set_entries where session_id=p_id;
  if jsonb_array_length(p_entries)<>expected_count or (select count(distinct (x->>'exercise_key',x->>'set_index')) from jsonb_array_elements(p_entries) x)<>expected_count then raise exception 'invalid_entries'; end if;
  for e in select value from jsonb_array_elements(p_entries) loop
    select coalesce(x->>'kind','strength') into kind from jsonb_array_elements(s.prescription->'exercises') x where x->>'key'=e->>'exercise_key';
    if not exists(select 1 from public.set_entries where session_id=p_id and exercise_key=e->>'exercise_key' and set_index=(e->>'set_index')::int)
      or coalesce((e->>'reps')::int,-1) not between 0 and 200 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
      or coalesce(e->>'unit','') not in ('kg','lb') or jsonb_typeof(e->'completed') is distinct from 'boolean'
      or (e->>'seconds' is not null and (e->>'seconds')::int not between 0 and 86400)
      or (e->>'metres' is not null and (e->>'metres')::numeric not between 0 and 1000000)
      or (e->>'effort' is not null and (e->>'effort')::numeric not between 1 and 10)
      or ((e->>'completed')::boolean and ((kind='strength' and (e->>'reps')::int<1) or (kind='timed' and coalesce((e->>'seconds')::int,0)<1) or (kind='distance' and coalesce((e->>'metres')::numeric,0)<1))) then raise exception 'invalid_entry'; end if;
    update public.set_entries set reps=(e->>'reps')::int,load=(e->>'load')::numeric,unit=e->>'unit',completed=(e->>'completed')::boolean,seconds=(e->>'seconds')::int,metres=(e->>'metres')::numeric,effort=(e->>'effort')::numeric
      where session_id=p_id and exercise_key=e->>'exercise_key' and set_index=(e->>'set_index')::int;
  end loop;
  if p_complete and not exists(select 1 from public.set_entries where session_id=p_id and completed) then raise exception 'no_completed_sets'; end if;
  update public.sessions set note=p_note,version=version+1,
    status=case when p_complete then 'completed' else status end,
    completed_at=case when p_complete then coalesce(completed_at,now()) else completed_at end
    where id=p_id;
  result:=public.session_document(p_id);
  insert into public.session_operations(session_id,operation_id,request_hash,result) values(p_id,p_operation_id,h,result);
  return result;
end $$;
create function public.previous_performance(p_exercises text[],p_before timestamptz) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 with latest as (
 select distinct on (x->>'exerciseId') x->>'exerciseId' as exercise_id,s.id,s.completed_at,x as prescription
 from public.sessions s cross join jsonb_array_elements(s.prescription->'exercises') x
 where s.client_id=auth.uid() and s.status='completed' and s.completed_at<p_before and x->>'exerciseId'=any(p_exercises[1:12])
 and exists(select 1 from public.set_entries e where e.session_id=s.id and e.exercise_key=x->>'key' and e.completed)
 order by x->>'exerciseId',s.completed_at desc,s.id
 ) select coalesce(jsonb_agg(jsonb_build_object('exercise_id',l.exercise_id,'completed_at',l.completed_at,'prescription',l.prescription,'entries',(select jsonb_agg(to_jsonb(e) order by e.set_index) from public.set_entries e where e.session_id=l.id and e.exercise_key=l.prescription->>'key' and e.completed))),'[]'::jsonb) from latest l;
$$;
revoke execute on function public.save_client_context(uuid,text,text,text,int), public.set_client_state(uuid,text), public.save_exercise(text,jsonb,int), public.set_exercise_active(text,boolean), public.snapshot_prescription(jsonb), public.configure_assignment(uuid,uuid,date,date,text,int), public.assignment_schedule(uuid,date,date), public.change_scheduled_day(uuid,text,date,date,text), public.start_session(uuid,uuid,text,uuid,date), public.previous_performance(text[],timestamptz) from public,anon,authenticated;
grant execute on function public.save_client_context(uuid,text,text,text,int), public.set_client_state(uuid,text), public.save_exercise(text,jsonb,int), public.set_exercise_active(text,boolean), public.configure_assignment(uuid,uuid,date,date,text,int), public.assignment_schedule(uuid,date,date), public.change_scheduled_day(uuid,text,date,date,text), public.start_session(uuid,uuid,text,uuid,date), public.previous_performance(text[],timestamptz) to authenticated;
