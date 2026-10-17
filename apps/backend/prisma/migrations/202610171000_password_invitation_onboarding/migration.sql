ALTER TABLE identity.users ADD COLUMN password_hash text;

CREATE TABLE identity.password_setup_tokens (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX password_setup_tokens_user_expiry
  ON identity.password_setup_tokens(user_id, expires_at);
REVOKE ALL ON identity.password_setup_tokens FROM PUBLIC, rafik_guest, rafik_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON identity.password_setup_tokens TO rafik_api;

DROP TABLE identity.challenges;
DROP TABLE identity.mail_messages;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp AS $$
DECLARE i public.invitations; u identity.users; rel uuid; a uuid;
BEGIN
  SELECT * INTO u FROM identity.users WHERE id=identity.actor_id();
  IF NOT FOUND THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT * INTO i FROM public.invitations
    WHERE token_hash=encode(digest(p_token,'sha256'),'hex') FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_invitation'; END IF;
  IF lower(u.email)<>i.intended_email THEN RAISE EXCEPTION 'wrong_email'; END IF;
  IF i.status='accepted' AND i.accepted_by=u.id THEN RETURN i.assignment_id; END IF;
  IF i.status<>'pending' OR i.expires_at<now() THEN RAISE EXCEPTION 'invitation_unavailable'; END IF;
  IF i.coach_id=u.id THEN RAISE EXCEPTION 'cannot_invite_yourself'; END IF;
  PERFORM public.ensure_profile();
  INSERT INTO public.coach_clients(coach_id,client_id) VALUES(i.coach_id,u.id)
    ON CONFLICT(coach_id,client_id) DO UPDATE SET state='active' RETURNING id INTO rel;
  UPDATE public.assignments SET state='archived' WHERE relationship_id=rel AND state='active';
  INSERT INTO public.assignments(relationship_id,coach_id,client_id,version_id)
    VALUES(rel,i.coach_id,u.id,i.version_id) RETURNING id INTO a;
  UPDATE public.invitations SET status='accepted',accepted_by=u.id,assignment_id=a WHERE id=i.id;
  RETURN a;
END $$;

CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE i public.team_invitations;
BEGIN
  SELECT * INTO i FROM public.team_invitations
    WHERE token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
  IF NOT FOUND THEN RAISE EXCEPTION 'invitation_unavailable'; END IF;
  PERFORM id FROM public.teams WHERE id=i.team_id FOR UPDATE;
  SELECT * INTO i FROM public.team_invitations WHERE id=i.id FOR UPDATE;
  IF identity.actor_id() IS NULL OR NOT EXISTS (
    SELECT 1 FROM identity.users WHERE id=identity.actor_id() AND lower(email)=i.email
  ) THEN RAISE EXCEPTION 'wrong_email'; END IF;
  IF i.state='accepted' AND i.accepted_by=identity.actor_id() THEN RETURN i.team_id; END IF;
  IF i.state<>'pending' OR i.expires_at<=now() OR EXISTS (
    SELECT 1 FROM public.teams WHERE id=i.team_id AND archived
  ) THEN RAISE EXCEPTION 'invitation_unavailable'; END IF;
  PERFORM public.require_team_growth(i.team_id,'accept_staff');
  INSERT INTO public.team_members(team_id,user_id,role)
    VALUES(i.team_id,identity.actor_id(),i.role)
    ON CONFLICT(team_id,user_id) DO UPDATE SET state='active',role=excluded.role;
  UPDATE public.team_invitations SET state='accepted',accepted_by=identity.actor_id() WHERE id=i.id;
  PERFORM public.team_log(i.team_id,'staff_joined',identity.actor_id());
  RETURN i.team_id;
END $$;
