-- Organization assets never become public URLs. Reads recheck membership and purpose.
create table public.organization_assets (
 id uuid primary key,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 owner_id uuid not null,
 purpose text not null check(purpose in('exercise','message')),
 channel_id uuid,
 filename text not null check(length(filename) between 1 and 180),
 media_type text not null check(media_type in('image/jpeg','image/png','image/webp','image/gif','video/mp4','application/pdf')),
 bytes integer not null check(bytes between 1 and 26214400),
 digest text not null check(digest ~ '^[a-f0-9]{64}$'),
 retired boolean not null default false,
 created_at timestamptz not null default now(),
 unique(workspace_id,id),
 foreign key(workspace_id,owner_id) references public.workspace_members(workspace_id,id),
 foreign key(workspace_id,channel_id) references public.organization_channels(workspace_id,id) on delete cascade,
 check((purpose='message')=(channel_id is not null))
);
create index organization_assets_owner on public.organization_assets(workspace_id,owner_id,created_at desc,id);
alter table public.organization_channels add column private_pair boolean not null default false;
update public.organization_channels c set private_pair=true
where (select count(*) from public.organization_channel_members p where p.channel_id=c.id)=2;
alter table public.organization_messages add column asset_id uuid;
alter table public.organization_messages add foreign key(workspace_id,asset_id) references public.organization_assets(workspace_id,id);
revoke all on public.organization_assets from public,rafik_guest,rafik_user;
grant select,insert,update,delete on public.organization_assets to rafik_api;
