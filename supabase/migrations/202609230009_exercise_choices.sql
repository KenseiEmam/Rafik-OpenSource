-- R5: immutable coach-approved alternatives, separately recorded actual choices.
-- Existing sessions and device operations remain valid without exercise_id.
alter table public.set_entries add column exercise_id text;

create or replace function public.validate_prescription(p jsonb) returns void
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
   if e ? 'alternatives' then
    if jsonb_typeof(e->'alternatives') is distinct from 'array' or jsonb_array_length(e->'alternatives')>3 then raise exception 'invalid_alternatives'; end if;
    alt_ids:=array[e->>'exerciseId'];
    for alt in select value from jsonb_array_elements(e->'alternatives') loop
     if jsonb_typeof(alt) is distinct from 'object' or nullif(alt->>'exerciseId','') is null or alt->>'exerciseId'=any(alt_ids)
      or not exists(select 1 from public.exercises x where x.id=alt->>'exerciseId' and x.active and (x.owner_id is null or x.owner_id=auth.uid()) and x.kind=coalesce(e->>'kind','strength')) then raise exception 'invalid_alternative'; end if;
     alt_ids:=array_append(alt_ids,alt->>'exerciseId');
    end loop;
   end if;
   keys:=array_append(keys,e->>'key');
  end loop;
 end loop;
 if training=0 then raise exception 'invalid_empty_plan'; end if;
end $$;

create or replace function public.snapshot_prescription(p jsonb) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 select jsonb_set(p,'{days}',(select jsonb_agg(jsonb_set(d.value,'{exercises}',coalesce((select jsonb_agg(
 e.value||jsonb_build_object('info',to_jsonb(x)-'owner_id'-'revision'-'active','alternatives',coalesce((
 select jsonb_agg(jsonb_build_object('exerciseId',a.value->>'exerciseId','info',to_jsonb(y)-'owner_id'-'revision'-'active') order by a.n)
 from jsonb_array_elements(coalesce(e.value->'alternatives','[]'::jsonb)) with ordinality a(value,n) join public.exercises y on y.id=a.value->>'exerciseId'),'[]'::jsonb))
 order by e.n) from jsonb_array_elements(d.value->'exercises') with ordinality e(value,n) join public.exercises x on x.id=e.value->>'exerciseId'),'[]'::jsonb)) order by d.n) from jsonb_array_elements(p->'days') with ordinality d(value,n)));
$$;

-- Pure projection only: preserve prescribed targets/key, substitute snapshotted identity.
create function public.performed_exercise(p jsonb,p_choice text) returns jsonb
language sql immutable set search_path=public,pg_temp as $$
 select coalesce((select p || jsonb_build_object('exerciseId',a->>'exerciseId','info',a->'info') from jsonb_array_elements(coalesce(p->'alternatives','[]'::jsonb)) a where a->>'exerciseId'=p_choice),p);
$$;
revoke all on function public.performed_exercise(jsonb,text) from public,anon;
grant execute on function public.performed_exercise(jsonb,text) to authenticated;

create or replace function public.save_session(p_id uuid,p_expected_version int,p_operation_id uuid,p_entries jsonb,p_note text,p_complete boolean default false) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare s public.sessions; op public.session_operations; h text; e jsonb; result jsonb; expected_count int; kind text; prescribed jsonb; choice text;
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
  if exists(select 1 from jsonb_array_elements(p_entries) x group by x->>'exercise_key' having count(distinct coalesce(x->>'exercise_id',''))>1) then raise exception 'inconsistent_exercise_choice'; end if;
  for e in select value from jsonb_array_elements(p_entries) loop
    select x,coalesce(x->>'kind','strength') into prescribed,kind from jsonb_array_elements(s.prescription->'exercises') x where x->>'key'=e->>'exercise_key';
    if not exists(select 1 from public.set_entries where session_id=p_id and exercise_key=e->>'exercise_key' and set_index=(e->>'set_index')::int)
      or coalesce((e->>'reps')::int,-1) not between 0 and 200 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
      or coalesce(e->>'unit','') not in ('kg','lb') or jsonb_typeof(e->'completed') is distinct from 'boolean'
      or (e->>'seconds' is not null and (e->>'seconds')::int not between 0 and 86400)
      or (e->>'metres' is not null and (e->>'metres')::numeric not between 0 and 1000000)
      or (e->>'effort' is not null and (e->>'effort')::numeric not between 1 and 10)
      or ((e->>'completed')::boolean and ((kind='strength' and (e->>'reps')::int<1) or (kind='timed' and coalesce((e->>'seconds')::int,0)<1) or (kind='distance' and coalesce((e->>'metres')::numeric,0)<1))) then raise exception 'invalid_entry'; end if;
    choice:=nullif(e->>'exercise_id','');
    if choice is not null and choice<>prescribed->>'exerciseId' and not exists(select 1 from jsonb_array_elements(coalesce(prescribed->'alternatives','[]'::jsonb)) a where a->>'exerciseId'=choice) then raise exception 'invalid_exercise_choice'; end if;
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

