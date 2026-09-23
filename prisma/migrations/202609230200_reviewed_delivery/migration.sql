create table public.plan_deliveries(id uuid primary key,coach_id uuid not null references identity.users on delete cascade,payload jsonb not null,result jsonb not null,created_at timestamptz not null default now());
revoke all on public.plan_deliveries from public,rafik_user,rafik_guest;
create function public.deliver_plan(p_operation uuid,p_version uuid,p_recipients jsonb,p_start date,p_end date,p_mode text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare x jsonb;a public.assignments;old public.plan_deliveries;payload jsonb;results jsonb:='[]';
begin
 if identity.actor_id() is null or p_operation is null then raise exception 'unauthenticated';end if;
 if jsonb_typeof(p_recipients) is distinct from 'array' or jsonb_array_length(p_recipients) not between 1 and 50 or (select count(distinct x->>'id') from jsonb_array_elements(p_recipients) x)<>jsonb_array_length(p_recipients) then raise exception 'invalid_recipients';end if;
 if not exists(select 1 from public.plan_versions where id=p_version and coach_id=identity.actor_id()) then raise exception 'forbidden';end if;
 for x in select value from jsonb_array_elements(p_recipients) order by value->>'id' loop
  perform 1 from public.coach_clients where id=(x->>'id')::uuid and coach_id=identity.actor_id() and state='active' for update;
  if not found then raise exception 'forbidden';end if;
 end loop;
 payload:=jsonb_build_object('version',p_version,'recipients',p_recipients,'start',p_start,'end',p_end,'mode',p_mode);
 select * into old from public.plan_deliveries where id=p_operation;
 if found then if old.coach_id<>identity.actor_id() or old.payload<>payload then raise exception 'operation_reused';end if;return old.result;end if;
 for x in select value from jsonb_array_elements(p_recipients) order by value->>'id' loop
  select * into a from public.assignments where relationship_id=(x->>'id')::uuid and state='active' for update;
  if a.id is distinct from nullif(x->>'assignment_id','')::uuid or a.revision is distinct from (x->>'assignment_revision')::int then raise exception 'conflict';end if;
  if a.id is null then a:=public.assign_plan((x->>'id')::uuid,p_version);end if;
  a:=public.configure_assignment(a.id,p_version,p_start,p_end,p_mode,a.revision);
  results:=results||jsonb_build_array(to_jsonb(a));
 end loop;
 insert into public.plan_deliveries(id,coach_id,payload,result) values(p_operation,identity.actor_id(),payload,results);
 return results;
end $$;
revoke all on function public.deliver_plan(uuid,uuid,jsonb,date,date,text) from public,rafik_guest;
grant execute on function public.deliver_plan(uuid,uuid,jsonb,date,date,text) to rafik_user;
