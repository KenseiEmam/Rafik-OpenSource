-- Enforce the single institutional role model established by ADR 0019.
-- Preserve membership and invitation rows; reduce only combined role arrays.
UPDATE public.workspace_members
SET roles = CASE
      WHEN 'admin' = ANY (roles) THEN ARRAY['admin']::text[]
      WHEN 'trainer' = ANY (roles) THEN ARRAY['trainer']::text[]
      WHEN 'trainee' = ANY (roles) THEN ARRAY['trainee']::text[]
      ELSE roles
    END,
    trainer_id = CASE WHEN cardinality(roles) > 1 THEN NULL ELSE trainer_id END
WHERE cardinality(roles) > 1;

UPDATE public.workspace_invitations
SET roles = CASE
  WHEN 'admin' = ANY (roles) THEN ARRAY['admin']::text[]
  WHEN 'trainer' = ANY (roles) THEN ARRAY['trainer']::text[]
  WHEN 'trainee' = ANY (roles) THEN ARRAY['trainee']::text[]
  ELSE roles
END
WHERE cardinality(roles) > 1;

DO $$
DECLARE constraint_row record;
BEGIN
  FOR constraint_row IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.workspace_members'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%cardinality(roles)%'
  LOOP
    EXECUTE format('ALTER TABLE public.workspace_members DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
  ALTER TABLE public.workspace_members
    ADD CONSTRAINT workspace_members_single_role_check
      CHECK (cardinality(roles) = 1 AND roles <@ ARRAY['admin', 'trainer', 'trainee']::text[]);

  FOR constraint_row IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.workspace_invitations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%cardinality(roles)%'
  LOOP
    EXECUTE format('ALTER TABLE public.workspace_invitations DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
  ALTER TABLE public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_single_role_check
      CHECK (cardinality(roles) = 1 AND roles <@ ARRAY['admin', 'trainer', 'trainee']::text[]);
END $$;
