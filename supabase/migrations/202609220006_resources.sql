-- Private immutable files with explicit sharing. Byte deletion always uses Storage API.
create table public.resources (
 id uuid primary key, owner_id uuid not null references public.profiles(id) on delete cascade,
 title text not null, filename text not null, media_type text not null, bytes bigint not null,
 object_path text not null unique, state text not null default 'pending' check(state in('pending','ready','retired')),
 revision int not null default 1, created_at timestamptz not null default now()
);
create table public.resource_shares (
 id uuid primary key default gen_random_uuid(), resource_id uuid not null references public.resources(id) on delete cascade,
 relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 created_at timestamptz not null default now(),unique(resource_id,relationship_id)
);
alter table public.messages add column resource_id uuid references public.resources(id) on delete set null;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('rafik-private','rafik-private',false,10485760,array['application/pdf','text/plain','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create function public.can_read_resource(p_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.resources r where r.id=p_id and (r.owner_id=auth.uid() or (r.state='ready' and exists(select 1 from public.resource_shares s join public.coach_clients c on c.id=s.relationship_id where s.resource_id=r.id and auth.uid() in(c.coach_id,c.client_id)))));
$$;
create function public.register_resource(p_id uuid,p_title text,p_filename text,p_type text,p_bytes bigint) returns public.resources
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;begin
 if auth.uid() is null then raise exception 'forbidden';end if;
 perform id from public.profiles where id=auth.uid() for update;
 if not found then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into r from public.resources where id=p_id;
 if found then
  if r.owner_id<>auth.uid() then raise exception 'forbidden';end if;
  if r.title is distinct from trim(p_title) or r.filename is distinct from p_filename or r.media_type is distinct from p_type or r.bytes is distinct from p_bytes then raise exception 'conflict';end if;return r;
 end if;
 if char_length(trim(coalesce(p_title,''))) not between 1 and 120 or char_length(coalesce(p_filename,'')) not between 1 and 180
 or p_filename ~ '[[:cntrl:]/\\]' or coalesce(p_type,'') not in('application/pdf','text/plain','image/jpeg','image/png','image/webp') or p_bytes is null or p_bytes not between 1 and 10485760 then raise exception 'invalid_file';end if;
 insert into public.resources(id,owner_id,title,filename,media_type,bytes,object_path) values(p_id,auth.uid(),trim(p_title),p_filename,p_type,p_bytes,auth.uid()::text||'/'||p_id::text) returning * into r;return r;
end $$;
create function public.finish_resource(p_id uuid) returns public.resources language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources; o storage.objects;begin
 select * into r from public.resources where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'forbidden';end if;
 if r.state='ready' then return r;end if;if r.state<>'pending' then raise exception 'resource_unavailable';end if;
 select * into o from storage.objects where bucket_id='rafik-private' and name=r.object_path;
 if not found then raise exception 'upload_incomplete';end if;
 if (o.metadata->>'size')::bigint is distinct from r.bytes or o.metadata->>'mimetype' is distinct from r.media_type then raise exception 'invalid_file';end if;
 update public.resources set state='ready',revision=revision+1 where id=p_id returning * into r;return r;
end $$;
create function public.share_resource(p_id uuid,p_relationship uuid,p_shared boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;c public.coach_clients;begin
 select * into c from public.coach_clients where id=p_relationship and auth.uid() in(coach_id,client_id) for update;
 if not found then raise exception 'forbidden';end if;
 select * into r from public.resources where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'forbidden';end if;
 if p_shared is null then raise exception 'invalid_action';end if;
 if p_shared then
  if r.state<>'ready' or c.state<>'active' then raise exception 'resource_unavailable';end if;
  insert into public.resource_shares(resource_id,relationship_id) values(p_id,p_relationship) on conflict(resource_id,relationship_id) do nothing;
 else delete from public.resource_shares where resource_id=p_id and relationship_id=p_relationship;end if;
end $$;
create function public.retire_resource(p_id uuid,p_revision int) returns public.resources language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;begin
 select * into r from public.resources where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'forbidden';end if;if r.state='retired' then return r;end if;
 if r.revision is distinct from p_revision then raise exception 'conflict';end if;
 update public.resources set state='retired',revision=revision+1 where id=p_id returning * into r;return r;
end $$;
create function public.remove_resource_record(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;begin
 select * into r from public.resources where id=p_id for update;if not found then return;end if;
 if r.owner_id<>auth.uid() then raise exception 'forbidden';end if;
 if r.state<>'retired' or exists(select 1 from storage.objects where bucket_id='rafik-private' and name=r.object_path) then raise exception 'file_cleanup_required';end if;
 delete from public.resources where id=p_id;
end $$;
-- Extend the explicit send payload. The sixth argument defaults to null for existing clients.
drop function public.send_message(uuid,uuid,text,uuid,uuid);
create function public.send_message(p_id uuid,p_relationship uuid,p_body text,p_session uuid default null,p_request uuid default null,p_resource uuid default null) returns public.messages
language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.messages;r public.coach_clients;begin
 select * into r from public.coach_clients where id=p_relationship and auth.uid() in(coach_id,client_id) for update;
 if not found then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into m from public.messages where id=p_id;
 if found then
  if m.sender_id<>auth.uid() or m.relationship_id<>p_relationship or m.body is distinct from trim(p_body) or m.session_id is distinct from p_session or m.request_id is distinct from p_request or m.resource_id is distinct from p_resource then raise exception 'conflict';end if;return m;
 end if;
 if r.state<>'active' then raise exception 'relationship_archived';end if;
 if char_length(trim(coalesce(p_body,''))) not between 1 and 4000 or (p_session is not null and p_request is not null) then raise exception 'invalid_message';end if;
 if p_session is not null and not exists(select 1 from public.sessions where id=p_session and coach_id=r.coach_id and client_id=r.client_id) then raise exception 'invalid_context';end if;
 if p_request is not null and not exists(select 1 from public.coaching_requests where id=p_request and relationship_id=r.id) then raise exception 'invalid_context';end if;
 if p_resource is not null and not exists(select 1 from public.resources f join public.resource_shares s on s.resource_id=f.id where f.id=p_resource and f.state='ready' and s.relationship_id=r.id) then raise exception 'resource_unavailable';end if;
 insert into public.messages(id,relationship_id,sender_id,body,session_id,request_id,resource_id) values(p_id,r.id,auth.uid(),trim(p_body),p_session,p_request,p_resource) returning * into m;return m;
end $$;
create or replace function public.delete_my_account(p_confirmation text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'unauthenticated';end if;
 if p_confirmation is distinct from 'DELETE' then raise exception 'invalid_confirmation';end if;
 perform id from public.profiles where id=auth.uid() for update;
 if exists(select 1 from public.resources where owner_id=auth.uid()) then raise exception 'file_cleanup_required';end if;
 -- Deleting a client must not leave their former coach's future availability booked forever.
 update public.appointment_slots set state='open' where starts_at>now() and id in(select a.slot_id from public.appointments a join public.coach_clients c on c.id=a.relationship_id where c.client_id=auth.uid() and a.state='booked');
 delete from auth.users where id=auth.uid();
end $$;
alter table public.resources enable row level security;
alter table public.resource_shares enable row level security;
create policy resources_read on public.resources for select to authenticated using(public.can_read_resource(id));
create policy shares_participants on public.resource_shares for select to authenticated using(exists(select 1 from public.coach_clients c where c.id=relationship_id and auth.uid() in(c.coach_id,c.client_id)));
-- Hold the registration row through Storage metadata insertion so retirement cannot
-- remove its record while a previously authorized upload is still committing.
create function public.can_upload_resource(p_path text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform id from public.resources where object_path=p_path and owner_id=auth.uid() and state='pending' for share;
 return found;
end $$;
revoke all on function public.can_upload_resource(text) from public,anon;
grant execute on function public.can_upload_resource(text) to authenticated;
create policy rafik_resource_read on storage.objects for select to authenticated using(bucket_id='rafik-private' and exists(select 1 from public.resources r where r.object_path=name and public.can_read_resource(r.id)));
create policy rafik_resource_upload on storage.objects for insert to authenticated with check(bucket_id='rafik-private' and public.can_upload_resource(name));
create policy rafik_resource_delete on storage.objects for delete to authenticated using(bucket_id='rafik-private' and exists(select 1 from public.resources r where r.object_path=name and r.owner_id=auth.uid() and r.state='retired'));
revoke all on public.resources,public.resource_shares from anon,authenticated;
grant select on public.resources,public.resource_shares to authenticated;
revoke all on function public.can_read_resource(uuid),public.register_resource(uuid,text,text,text,bigint),public.finish_resource(uuid),public.share_resource(uuid,uuid,boolean),public.retire_resource(uuid,int),public.remove_resource_record(uuid),public.send_message(uuid,uuid,text,uuid,uuid,uuid) from public,anon;
grant execute on function public.can_read_resource(uuid),public.register_resource(uuid,text,text,text,bigint),public.finish_resource(uuid),public.share_resource(uuid,uuid,boolean),public.retire_resource(uuid,int),public.remove_resource_record(uuid),public.send_message(uuid,uuid,text,uuid,uuid,uuid) to authenticated;
