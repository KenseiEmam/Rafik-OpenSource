-- Ownership references are checked at commit so a whole workspace can be removed atomically
-- by bounded test cleanup/operator tooling, without transient cascade-order violations.
do $$ declare c record; begin
 for c in select conrelid::regclass as rel,conname from pg_constraint where contype='f' and conrelid in ('public.organization_exercises'::regclass,'public.organization_programs'::regclass,'public.organization_versions'::regclass,'public.organization_assignments'::regclass,'public.organization_sessions'::regclass) loop
 execute format('alter table %s alter constraint %I deferrable initially deferred',c.rel,c.conname);
 end loop;
end $$;