create or replace function public.previous_performance(p_exercises text[],p_before timestamptz) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 with performed as (
 select s.id,s.completed_at,public.performed_exercise(x,(select e.exercise_id from public.set_entries e where e.session_id=s.id and e.exercise_key=x->>'key' order by e.set_index limit 1)) as prescription
 from public.sessions s cross join jsonb_array_elements(s.prescription->'exercises') x
 where s.client_id=auth.uid() and s.status='completed' and s.completed_at<p_before
 and exists(select 1 from public.set_entries e where e.session_id=s.id and e.exercise_key=x->>'key' and e.completed)
 ), latest as (
 select distinct on (prescription->>'exerciseId') prescription->>'exerciseId' as exercise_id,id,completed_at,prescription
 from performed where prescription->>'exerciseId'=any(p_exercises[1:48]) order by prescription->>'exerciseId',completed_at desc,id
 ) select coalesce(jsonb_agg(jsonb_build_object('exercise_id',l.exercise_id,'completed_at',l.completed_at,'prescription',l.prescription,'entries',(select jsonb_agg(to_jsonb(e) order by e.set_index) from public.set_entries e where e.session_id=l.id and e.exercise_key=l.prescription->>'key' and e.completed))),'[]'::jsonb) from latest l;
$$;

create or replace function public.training_progress(p_relationship uuid,p_from date,p_to date) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; client uuid:=auth.uid(); result jsonb;begin
 if client is null then raise exception 'forbidden'; end if;
 if p_relationship is not null then
 select * into c from public.coach_clients where id=p_relationship and auth.uid() in(coach_id,client_id);
 if not found then raise exception 'forbidden'; end if; client:=c.client_id;
 end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>365 then raise exception 'invalid_window'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'date',s.local_date,'title',s.title,'exercises',(
 select coalesce(jsonb_agg(jsonb_build_object('id',e->>'exerciseId','name',coalesce(e#>>'{info,name}',(select name from public.exercises where id=e->>'exerciseId'),e->>'exerciseId'),'name_ar',coalesce(e#>>'{info,name_ar}',e#>>'{info,name}',(select name_ar from public.exercises where id=e->>'exerciseId'),e->>'exerciseId'),'kind',coalesce(e->>'kind','strength'),
 'sets',(select coalesce(jsonb_agg(to_jsonb(x)-'session_id' order by x.set_index),'[]'::jsonb) from public.set_entries x where x.session_id=s.id and x.exercise_key=e->>'key' and x.completed))),'[]'::jsonb) from jsonb_array_elements(s.prescription->'exercises') original cross join lateral (select public.performed_exercise(original,(select x.exercise_id from public.set_entries x where x.session_id=s.id and x.exercise_key=original->>'key' order by x.set_index limit 1)) as e) actual
 )) order by s.local_date,s.completed_at),'[]'::jsonb) into result from public.sessions s
 where s.client_id=client and (p_relationship is null or s.coach_id=c.coach_id) and s.status='completed' and s.local_date between p_from and p_to; return result;
end $$;


create or replace function public.copy_snapshot_plan(p_id uuid,p_owner uuid,p_title text,p_snapshot jsonb,p_template uuid default null) returns public.plans language plpgsql security definer set search_path=public,pg_temp as $$
declare alt jsonb; alt_info jsonb; alt_id text; alternatives jsonb; p public.plans; d jsonb; e jsonb; info jsonb; new_id text; days jsonb:='[]'::jsonb; entries jsonb; draft jsonb:=p_snapshot;begin
 for d in select value from jsonb_array_elements(p_snapshot->'days') loop
  entries:='[]'::jsonb;
  for e in select value from jsonb_array_elements(d->'exercises') loop
   info:=e->'info';if info is null then select to_jsonb(x) into info from public.exercises x where id=e->>'exerciseId';end if;
   if info is null then raise exception 'missing_exercise_snapshot';end if;
   new_id:='copy-'||p_id::text||'-'||substr(encode(extensions.digest(e->>'exerciseId','sha256'),'hex'),1,16);
   insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url)
   values(new_id,p_owner,info->>'name',coalesce(info->>'name_ar',info->>'name'),coalesce(info->>'equipment',''),coalesce(info->>'equipment_ar',''),coalesce(info->>'instructions',''),coalesce(info->>'instructions_ar',''),coalesce(info->>'movement','other'),coalesce(info->>'kind',e->>'kind','strength'),info->>'media_url') on conflict(id) do nothing;
   alternatives:='[]'::jsonb;
   for alt in select value from jsonb_array_elements(coalesce(e->'alternatives','[]'::jsonb)) loop
    alt_info:=alt->'info';
    if alt_info is null then raise exception 'missing_exercise_snapshot';end if;
    alt_id:='copy-'||p_id::text||'-'||substr(encode(extensions.digest(alt->>'exerciseId','sha256'),'hex'),1,16);
    insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url)
    values(alt_id,p_owner,alt_info->>'name',coalesce(alt_info->>'name_ar',alt_info->>'name'),coalesce(alt_info->>'equipment',''),coalesce(alt_info->>'equipment_ar',''),coalesce(alt_info->>'instructions',''),coalesce(alt_info->>'instructions_ar',''),coalesce(alt_info->>'movement','other'),coalesce(alt_info->>'kind','strength'),alt_info->>'media_url') on conflict(id) do nothing;
    alternatives:=alternatives||jsonb_build_array(jsonb_build_object('exerciseId',alt_id));
   end loop;
   e:=jsonb_set(e,'{alternatives}',alternatives);
   entries:=entries||jsonb_build_array(jsonb_set(e-'info','{exerciseId}',to_jsonb(new_id)));
  end loop;
  days:=days||jsonb_build_array(jsonb_set(d,'{exercises}',entries));
 end loop;
 draft:=jsonb_set(draft,'{days}',days);
 insert into public.plans(id,coach_id,title,draft,team_template_id) values(p_id,p_owner,p_title,draft,p_template) returning * into p;return p;
end $$;

notify pgrst, 'reload schema';
