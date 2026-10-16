CREATE TABLE public.notification_preferences (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 categories jsonb NOT NULL DEFAULT '{"messages":{"in_app":true,"email":false},"feedback":{"in_app":true,"email":false},"checkins":{"in_app":true,"email":false},"calendar":{"in_app":true,"email":false}}',
 quiet_start integer NOT NULL DEFAULT 22 CHECK(quiet_start BETWEEN 0 AND 23),quiet_end integer NOT NULL DEFAULT 8 CHECK(quiet_end BETWEEN 0 AND 23),revision integer NOT NULL DEFAULT 1
);
CREATE TABLE public.notification_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,category text NOT NULL CHECK(category IN('messages','feedback','checkins','calendar')),
 source_kind text NOT NULL,source_id uuid NOT NULL,source_group uuid NOT NULL,event_key text NOT NULL,source_revision integer,
 created_at timestamptz NOT NULL DEFAULT now(),read_at timestamptz,not_before timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days',
 state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','intercepted','suppressed','failed')),attempts integer NOT NULL DEFAULT 0,reason text NOT NULL DEFAULT '',
 UNIQUE(user_id,event_key)
);
CREATE INDEX notifications_inbox ON public.notification_events(user_id,created_at DESC,id);
CREATE INDEX notifications_dispatch ON public.notification_events(not_before,id) WHERE state='pending';
CREATE TABLE public.notification_intercepts (
 event_id uuid PRIMARY KEY REFERENCES public.notification_events(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,subject text NOT NULL,body text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.notification_preferences,public.notification_events,public.notification_intercepts FROM PUBLIC,rafik_guest,rafik_user;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.notification_preferences,public.notification_events,public.notification_intercepts TO rafik_api;
CREATE FUNCTION public.capture_notification(p_user uuid,p_category text,p_kind text,p_source uuid,p_group uuid,p_key text,p_workspace uuid DEFAULT NULL,p_revision integer DEFAULT NULL) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 INSERT INTO public.notification_events(user_id,category,source_kind,source_id,source_group,event_key,workspace_id,source_revision)
 SELECT p_user,p_category,p_kind,p_source,p_group,p_key,p_workspace,p_revision WHERE p_user IS NOT NULL ON CONFLICT(user_id,event_key) DO NOTHING;
$$;
REVOKE ALL ON FUNCTION public.capture_notification(uuid,text,text,uuid,uuid,text,uuid,integer) FROM PUBLIC,rafik_guest,rafik_user;
GRANT EXECUTE ON FUNCTION public.capture_notification(uuid,text,text,uuid,uuid,text,uuid,integer) TO rafik_api;
CREATE FUNCTION public.capture_domain_notification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; peer record; e record;
BEGIN
 IF TG_TABLE_NAME='messages' THEN
  SELECT CASE WHEN NEW.sender_id=c.coach_id THEN c.client_id ELSE c.coach_id END INTO target FROM public.coach_clients c WHERE c.id=NEW.relationship_id;
  PERFORM public.capture_notification(target,'messages','message',NEW.id,NEW.relationship_id,'message:'||NEW.id);
 ELSIF TG_TABLE_NAME='sessions' THEN
  IF NEW.reviewed_at IS NOT NULL AND NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
   PERFORM public.capture_notification(NEW.client_id,'feedback','workout',NEW.id,NEW.id,'workout:'||NEW.id||':'||NEW.reviewed_at);
  END IF;
 ELSIF TG_TABLE_NAME='coaching_requests' THEN
  IF NEW.reviewed_at IS NOT NULL AND NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
   SELECT client_id INTO target FROM public.coach_clients WHERE id=NEW.relationship_id;
   PERFORM public.capture_notification(target,'feedback','form_feedback',NEW.id,NEW.id,'form-feedback:'||NEW.id||':'||NEW.reviewed_at);
  END IF;
 ELSIF TG_TABLE_NAME='appointments' THEN
  IF TG_OP='INSERT' OR NEW.revision IS DISTINCT FROM OLD.revision THEN
   FOR peer IN SELECT coach_id id FROM public.coach_clients WHERE id=NEW.relationship_id UNION SELECT client_id FROM public.coach_clients WHERE id=NEW.relationship_id LOOP
    IF peer.id IS DISTINCT FROM nullif(current_setting('rafik.actor',true),'')::uuid THEN PERFORM public.capture_notification(peer.id,'calendar','appointment_change',NEW.id,NEW.id,'appointment:'||NEW.id||':'||NEW.revision,NULL,NEW.revision);END IF;
   END LOOP;
  END IF;
 ELSIF TG_TABLE_NAME='organization_messages' THEN
  FOR peer IN SELECT m.user_id FROM public.organization_channel_members p JOIN public.workspace_members m ON m.id=p.member_id WHERE p.channel_id=NEW.channel_id AND m.active AND m.id<>NEW.sender_id LOOP
   PERFORM public.capture_notification(peer.user_id,'messages','organization_message',NEW.id,NEW.channel_id,'organization-message:'||NEW.id,NEW.workspace_id);
  END LOOP;
 ELSIF TG_TABLE_NAME='organization_events' THEN
  IF NEW.revision IS DISTINCT FROM OLD.revision THEN
   FOR peer IN SELECT m.user_id FROM public.organization_event_people p JOIN public.workspace_members m ON m.id=p.member_id WHERE p.event_id=NEW.id AND m.active LOOP
    PERFORM public.capture_notification(peer.user_id,'calendar','organization_event',NEW.id,NEW.id,'organization-event:'||NEW.id||':'||NEW.revision,NEW.workspace_id,NEW.revision);
   END LOOP;
  END IF;
 ELSIF TG_TABLE_NAME='organization_event_people' THEN
  SELECT * INTO e FROM public.organization_events WHERE id=NEW.event_id;
  SELECT user_id INTO target FROM public.workspace_members WHERE id=NEW.member_id AND active;
  PERFORM public.capture_notification(target,'calendar','organization_event',e.id,e.id,'organization-event:'||e.id||':'||e.revision,e.workspace_id,e.revision);
 ELSIF TG_TABLE_NAME='assessment_results' THEN
  SELECT user_id INTO target FROM public.workspace_members WHERE id=NEW.member_id AND active;
  PERFORM public.capture_notification(target,'feedback','organization_result',NEW.event_id,NEW.event_id,'organization-result:'||NEW.event_id||':'||NEW.member_id||':'||NEW.revision,NEW.workspace_id,NEW.revision);
 ELSIF TG_TABLE_NAME='organization_sessions' THEN
  IF NEW.document->>'reviewed_at' IS NOT NULL AND NEW.document->>'reviewed_at' IS DISTINCT FROM OLD.document->>'reviewed_at' THEN
   SELECT user_id INTO target FROM public.workspace_members WHERE id=NEW.member_id AND active;
   PERFORM public.capture_notification(target,'feedback','organization_workout',NEW.id,NEW.id,'organization-workout:'||NEW.id||':'||(NEW.document->>'reviewed_at'),NEW.workspace_id);
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_domain_notification() FROM PUBLIC,rafik_guest,rafik_user;
CREATE TRIGGER notification_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.capture_domain_notification();
CREATE TRIGGER notification_workout AFTER UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.capture_domain_notification();
CREATE TRIGGER notification_form AFTER UPDATE ON public.coaching_requests FOR EACH ROW EXECUTE FUNCTION public.capture_domain_notification();
CREATE TRIGGER notification_appointment AFTER INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.capture_domain_notification();
CREATE TRIGGER notification_org_message AFTER INSERT ON public.organization_messages FOR EACH ROW EXECUTE FUNCTION public.capture_domain_notification();
CREATE TRIGGER notification_org_event AFTER UPDATE ON public.organization_events FOR EACH ROW EXECUTE FUNCTION public.capture_domain_notification();
CREATE TRIGGER notification_org_person AFTER INSERT ON public.organization_event_people FOR EACH ROW EXECUTE FUNCTION public.capture_domain_notification();
CREATE TRIGGER notification_org_result AFTER INSERT OR UPDATE ON public.assessment_results FOR EACH ROW EXECUTE FUNCTION public.capture_domain_notification();
CREATE TRIGGER notification_org_workout AFTER UPDATE ON public.organization_sessions FOR EACH ROW EXECUTE FUNCTION public.capture_domain_notification();
