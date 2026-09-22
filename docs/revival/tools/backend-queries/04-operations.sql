SELECT jsonb_build_object(
  'storage_buckets', (SELECT jsonb_agg(jsonb_build_object('id',id,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types) ORDER BY id) FROM storage.buckets),
  'storage_object_counts', (SELECT jsonb_agg(to_jsonb(o)) FROM (SELECT bucket_id,count(*) AS objects,coalesce(sum((metadata->>'size')::bigint),0) AS bytes FROM storage.objects GROUP BY bucket_id ORDER BY bucket_id) o),
  'migration_relations', (SELECT jsonb_agg(c.relname ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='supabase_migrations' AND c.relkind IN ('r','p')),
  'scheduled_job_relation',to_regclass('cron.job')::text,
  'schema_grants', (SELECT jsonb_agg(jsonb_build_object('schema',nspname,'anon_usage',has_schema_privilege('anon',oid,'USAGE'),'authenticated_usage',has_schema_privilege('authenticated',oid,'USAGE'),'anon_create',has_schema_privilege('anon',oid,'CREATE'),'authenticated_create',has_schema_privilege('authenticated',oid,'CREATE'))) FROM pg_namespace WHERE nspname IN ('public','auth','storage')),
  'database_stats', (SELECT jsonb_build_object('database_bytes',pg_database_size(datname),'connections',numbackends,'deadlocks',deadlocks,'stats_reset',stats_reset) FROM pg_stat_database WHERE datname=current_database()),
  'default_acl', (SELECT jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(d.defaclrole),'schema',n.nspname,'object_type',d.defaclobjtype,'acl',d.defaclacl::text) ORDER BY n.nspname,d.defaclobjtype) FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE n.nspname='public')
) AS operations;
