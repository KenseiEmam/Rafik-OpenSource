-- Only explicit workspace destruction (test cleanup/operator recovery) cascades owned records.
-- Normal closure preserves them; account deletion only deactivates/anonymizes memberships.
alter table public.organization_assignments add foreign key(workspace_id) references public.workspaces on delete cascade;
alter table public.organization_sessions add foreign key(workspace_id) references public.workspaces on delete cascade;
