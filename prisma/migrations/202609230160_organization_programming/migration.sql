create or replace function public.validate_prescription_catalog(p jsonb, catalog jsonb) returns void
language plpgsql set search_path=public,pg_temp as $$
declare alt jsonb; alt_ids text[]; d jsonb; e jsonb; target jsonb; day_ids text[]:=array[]::text[]; slots text[]:=array[]::text[]; keys text[]; slot text; kind text; training int:=0;
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
    or not exists(select 1 from jsonb_array_elements(catalog) x where x->>'id'=e->>'exerciseId' and coalesce((x->>'active')::boolean,true) and coalesce(x->>'kind','strength')=kind)
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
   if e ? 'alternatives' then
    if jsonb_typeof(e->'alternatives') is distinct from 'array' or jsonb_array_length(e->'alternatives')>3 then raise exception 'invalid_alternatives'; end if;
    alt_ids:=array[e->>'exerciseId'];
    for alt in select value from jsonb_array_elements(e->'alternatives') loop
     if jsonb_typeof(alt) is distinct from 'object' or nullif(alt->>'exerciseId','') is null or alt->>'exerciseId'=any(alt_ids)
      or not exists(select 1 from jsonb_array_elements(catalog) x where x->>'id'=alt->>'exerciseId' and coalesce((x->>'active')::boolean,true) and coalesce(x->>'kind','strength')=kind) then raise exception 'invalid_alternative'; end if;
     alt_ids:=array_append(alt_ids,alt->>'exerciseId');
    end loop;
   end if;
   keys:=array_append(keys,e->>'key');
  end loop;
 end loop;
 if training=0 then raise exception 'invalid_empty_plan'; end if;
end $$;

create or replace function public.snapshot_prescription_catalog(p jsonb,catalog jsonb) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 select jsonb_set(p,'{days}',(select jsonb_agg(jsonb_set(d.value,'{exercises}',coalesce((select jsonb_agg(
 e.value||jsonb_build_object('info',x-'owner_id'-'revision'-'active','alternatives',coalesce((
 select jsonb_agg(jsonb_build_object('exerciseId',a.value->>'exerciseId','info',y-'owner_id'-'revision'-'active') order by a.n)
 from jsonb_array_elements(coalesce(e.value->'alternatives','[]'::jsonb)) with ordinality a(value,n) join jsonb_array_elements(catalog) y on y->>'id'=a.value->>'exerciseId'),'[]'::jsonb))
 order by e.n) from jsonb_array_elements(d.value->'exercises') with ordinality e(value,n) join jsonb_array_elements(catalog) x on x->>'id'=e.value->>'exerciseId'),'[]'::jsonb)) order by d.n) from jsonb_array_elements(p->'days') with ordinality d(value,n)));
$$;


create or replace function public.validate_prescription(p jsonb) returns void language sql set search_path=public,pg_temp as $$
 select public.validate_prescription_catalog(p,coalesce((select jsonb_agg(to_jsonb(x)) from public.exercises x where x.owner_id is null or x.owner_id=identity.actor_id()),'[]'));
$$;
create or replace function public.snapshot_prescription(p jsonb) returns jsonb language sql stable set search_path=public,pg_temp as $$
 select public.snapshot_prescription_catalog(p,coalesce((select jsonb_agg(to_jsonb(x)) from public.exercises x where x.owner_id is null or x.owner_id=identity.actor_id()),'[]'));
$$;
revoke all on function public.validate_prescription_catalog(jsonb,jsonb),public.snapshot_prescription_catalog(jsonb,jsonb) from public,rafik_guest,rafik_user;
grant execute on function public.validate_prescription_catalog(jsonb,jsonb),public.snapshot_prescription_catalog(jsonb,jsonb) to rafik_api;
grant select on public.exercises to rafik_api;
-- RLS still restricts the application role to shared catalog rows through this explicit policy.
create policy api_shared_catalog on public.exercises for select to rafik_api using(owner_id is null);

create table public.organization_exercises (
 workspace_id uuid not null references public.workspaces on delete cascade,
 id text not null, data jsonb not null check(jsonb_typeof(data)='object'),
 created_by uuid not null, revision integer not null default 1, active boolean not null default true,
 primary key(workspace_id,id), foreign key(workspace_id,created_by) references public.workspace_members(workspace_id,id)
);
create table public.organization_programs (
 id uuid primary key, workspace_id uuid not null references public.workspaces on delete cascade,
 created_by uuid not null, title text not null check(length(title) between 1 and 100), draft jsonb not null,
 draft_version integer not null default 1, archived boolean not null default false,
 listed boolean not null default false, updated_at timestamptz not null default now(),
 unique(workspace_id,id), foreign key(workspace_id,created_by) references public.workspace_members(workspace_id,id)
);
create table public.organization_versions (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null,
 program_id uuid not null, revision integer not null, title text not null, prescription jsonb not null,
 created_by uuid not null, created_at timestamptz not null default now(),
 unique(workspace_id,id),unique(program_id,revision),
 foreign key(workspace_id,program_id) references public.organization_programs(workspace_id,id) on delete cascade,
 foreign key(workspace_id,created_by) references public.workspace_members(workspace_id,id)
);
create table public.organization_assignments (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null,
 member_id uuid not null, version_id uuid not null, created_by uuid not null,
 start_date date not null, end_date date, schedule_mode text not null check(schedule_mode in('flexible','cycle')),
 state text not null default 'active' check(state in('active','archived')), revision integer not null default 1,
 created_at timestamptz not null default now(),
 check(end_date is null or end_date>=start_date), unique(workspace_id,id),
 foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id),
 foreign key(workspace_id,version_id) references public.organization_versions(workspace_id,id),
 foreign key(workspace_id,created_by) references public.workspace_members(workspace_id,id)
);
create unique index organization_one_active_assignment on public.organization_assignments(workspace_id,member_id) where state='active';
create table public.organization_sessions (
 id uuid primary key, workspace_id uuid not null, member_id uuid not null, assignment_id uuid not null,
 day_id text not null, local_date date not null, document jsonb not null,
 version integer not null default 1, started_at timestamptz not null default now(), completed_at timestamptz,
 unique(workspace_id,id), unique(assignment_id,local_date,day_id),
 foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id),
 foreign key(workspace_id,assignment_id) references public.organization_assignments(workspace_id,id)
);
create index organization_history on public.organization_sessions(workspace_id,member_id,started_at desc,id);
grant select,insert,update,delete on public.organization_exercises,public.organization_programs,public.organization_versions,public.organization_assignments,public.organization_sessions to rafik_api;
revoke all on public.organization_exercises,public.organization_programs,public.organization_versions,public.organization_assignments,public.organization_sessions from public,rafik_guest,rafik_user;

