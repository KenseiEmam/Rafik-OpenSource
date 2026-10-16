CREATE TABLE public.platform_identity_state(user_id uuid PRIMARY KEY REFERENCES identity.users(id) ON DELETE CASCADE,suspended boolean NOT NULL DEFAULT false,revision integer NOT NULL DEFAULT 1 CHECK(revision>0));
CREATE TABLE public.platform_operations(id uuid PRIMARY KEY,actor_id uuid REFERENCES identity.users(id) ON DELETE SET NULL,kind text NOT NULL,subject_id uuid,reason text NOT NULL,payload jsonb NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX platform_operations_recent ON public.platform_operations(created_at DESC,id DESC);
REVOKE ALL ON public.platform_identity_state,public.platform_operations FROM PUBLIC,rafik_guest,rafik_user;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.platform_identity_state TO rafik_api;
GRANT SELECT,INSERT ON public.platform_operations TO rafik_api;
CREATE FUNCTION public.platform_support_read(p_actor uuid,p_search text,p_offset integer) RETURNS SETOF public.support_cases LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.platform_grants WHERE user_id=p_actor) THEN RAISE EXCEPTION 'forbidden'; END IF;
 RETURN QUERY SELECT c.* FROM public.support_cases c WHERE c.team_id IS NULL AND c.subject ILIKE p_search ORDER BY c.updated_at DESC,c.id LIMIT 26 OFFSET greatest(0,least(p_offset,100000));
END $$;
CREATE FUNCTION public.platform_support_reply(p_actor uuid,p_id uuid,p_revision integer,p_reply text) RETURNS public.support_cases LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.platform_grants WHERE user_id=p_actor) OR NOT EXISTS(SELECT 1 FROM public.support_cases WHERE id=p_id AND team_id IS NULL) THEN RAISE EXCEPTION 'forbidden';END IF;
 RETURN public.operator_support_reply(p_id,p_revision,p_reply);
END $$;
REVOKE ALL ON FUNCTION public.platform_support_read(uuid,text,integer),public.platform_support_reply(uuid,uuid,integer,text) FROM PUBLIC,rafik_guest,rafik_user;
GRANT EXECUTE ON FUNCTION public.platform_support_read(uuid,text,integer),public.platform_support_reply(uuid,uuid,integer,text) TO rafik_api;
