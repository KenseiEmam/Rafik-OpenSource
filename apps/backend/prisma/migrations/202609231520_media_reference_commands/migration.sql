-- Preserve selected media through publication and shared-plan copies.
create or replace function public.save_exercise(p_id text,p_data jsonb,p_revision int) returns public.exercises
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.exercises;
begin
 if identity.actor_id() is null then raise exception 'unauthenticated'; end if;
 if length(p_id) not between 1 and 100 or length(coalesce(p_data->>'name','')) not between 1 and 120
 or length(coalesce(p_data->>'instructions','')) not between 1 and 2000
 or length(coalesce(p_data->>'name_ar',''))>120 or length(coalesce(p_data->>'instructions_ar',''))>2000
 or length(coalesce(p_data->>'equipment',''))>120 or length(coalesce(p_data->>'movement',''))>80
 or length(coalesce(p_data->>'equipment_ar',''))>120
 or coalesce(p_data->>'kind','') not in('strength','timed','distance')
 or (coalesce(p_data->>'media_url','')<>'' and (p_data->>'media_url' !~ '^https://[^[:space:]]+$' or length(p_data->>'media_url')>1000))
 then raise exception 'invalid_exercise'; end if;
 if coalesce(p_data->>'media_ref','')<>'' and not exists(select 1 from public.exercises where owner_id is null and media_ref=p_data->>'media_ref') then raise exception 'invalid_exercise'; end if;
 p_data:=p_data||jsonb_build_object('media_ref',nullif(p_data->>'media_ref',''));
 -- Serialize creates and edits of this catalog identity without locking unrelated exercises.
 perform pg_advisory_xact_lock(hashtextextended(p_id,0));
 select * into r from public.exercises where id=p_id for update;
 if found then
  if r.owner_id is distinct from identity.actor_id() then raise exception 'forbidden'; end if;
  if r.revision is distinct from p_revision then
   if r.revision=p_revision+1 and (to_jsonb(r)-'id'-'owner_id'-'revision'-'active')=p_data then return r; end if;
   raise exception 'conflict';
  end if;
  update public.exercises set name=p_data->>'name',name_ar=coalesce(nullif(p_data->>'name_ar',''),p_data->>'name'),equipment=coalesce(p_data->>'equipment',''),equipment_ar=coalesce(p_data->>'equipment_ar',''),instructions=p_data->>'instructions',instructions_ar=coalesce(nullif(p_data->>'instructions_ar',''),p_data->>'instructions'),movement=coalesce(p_data->>'movement',''),kind=p_data->>'kind',media_url=coalesce(p_data->>'media_url',''),media_ref=nullif(p_data->>'media_ref',''),revision=revision+1 where id=p_id returning * into r;
 else
  if p_revision is distinct from 0 then raise exception 'conflict'; end if;
  insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url,media_ref)
  values(p_id,identity.actor_id(),p_data->>'name',coalesce(nullif(p_data->>'name_ar',''),p_data->>'name'),coalesce(p_data->>'equipment',''),coalesce(p_data->>'equipment_ar',''),p_data->>'instructions',coalesce(nullif(p_data->>'instructions_ar',''),p_data->>'instructions'),coalesce(p_data->>'movement',''),p_data->>'kind',coalesce(p_data->>'media_url',''),nullif(p_data->>'media_ref','')) returning * into r;
 end if; return r;
end $$;

create or replace function public.copy_snapshot_plan(p_id uuid,p_owner uuid,p_title text,p_snapshot jsonb,p_template uuid default null) returns public.plans language plpgsql security definer set search_path=public,pg_temp as $$
declare alt jsonb; alt_info jsonb; alt_id text; alternatives jsonb; p public.plans; d jsonb; e jsonb; info jsonb; new_id text; days jsonb:='[]'::jsonb; entries jsonb; draft jsonb:=p_snapshot;begin
 for d in select value from jsonb_array_elements(p_snapshot->'days') loop
  entries:='[]'::jsonb;
  for e in select value from jsonb_array_elements(d->'exercises') loop
   info:=e->'info';if info is null then select to_jsonb(x) into info from public.exercises x where id=e->>'exerciseId';end if;
   if info is null then raise exception 'missing_exercise_snapshot';end if;
   new_id:='copy-'||p_id::text||'-'||substr(encode(extensions.digest(e->>'exerciseId','sha256'),'hex'),1,16);
   insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url,media_ref)
   values(new_id,p_owner,info->>'name',coalesce(info->>'name_ar',info->>'name'),coalesce(info->>'equipment',''),coalesce(info->>'equipment_ar',''),coalesce(info->>'instructions',''),coalesce(info->>'instructions_ar',''),coalesce(info->>'movement','other'),coalesce(info->>'kind',e->>'kind','strength'),coalesce(info->>'media_url',''),info->>'media_ref') on conflict(id) do nothing;
   alternatives:='[]'::jsonb;
   for alt in select value from jsonb_array_elements(coalesce(e->'alternatives','[]'::jsonb)) loop
    alt_info:=alt->'info';
    if alt_info is null then raise exception 'missing_exercise_snapshot';end if;
    alt_id:='copy-'||p_id::text||'-'||substr(encode(extensions.digest(alt->>'exerciseId','sha256'),'hex'),1,16);
    insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url,media_ref)
    values(alt_id,p_owner,alt_info->>'name',coalesce(alt_info->>'name_ar',alt_info->>'name'),coalesce(alt_info->>'equipment',''),coalesce(alt_info->>'equipment_ar',''),coalesce(alt_info->>'instructions',''),coalesce(alt_info->>'instructions_ar',''),coalesce(alt_info->>'movement','other'),coalesce(alt_info->>'kind','strength'),coalesce(alt_info->>'media_url',''),alt_info->>'media_ref') on conflict(id) do nothing;
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
