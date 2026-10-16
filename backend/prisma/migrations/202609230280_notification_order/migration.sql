ALTER TABLE public.notification_events ADD COLUMN sequence bigint GENERATED ALWAYS AS IDENTITY UNIQUE;
GRANT USAGE,SELECT ON SEQUENCE public.notification_events_sequence_seq TO rafik_api;
CREATE INDEX notifications_group_latest ON public.notification_events(user_id,category,source_group,sequence DESC);
