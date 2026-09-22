-- Optional guidance and manual actuals. No nutrition provider or calculated prescription.
create table public.nutrition_guidance (
 id uuid primary key, relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 revision int not null, effective_on date not null, targets jsonb not null, guidance text not null,
 created_at timestamptz not null default now(), unique(relationship_id,revision)
);
create table public.saved_foods (
 id uuid primary key, owner_id uuid not null references public.profiles(id) on delete cascade,
 name text not null, basis numeric not null, unit text not null, nutrients jsonb not null, source text not null,
 revision int not null default 1, archived boolean not null default false
);
create table public.meal_entries (
 id uuid primary key, client_id uuid not null references public.profiles(id) on delete cascade,
 relationship_id uuid references public.coach_clients(id) on delete cascade,
 logged_on date not null, meal text not null, food_id uuid references public.saved_foods(id) on delete set null,
 name text not null, quantity numeric not null, basis numeric not null, unit text not null,
 nutrients jsonb not null, source text not null, note text not null default '', revision int not null default 1,
 created_at timestamptz not null default now()
);
create index meals_owner_date on public.meal_entries(client_id,logged_on);
create index guidance_relationship_date on public.nutrition_guidance(relationship_id,effective_on desc,revision desc);
create function public.validate_nutrients(p jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
declare k text; v jsonb; begin
 if jsonb_typeof(p) is distinct from 'object' then raise exception 'invalid_nutrients';end if;
 for k,v in select * from jsonb_each(p) loop
  if k not in('kcal','protein_g','carb_g','fat_g') then raise exception 'invalid_nutrients';end if;
  if v<>'null'::jsonb and (jsonb_typeof(v)<>'number' or (v#>>'{}')::numeric<0 or (v#>>'{}')::numeric>10000) then raise exception 'invalid_nutrients';end if;
 end loop;
end $$;
create function public.save_nutrition_guidance(p_id uuid,p_relationship uuid,p_revision int,p_effective date,p_targets jsonb,p_guidance text) returns public.nutrition_guidance
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; g public.nutrition_guidance; latest int; today date; begin
 select * into c from public.coach_clients where id=p_relationship and coach_id=auth.uid() for update;
 if not found then raise exception 'forbidden';end if;
 select * into g from public.nutrition_guidance where id=p_id;
 if found then
  if g.relationship_id<>p_relationship or g.targets<>p_targets or g.guidance is distinct from p_guidance or g.effective_on is distinct from p_effective then raise exception 'conflict';end if;
  return g;
 end if;
 if c.state<>'active' then raise exception 'relationship_archived';end if;
 perform public.validate_nutrients(p_targets);
 select (now() at time zone timezone)::date into today from public.profiles where id=c.client_id;
 if p_effective is null or p_effective<today or p_effective>today+366 or char_length(coalesce(p_guidance,''))>4000 then raise exception 'invalid_guidance';end if;
 select coalesce(max(revision),0) into latest from public.nutrition_guidance where relationship_id=c.id;
 if p_revision is distinct from latest then raise exception 'conflict';end if;
 insert into public.nutrition_guidance(id,relationship_id,revision,effective_on,targets,guidance) values(p_id,c.id,latest+1,p_effective,p_targets,coalesce(p_guidance,'')) returning * into g;return g;
end $$;
create function public.save_food(p_id uuid,p_name text,p_basis numeric,p_unit text,p_nutrients jsonb,p_source text,p_revision int) returns public.saved_foods
language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.saved_foods;begin
 if auth.uid() is null then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into f from public.saved_foods where id=p_id;
 if found and f.owner_id<>auth.uid() then raise exception 'forbidden';end if;
 if f.id is not null and f.name=trim(p_name) and f.basis=p_basis and f.unit=p_unit and f.nutrients=p_nutrients and f.source=trim(p_source) then return f;end if;
 if p_revision is distinct from coalesce(f.revision,0) then raise exception 'conflict';end if;
 perform public.validate_nutrients(p_nutrients);
 if char_length(trim(coalesce(p_name,''))) not between 1 and 120 or p_basis is null or p_basis<=0 or p_basis>10000 or coalesce(p_unit,'') not in('g','ml','serving') or char_length(trim(coalesce(p_source,''))) not between 1 and 200 then raise exception 'invalid_food';end if;
 insert into public.saved_foods(id,owner_id,name,basis,unit,nutrients,source) values(p_id,auth.uid(),trim(p_name),p_basis,p_unit,p_nutrients,trim(p_source))
 on conflict(id) do update set name=excluded.name,basis=excluded.basis,unit=excluded.unit,nutrients=excluded.nutrients,source=excluded.source,revision=saved_foods.revision+1 returning * into f;return f;
end $$;
create function public.archive_food(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.saved_foods;begin
 select * into f from public.saved_foods where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'forbidden';end if;if f.archived then return;end if;
 if p_revision is distinct from f.revision then raise exception 'conflict';end if;
 update public.saved_foods set archived=true,revision=revision+1 where id=p_id;
end $$;
create function public.save_meal(p_id uuid,p_relationship uuid,p_date date,p_meal text,p_data jsonb,p_revision int) returns public.meal_entries
language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.meal_entries; d jsonb:=p_data; c public.coach_clients; begin
 if auth.uid() is null then raise exception 'forbidden';end if;
 if p_relationship is not null then
  select * into c from public.coach_clients where id=p_relationship and client_id=auth.uid() for update;
  if not found then raise exception 'forbidden';end if;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into m from public.meal_entries where id=p_id;
 if found and m.client_id<>auth.uid() then raise exception 'forbidden';end if;
 -- Snapshot values are explicit even when a saved-food reference exists; stale catalog edits cannot change a retry.
 if m.id is not null and m.relationship_id is not distinct from p_relationship and m.logged_on=p_date and m.meal=p_meal
 and m.name=trim(d->>'name') and m.quantity=(d->>'quantity')::numeric and m.basis=(d->>'basis')::numeric and m.unit=d->>'unit'
 and m.nutrients=d->'nutrients' and m.source=trim(d->>'source') and m.note=coalesce(d->>'note','') and m.food_id is not distinct from nullif(d->>'food_id','')::uuid then return m;end if;
 if c.state='archived' then raise exception 'relationship_archived';end if;
 if p_revision is distinct from coalesce(m.revision,0) then raise exception 'conflict';end if;
 perform public.validate_nutrients(d->'nutrients');
 if p_date is null or p_date<(current_date-3650) or p_date>(select (now() at time zone timezone)::date from public.profiles where id=auth.uid()) or coalesce(p_meal,'') not in('breakfast','lunch','dinner','snack')
 or char_length(trim(coalesce(d->>'name',''))) not between 1 and 120 or coalesce((d->>'quantity')::numeric,0)<=0 or (d->>'quantity')::numeric>10000
 or coalesce((d->>'basis')::numeric,0)<=0 or (d->>'basis')::numeric>10000 or coalesce(d->>'unit','') not in('g','ml','serving')
 or char_length(trim(coalesce(d->>'source',''))) not between 1 and 200 or char_length(coalesce(d->>'note',''))>2000 then raise exception 'invalid_meal';end if;
 if nullif(d->>'food_id','') is not null and not exists(select 1 from public.saved_foods where id=(d->>'food_id')::uuid and owner_id=auth.uid()) then raise exception 'forbidden';end if;
 insert into public.meal_entries(id,client_id,relationship_id,logged_on,meal,food_id,name,quantity,basis,unit,nutrients,source,note)
 values(p_id,auth.uid(),p_relationship,p_date,p_meal,nullif(d->>'food_id','')::uuid,trim(d->>'name'),(d->>'quantity')::numeric,(d->>'basis')::numeric,d->>'unit',d->'nutrients',trim(d->>'source'),coalesce(d->>'note',''))
 on conflict(id) do update set relationship_id=excluded.relationship_id,logged_on=excluded.logged_on,meal=excluded.meal,food_id=excluded.food_id,name=excluded.name,quantity=excluded.quantity,basis=excluded.basis,unit=excluded.unit,nutrients=excluded.nutrients,source=excluded.source,note=excluded.note,revision=meal_entries.revision+1 returning * into m;return m;
end $$;
create function public.remove_meal(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.meal_entries;begin
 select * into m from public.meal_entries where id=p_id for update;if not found then return;end if;
 if m.client_id<>auth.uid() then raise exception 'forbidden';end if;if p_revision is distinct from m.revision then raise exception 'conflict';end if;
 delete from public.meal_entries where id=p_id;
end $$;
alter table public.nutrition_guidance enable row level security;
alter table public.saved_foods enable row level security;
alter table public.meal_entries enable row level security;
create policy guidance_participants on public.nutrition_guidance for select to authenticated using(exists(select 1 from public.coach_clients c where c.id=relationship_id and auth.uid() in(c.coach_id,c.client_id)));
create policy foods_owner on public.saved_foods for select to authenticated using(owner_id=auth.uid());
create policy meals_shared on public.meal_entries for select to authenticated using(client_id=auth.uid() or exists(select 1 from public.coach_clients c where c.id=relationship_id and c.coach_id=auth.uid()));
revoke all on public.nutrition_guidance,public.saved_foods,public.meal_entries from anon,authenticated;
grant select on public.nutrition_guidance,public.saved_foods,public.meal_entries to authenticated;
revoke all on function public.validate_nutrients(jsonb),public.save_nutrition_guidance(uuid,uuid,int,date,jsonb,text),public.save_food(uuid,text,numeric,text,jsonb,text,int),public.archive_food(uuid,int),public.save_meal(uuid,uuid,date,text,jsonb,int),public.remove_meal(uuid,int) from public,anon;
grant execute on function public.save_nutrition_guidance(uuid,uuid,int,date,jsonb,text),public.save_food(uuid,text,numeric,text,jsonb,text,int),public.archive_food(uuid,int),public.save_meal(uuid,uuid,date,text,jsonb,int),public.remove_meal(uuid,int) to authenticated;
