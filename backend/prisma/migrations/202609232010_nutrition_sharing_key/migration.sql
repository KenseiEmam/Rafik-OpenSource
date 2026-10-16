-- Explicit composite uniqueness also expresses the one-to-one scoped Prisma relation.
alter table public.organization_nutrition_sharing add unique(workspace_id,member_id);
