CREATE TABLE public.instance_branding (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  owner_id uuid UNIQUE REFERENCES identity.users(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Rafik' CHECK (length(name) BETWEEN 1 AND 60),
  accent text NOT NULL DEFAULT '#285943' CHECK (accent ~ '^#[0-9a-f]{6}$'),
  background_light text NOT NULL DEFAULT '#f8f8f3' CHECK (background_light ~ '^#[0-9a-f]{6}$'),
  background_dark text NOT NULL DEFAULT '#171e1a' CHECK (background_dark ~ '^#[0-9a-f]{6}$'),
  logo bytea,
  logo_mime text CHECK (logo_mime IN ('image/png','image/jpeg','image/webp')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((logo IS NULL) = (logo_mime IS NULL)),
  CHECK (logo IS NULL OR octet_length(logo) <= 524288)
);
INSERT INTO public.instance_branding(id) VALUES (true);
UPDATE public.instance_branding b SET owner_id = (
  SELECT w.created_by FROM public.workspaces w
  JOIN public.workspace_members m ON m.workspace_id=w.id AND m.user_id=w.created_by
  WHERE w.kind='organization' AND m.active AND m.roles @> ARRAY['admin']::text[]
  ORDER BY w.created_at,w.id LIMIT 1
);
ALTER TABLE public.instance_branding ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.instance_branding FROM public, rafik_guest, rafik_user;

CREATE FUNCTION public.read_instance_branding()
RETURNS TABLE(name text, accent text, background_light text, background_dark text, logo_mime text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT b.name,b.accent,b.background_light,b.background_dark,b.logo_mime,b.updated_at FROM public.instance_branding b WHERE b.id=true
$$;

CREATE FUNCTION public.read_instance_branding_logo()
RETURNS TABLE(logo bytea, mime text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT b.logo,b.logo_mime FROM public.instance_branding b WHERE b.id=true AND b.logo IS NOT NULL
$$;

CREATE FUNCTION public.claim_instance_branding(p_actor uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members m
    JOIN public.workspaces w ON w.id=m.workspace_id
    WHERE m.user_id=p_actor AND m.active AND m.roles @> ARRAY['admin']::text[] AND w.kind='organization'
  ) THEN RAISE EXCEPTION 'workspace_unavailable'; END IF;
  UPDATE public.instance_branding SET owner_id=p_actor WHERE id=true AND owner_id IS NULL;
  RETURN (SELECT owner_id=p_actor FROM public.instance_branding WHERE id=true);
END $$;

CREATE FUNCTION public.can_manage_instance_branding(p_actor uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT owner_id=p_actor FROM public.instance_branding WHERE id=true
$$;

CREATE FUNCTION public.update_instance_branding(p_actor uuid,p_name text,p_accent text,p_background_light text,p_background_dark text,p_logo bytea,p_mime text,p_keep_logo boolean)
RETURNS TABLE(name text, accent text, background_light text, background_dark text, logo_mime text, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.instance_branding WHERE id=true AND owner_id=p_actor) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF length(btrim(p_name)) NOT BETWEEN 1 AND 60 OR p_accent !~ '^#[0-9a-fA-F]{6}$'
     OR p_background_light !~ '^#[0-9a-fA-F]{6}$' OR p_background_dark !~ '^#[0-9a-fA-F]{6}$'
     OR (NOT p_keep_logo AND p_logo IS NOT NULL AND octet_length(p_logo)>524288)
     OR (NOT p_keep_logo AND p_logo IS NOT NULL AND p_mime NOT IN ('image/png','image/jpeg','image/webp'))
     OR (NOT p_keep_logo AND p_logo IS NULL AND p_mime IS NOT NULL) THEN
    RAISE EXCEPTION 'invalid_branding';
  END IF;
  UPDATE public.instance_branding b SET
    name=btrim(p_name), accent=lower(p_accent), background_light=lower(p_background_light), background_dark=lower(p_background_dark),
    logo=CASE WHEN p_keep_logo THEN b.logo ELSE p_logo END,
    logo_mime=CASE WHEN p_keep_logo THEN b.logo_mime ELSE p_mime END,
    updated_at=now()
  WHERE b.id=true;
  RETURN QUERY SELECT b.name,b.accent,b.background_light,b.background_dark,b.logo_mime,b.updated_at FROM public.instance_branding b WHERE b.id=true;
END $$;

REVOKE ALL ON FUNCTION public.read_instance_branding(), public.read_instance_branding_logo(),
  public.claim_instance_branding(uuid),public.update_instance_branding(uuid,text,text,text,text,bytea,text,boolean) FROM public,rafik_guest,rafik_user;
REVOKE ALL ON FUNCTION public.can_manage_instance_branding(uuid) FROM public,rafik_guest,rafik_user;
GRANT EXECUTE ON FUNCTION public.read_instance_branding(), public.read_instance_branding_logo(),
  public.claim_instance_branding(uuid),public.update_instance_branding(uuid,text,text,text,text,bytea,text,boolean) TO rafik_api;
GRANT EXECUTE ON FUNCTION public.can_manage_instance_branding(uuid) TO rafik_api;
