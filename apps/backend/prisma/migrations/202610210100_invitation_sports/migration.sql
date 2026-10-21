-- Invitations carry descriptive institution sports, not authority grants.
ALTER TABLE public.workspace_invitations ADD COLUMN sport_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.workspace_invitations ADD CONSTRAINT workspace_invitation_admin_no_sports CHECK (NOT ('admin'=ANY(roles)) OR cardinality(sport_ids)=0);
