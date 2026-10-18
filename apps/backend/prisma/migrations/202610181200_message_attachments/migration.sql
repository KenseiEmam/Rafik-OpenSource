-- Ordered message attachments; retain asset_id for older clients and receipts.
alter table public.organization_messages add constraint organization_messages_id_workspace_id_key unique(id,workspace_id);
create table public.organization_message_assets (
  message_id uuid not null,
  workspace_id uuid not null,
  asset_id uuid not null,
  position integer not null check(position between 0 and 9),
  primary key(message_id,asset_id),
  unique(message_id,position),
  foreign key(message_id,workspace_id) references public.organization_messages(id,workspace_id) on delete cascade,
  foreign key(workspace_id,asset_id) references public.organization_assets(workspace_id,id) deferrable initially deferred
);
create index organization_message_assets_asset on public.organization_message_assets(workspace_id,asset_id);
insert into public.organization_message_assets(message_id,workspace_id,asset_id,position)
select id,workspace_id,asset_id,0 from public.organization_messages where asset_id is not null;
revoke all on public.organization_message_assets from public,rafik_guest,rafik_user;
grant select,insert,delete on public.organization_message_assets to rafik_api;
