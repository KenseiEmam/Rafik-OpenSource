-- Concrete availability instants and appointments; independent from training occurrences.
create table public.appointment_slots (
 id uuid primary key default gen_random_uuid(), series_id uuid not null, coach_id uuid not null references public.profiles(id) on delete cascade,
 starts_at timestamptz not null, ends_at timestamptz not null, local_start timestamp not null, timezone text not null,
 title text not null, location text not null, state text not null default 'open' check(state in('open','booked','withdrawn')),
 unique(series_id,starts_at), check(ends_at>starts_at)
);
create index slots_coach_time on public.appointment_slots(coach_id,starts_at);
create table public.appointments (
 id uuid primary key, relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 slot_id uuid not null references public.appointment_slots(id), starts_at timestamptz not null, ends_at timestamptz not null,
 title text not null, location text not null, timezone text not null,
 state text not null default 'booked' check(state in('booked','cancelled','attended','missed')), note text not null default '',
 revision int not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index slot_one_booking on public.appointments(slot_id) where state='booked';
create index appointments_relationship_time on public.appointments(relationship_id,starts_at);
create function public.availability_preview(p_local timestamp,p_zone text,p_minutes int,p_count int,p_every int) returns jsonb
language plpgsql stable set search_path=public,pg_temp as $$
declare intended timestamp; instant timestamptz; result jsonb:='[]'::jsonb;begin
 if not exists(select 1 from pg_timezone_names where name=p_zone) or p_local is null or p_minutes is null or p_minutes not in(15,30,45,60,90,120) or p_count is null or p_count not between 1 and 8 or p_every is null or p_every not in(7,14) then raise exception 'invalid_availability';end if;
 for n in 0..p_count-1 loop
  intended:=p_local+make_interval(days=>n*p_every);instant:=intended at time zone p_zone;
  if instant at time zone p_zone<>intended then raise exception 'invalid_local_time';end if;
  result:=result||jsonb_build_array(jsonb_build_object('local_start',intended,'starts_at',instant,'ends_at',instant+make_interval(mins=>p_minutes)));
 end loop;return result;
end $$;
create function public.publish_availability(p_series uuid,p_local timestamp,p_zone text,p_minutes int,p_count int,p_every int,p_title text,p_location text) returns setof public.appointment_slots
language plpgsql security definer set search_path=public,pg_temp as $$
declare times jsonb; first_slot public.appointment_slots; x jsonb;begin
 if auth.uid() is null then raise exception 'forbidden';end if;
 perform id from public.profiles where id=auth.uid() for update;
 perform pg_advisory_xact_lock(hashtextextended(p_series::text,0));
 times:=public.availability_preview(p_local,p_zone,p_minutes,p_count,p_every);
 select * into first_slot from public.appointment_slots where series_id=p_series order by starts_at limit 1;
 if found then
  if first_slot.coach_id<>auth.uid() or first_slot.title is distinct from trim(p_title) or first_slot.location is distinct from trim(p_location) or first_slot.timezone<>p_zone
  or (select count(*) from public.appointment_slots where series_id=p_series)<>p_count
  or exists(select 1 from jsonb_array_elements(times) t where not exists(select 1 from public.appointment_slots s where s.series_id=p_series and s.starts_at=(t->>'starts_at')::timestamptz and s.ends_at=(t->>'ends_at')::timestamptz)) then raise exception 'conflict';end if;
  return query select * from public.appointment_slots where series_id=p_series order by starts_at;return;
 end if;
 if char_length(trim(coalesce(p_title,''))) not between 1 and 100 or char_length(trim(coalesce(p_location,''))) not between 1 and 500 then raise exception 'invalid_availability';end if;
 for x in select value from jsonb_array_elements(times) loop
  if (x->>'starts_at')::timestamptz<=now() or (x->>'starts_at')::timestamptz>now()+interval '366 days' then raise exception 'invalid_availability';end if;
  if exists(select 1 from public.appointment_slots s where coach_id=auth.uid() and state<>'withdrawn' and tstzrange(s.starts_at,s.ends_at,'[)') && tstzrange((x->>'starts_at')::timestamptz,(x->>'ends_at')::timestamptz,'[)')) then raise exception 'time_unavailable';end if;
 end loop;
 return query insert into public.appointment_slots(series_id,coach_id,starts_at,ends_at,local_start,timezone,title,location)
 select p_series,auth.uid(),(t->>'starts_at')::timestamptz,(t->>'ends_at')::timestamptz,(t->>'local_start')::timestamp,p_zone,trim(p_title),trim(p_location) from jsonb_array_elements(times) t returning *;
end $$;
create function public.withdraw_availability(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.appointment_slots;begin
 perform id from public.profiles where id=auth.uid() for update;
 select * into s from public.appointment_slots where id=p_id and coach_id=auth.uid() for update;
 if not found then raise exception 'forbidden';end if;
 if s.state='booked' then raise exception 'slot_booked';end if;
 update public.appointment_slots set state='withdrawn' where id=p_id;
end $$;
create function public.book_appointment(p_id uuid,p_relationship uuid,p_slot uuid) returns public.appointments
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; s public.appointment_slots; a public.appointments;begin
 select * into c from public.coach_clients where id=p_relationship and client_id=auth.uid() for update;
 if not found then raise exception 'forbidden';end if;
 perform id from public.profiles where id in(c.coach_id,c.client_id) order by id for update;
 select * into a from public.appointments where id=p_id;
 if found then
  if a.relationship_id<>c.id or a.slot_id<>p_slot then raise exception 'conflict';end if;return a;
 end if;
 if c.state<>'active' then raise exception 'relationship_archived';end if;
 select * into s from public.appointment_slots where id=p_slot and coach_id=c.coach_id for update;
 if not found or s.state<>'open' or s.starts_at<=now() then raise exception 'time_unavailable';end if;
 if exists(select 1 from public.appointments ap join public.coach_clients r on r.id=ap.relationship_id where (r.client_id in(c.client_id,c.coach_id) or r.coach_id in(c.client_id,c.coach_id)) and ap.state='booked' and tstzrange(ap.starts_at,ap.ends_at,'[)') && tstzrange(s.starts_at,s.ends_at,'[)')) then raise exception 'time_unavailable';end if;
 insert into public.appointments(id,relationship_id,slot_id,starts_at,ends_at,title,location,timezone) values(p_id,c.id,s.id,s.starts_at,s.ends_at,s.title,s.location,s.timezone) returning * into a;
 update public.appointment_slots set state='booked' where id=s.id;return a;
end $$;
create function public.change_appointment(p_id uuid,p_revision int,p_action text,p_slot uuid default null,p_note text default '') returns public.appointments
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; a public.appointments; s public.appointment_slots;begin
 select r.* into c from public.coach_clients r join public.appointments x on x.relationship_id=r.id where x.id=p_id and auth.uid() in(r.coach_id,r.client_id) for update of r;
 if not found then raise exception 'forbidden';end if;
 perform id from public.profiles where id in(c.coach_id,c.client_id) order by id for update;
 select * into a from public.appointments where id=p_id for update;
 if p_action in('cancelled','attended','missed') and a.state=p_action and a.note=p_note then return a;end if;
 if p_action='reschedule' and a.state='booked' and a.slot_id=p_slot then
  if a.note is distinct from coalesce(p_note,'') then raise exception 'conflict';end if;return a;end if;
 if p_revision is distinct from a.revision then raise exception 'conflict';end if;
 if a.state<>'booked' or char_length(coalesce(p_note,''))>2000 then raise exception 'appointment_unavailable';end if;
 if p_action in('attended','missed') then
  if auth.uid()<>c.coach_id or a.ends_at>now() then raise exception 'forbidden';end if;
  update public.appointments set state=p_action,note=coalesce(p_note,''),revision=revision+1,updated_at=now() where id=p_id returning * into a;return a;
 end if;
 if a.starts_at<=now() then raise exception 'appointment_unavailable';end if;
 if p_action='cancelled' then
  update public.appointment_slots set state='open' where id=a.slot_id;
  update public.appointments set state='cancelled',note=coalesce(p_note,''),revision=revision+1,updated_at=now() where id=p_id returning * into a;return a;
 elsif p_action='reschedule' then
  if c.state<>'active' then raise exception 'relationship_archived';end if;
  select * into s from public.appointment_slots where id=p_slot and coach_id=c.coach_id for update;
  if not found or s.state<>'open' or s.starts_at<=now() then raise exception 'time_unavailable';end if;
  if exists(select 1 from public.appointments x join public.coach_clients r on r.id=x.relationship_id where (r.client_id in(c.client_id,c.coach_id) or r.coach_id in(c.client_id,c.coach_id)) and x.state='booked' and x.id<>a.id and tstzrange(x.starts_at,x.ends_at,'[)') && tstzrange(s.starts_at,s.ends_at,'[)')) then raise exception 'time_unavailable';end if;
  update public.appointment_slots set state='open' where id=a.slot_id;
  update public.appointment_slots set state='booked' where id=s.id;
  update public.appointments set slot_id=s.id,starts_at=s.starts_at,ends_at=s.ends_at,title=s.title,location=s.location,timezone=s.timezone,note=coalesce(p_note,''),revision=revision+1,updated_at=now() where id=p_id returning * into a;return a;
 end if;raise exception 'invalid_action';
end $$;
alter table public.appointment_slots enable row level security;
alter table public.appointments enable row level security;
create policy slots_coach_clients on public.appointment_slots for select to authenticated using(coach_id=auth.uid() or (state<>'withdrawn' and exists(select 1 from public.coach_clients c where c.coach_id=appointment_slots.coach_id and c.client_id=auth.uid() and c.state='active')));
create policy appointments_participants on public.appointments for select to authenticated using(exists(select 1 from public.coach_clients c where c.id=relationship_id and auth.uid() in(c.coach_id,c.client_id)));
revoke all on public.appointment_slots,public.appointments from anon,authenticated;
grant select on public.appointment_slots,public.appointments to authenticated;
revoke all on function public.availability_preview(timestamp,text,int,int,int),public.publish_availability(uuid,timestamp,text,int,int,int,text,text),public.withdraw_availability(uuid),public.book_appointment(uuid,uuid,uuid),public.change_appointment(uuid,int,text,uuid,text) from public,anon;
grant execute on function public.availability_preview(timestamp,text,int,int,int),public.publish_availability(uuid,timestamp,text,int,int,int,text,text),public.withdraw_availability(uuid),public.book_appointment(uuid,uuid,uuid),public.change_appointment(uuid,int,text,uuid,text) to authenticated;
