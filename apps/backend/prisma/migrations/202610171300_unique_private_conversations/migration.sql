ALTER TABLE public.organization_channels
  ADD COLUMN private_pair_key text,
  ADD COLUMN conversation_group_id uuid;

ALTER TABLE public.organization_channels
  ADD CONSTRAINT organization_channels_group_fk
  FOREIGN KEY (workspace_id, conversation_group_id)
  REFERENCES public.organization_groups(workspace_id, id)
  ON DELETE CASCADE;

WITH pairs AS (
  SELECT c.id, c.workspace_id, c.created_at,
         array_agg(m.member_id::text ORDER BY m.member_id::text) AS member_ids
  FROM public.organization_channels c
  JOIN public.organization_channel_members m ON m.channel_id = c.id
  WHERE c.private_pair
  GROUP BY c.id, c.workspace_id, c.created_at
  HAVING count(*) = 2
), ranked AS (
  SELECT id, workspace_id, member_ids[1] || ':' || member_ids[2] AS pair_key,
         row_number() OVER (
           PARTITION BY workspace_id, member_ids
           ORDER BY created_at, id
         ) AS pair_rank
  FROM pairs
)
UPDATE public.organization_channels c
SET private_pair_key = CASE WHEN r.pair_rank = 1 THEN r.pair_key ELSE NULL END,
    archived = c.archived OR r.pair_rank > 1
FROM ranked r
WHERE c.id = r.id;

CREATE UNIQUE INDEX organization_private_pair_unique
  ON public.organization_channels(workspace_id, private_pair_key);

CREATE UNIQUE INDEX organization_group_conversation_unique
  ON public.organization_channels(workspace_id, conversation_group_id);
