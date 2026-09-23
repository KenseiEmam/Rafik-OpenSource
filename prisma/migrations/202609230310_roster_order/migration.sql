-- The measured first roster page scanned/sorted the full workspace (1,321 fixture rows).
-- Match its stable workspace/activity/name/id order; no cache or search service needed.
CREATE INDEX workspace_members_name_page ON public.workspace_members(workspace_id,active,name,id);
