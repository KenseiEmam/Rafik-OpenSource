-- Structured illustrative meals belong to the same immutable, participant-scoped guidance version.
alter table public.nutrition_guidance add column meals jsonb not null default '[]'::jsonb;
create function public.validate_nutrition_meals(p jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
declare m jsonb; k text; begin
 if jsonb_typeof(p) is distinct from 'array' then raise exception 'invalid_guidance'; end if;
 if jsonb_array_length(p)>20 or pg_column_size(p)>32768 then raise exception 'invalid_guidance'; end if;
 for m in select value from jsonb_array_elements(p) loop
  if jsonb_typeof(m) is distinct from 'object' then raise exception 'invalid_guidance'; end if;
  for k in select jsonb_object_keys(m) loop
   if k not in ('name','meal','quantity','basis','unit','nutrients','source') then raise exception 'invalid_guidance'; end if;
  end loop;
  if jsonb_typeof(m->'name') is distinct from 'string' or char_length(trim(m->>'name')) not between 1 and 120
   or coalesce(m->>'meal','') not in ('breakfast','lunch','dinner','snack')
   or coalesce(m->>'unit','') not in ('g','ml','serving')
   or jsonb_typeof(m->'source') is distinct from 'string' or char_length(trim(m->>'source')) not between 1 and 200
   or jsonb_typeof(m->'quantity') is distinct from 'number' or jsonb_typeof(m->'basis') is distinct from 'number'
   then raise exception 'invalid_guidance'; end if;
  if (m->>'quantity')::numeric<=0 or (m->>'quantity')::numeric>10000
   or (m->>'basis')::numeric<=0 or (m->>'basis')::numeric>10000 then raise exception 'invalid_guidance'; end if;
  perform public.validate_nutrients(m->'nutrients');
 end loop;
end $$;
revoke all on function public.validate_nutrition_meals(jsonb) from public,rafik_guest,rafik_user;
drop function public.save_nutrition_guidance(uuid,uuid,int,date,jsonb,text);
create function public.save_nutrition_guidance(p_id uuid,p_relationship uuid,p_revision int,p_effective date,p_targets jsonb,p_guidance text,p_meals jsonb default '[]'::jsonb) returns public.nutrition_guidance
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; g public.nutrition_guidance; latest int; today date; begin
 select * into c from public.coach_clients where id=p_relationship and coach_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden';end if;
 select * into g from public.nutrition_guidance where id=p_id;
 if found then
  if g.relationship_id<>p_relationship or g.targets<>p_targets or g.guidance is distinct from p_guidance or g.effective_on is distinct from p_effective or g.meals is distinct from p_meals then raise exception 'conflict';end if;
  return g;
 end if;
 if c.state<>'active' then raise exception 'relationship_archived';end if;
 perform public.validate_nutrients(p_targets);
 perform public.validate_nutrition_meals(p_meals);
 select (now() at time zone timezone)::date into today from public.profiles where id=c.client_id;
 if p_effective is null or p_effective<today or p_effective>today+366 or char_length(coalesce(p_guidance,''))>4000 then raise exception 'invalid_guidance';end if;
 select coalesce(max(revision),0) into latest from public.nutrition_guidance where relationship_id=c.id;
 if p_revision is distinct from latest then raise exception 'conflict';end if;
 insert into public.nutrition_guidance(id,relationship_id,revision,effective_on,targets,guidance,meals) values(p_id,c.id,latest+1,p_effective,p_targets,coalesce(p_guidance,''),p_meals) returning * into g;return g;
end $$;
revoke all on function public.save_nutrition_guidance(uuid,uuid,int,date,jsonb,text,jsonb) from public,rafik_guest;
grant execute on function public.save_nutrition_guidance(uuid,uuid,int,date,jsonb,text,jsonb) to rafik_user;
