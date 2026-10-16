CREATE TABLE public.organization_channels (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 100),created_by uuid NOT NULL,revision integer NOT NULL DEFAULT 1,
 archived boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,workspace_id),FOREIGN KEY(created_by,workspace_id) REFERENCES public.workspace_members(id,workspace_id) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE public.organization_channel_members (
 channel_id uuid NOT NULL,workspace_id uuid NOT NULL,member_id uuid NOT NULL,manager boolean NOT NULL DEFAULT false,
 PRIMARY KEY(channel_id,member_id),FOREIGN KEY(channel_id,workspace_id) REFERENCES public.organization_channels(id,workspace_id) ON DELETE CASCADE,
 FOREIGN KEY(member_id,workspace_id) REFERENCES public.workspace_members(id,workspace_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX channel_members_person ON public.organization_channel_members(member_id,channel_id);
CREATE TABLE public.organization_messages (
 id uuid PRIMARY KEY,sequence bigint GENERATED ALWAYS AS IDENTITY UNIQUE,workspace_id uuid NOT NULL,channel_id uuid NOT NULL,sender_id uuid NOT NULL,
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(channel_id,workspace_id) REFERENCES public.organization_channels(id,workspace_id) ON DELETE CASCADE,
 FOREIGN KEY(sender_id,workspace_id) REFERENCES public.workspace_members(id,workspace_id) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX organization_messages_page ON public.organization_messages(channel_id,sequence DESC);
CREATE TABLE public.organization_channel_reads (
 channel_id uuid NOT NULL,workspace_id uuid NOT NULL,member_id uuid NOT NULL,sequence bigint NOT NULL DEFAULT 0,
 PRIMARY KEY(channel_id,member_id),FOREIGN KEY(channel_id,workspace_id) REFERENCES public.organization_channels(id,workspace_id) ON DELETE CASCADE,
 FOREIGN KEY(member_id,workspace_id) REFERENCES public.workspace_members(id,workspace_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
REVOKE ALL ON public.organization_channels,public.organization_channel_members,public.organization_messages,public.organization_channel_reads FROM PUBLIC,rafik_guest,rafik_user;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.organization_channels,public.organization_channel_members,public.organization_messages,public.organization_channel_reads TO rafik_api;
GRANT USAGE,SELECT ON SEQUENCE public.organization_messages_sequence_seq TO rafik_api;
