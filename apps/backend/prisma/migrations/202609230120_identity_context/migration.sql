-- API sets actor and claims together; SQL regression/maintenance contexts can set claims alone.
create or replace function identity.actor_id() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('rafik.actor',true),''),nullif(current_setting('rafik.claims',true),'')::jsonb->>'sub')::uuid
$$;
