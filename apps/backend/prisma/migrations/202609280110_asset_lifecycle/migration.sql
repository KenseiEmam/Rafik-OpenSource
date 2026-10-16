-- Workspace deletion cascades both assets and messages; defer the cross-reference
-- until the transaction ends rather than relying on PostgreSQL trigger order.
alter table public.organization_messages alter constraint organization_messages_workspace_id_asset_id_fkey deferrable initially deferred;
alter table public.organization_assets alter constraint organization_assets_workspace_id_owner_id_fkey deferrable initially deferred;
alter table public.organization_assets add column revision integer not null default 1 check(revision>0);