create function public.validate_session_actuals(p_day jsonb,p_entries jsonb,p_note text,p_complete boolean) returns void language plpgsql set search_path=public,pg_temp as $$
declare e jsonb; expected_count int; kind text; prescribed jsonb; choice text;
begin
  if jsonb_typeof(p_entries) is distinct from 'array' or p_note is null or char_length(p_note)>2000 then raise exception 'invalid_session'; end if;
  select sum((x->>'sets')::int) into expected_count from jsonb_array_elements(p_day->'exercises') x;
  if jsonb_array_length(p_entries)<>expected_count or (select count(distinct (x->>'exercise_key',x->>'set_index')) from jsonb_array_elements(p_entries) x)<>expected_count then raise exception 'invalid_entries'; end if;
  if exists(select 1 from jsonb_array_elements(p_entries) x group by x->>'exercise_key' having count(distinct coalesce(x->>'exercise_id',''))>1) then raise exception 'inconsistent_exercise_choice'; end if;
  for e in select value from jsonb_array_elements(p_entries) loop
    select x,coalesce(x->>'kind','strength') into prescribed,kind from jsonb_array_elements(p_day->'exercises') x where x->>'key'=e->>'exercise_key';
    if prescribed is null or (e->>'set_index') is null or (e->>'set_index')::int<0 or (e->>'set_index')::int>=(prescribed->>'sets')::int
      or coalesce((e->>'reps')::int,-1) not between 0 and 200 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
      or coalesce(e->>'unit','') not in ('kg','lb') or jsonb_typeof(e->'completed') is distinct from 'boolean'
      or (e->>'seconds' is not null and (e->>'seconds')::int not between 0 and 86400)
      or (e->>'metres' is not null and (e->>'metres')::numeric not between 0 and 1000000)
      or (e->>'effort' is not null and (e->>'effort')::numeric not between 1 and 10)
      or ((e->>'completed')::boolean and ((kind='strength' and (e->>'reps')::int<1) or (kind='timed' and coalesce((e->>'seconds')::int,0)<1) or (kind='distance' and coalesce((e->>'metres')::numeric,0)<1))) then raise exception 'invalid_entry'; end if;
    choice:=nullif(e->>'exercise_id','');
    if choice is not null and choice<>prescribed->>'exerciseId' and not exists(select 1 from jsonb_array_elements(coalesce(prescribed->'alternatives','[]'::jsonb)) a where a->>'exerciseId'=choice) then raise exception 'invalid_exercise_choice'; end if;
  end loop;
 if p_complete and not exists(select 1 from jsonb_array_elements(p_entries) x where (x->>'completed')::boolean) then raise exception 'no_completed_sets';end if;
end $$;
revoke all on function public.validate_session_actuals(jsonb,jsonb,text,boolean) from public,rafik_user,rafik_guest;
grant execute on function public.validate_session_actuals(jsonb,jsonb,text,boolean) to rafik_api;

create or replace function public.save_session(p_id uuid,p_expected_version int,p_operation_id uuid,p_entries jsonb,p_note text,p_complete boolean default false) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare s public.sessions; op public.session_operations; h text; e jsonb; result jsonb; expected_count int; kind text; prescribed jsonb; choice text;
begin
  select * into s from public.sessions where id=p_id and client_id=identity.actor_id() for update;
  if not found then raise exception 'forbidden'; end if;
  h:=encode(digest(jsonb_build_object('entries',p_entries,'note',p_note,'complete',p_complete,'version',p_expected_version)::text,'sha256'),'hex');
  select * into op from public.session_operations where session_id=p_id and operation_id=p_operation_id;
  if found then
    if op.request_hash<>h then raise exception 'operation_reused'; end if;
    return op.result;
  end if;
  if p_expected_version is null or s.version<>p_expected_version then raise exception 'conflict'; end if;
  perform public.validate_session_actuals(s.prescription,p_entries,p_note,p_complete);
  for e in select value from jsonb_array_elements(p_entries) loop
    choice:=nullif(e->>'exercise_id','');
    update public.set_entries set exercise_id=choice,reps=(e->>'reps')::int,load=(e->>'load')::numeric,unit=e->>'unit',completed=(e->>'completed')::boolean,seconds=(e->>'seconds')::int,metres=(e->>'metres')::numeric,effort=(e->>'effort')::numeric
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

