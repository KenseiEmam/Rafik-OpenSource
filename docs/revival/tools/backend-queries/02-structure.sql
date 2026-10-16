SELECT jsonb_build_object(
  'columns', (SELECT jsonb_agg(jsonb_build_object('table',table_name,'name',column_name,'position',ordinal_position,'type',data_type,'udt',udt_name,'nullable',is_nullable,'default',column_default,'identity',is_identity,'generated',is_generated) ORDER BY table_name,ordinal_position) FROM information_schema.columns WHERE table_schema='public'),
  'constraints', (SELECT jsonb_agg(jsonb_build_object('table',c.relname,'name',con.conname,'type',con.contype,'definition',pg_get_constraintdef(con.oid),'validated',con.convalidated) ORDER BY c.relname,con.conname) FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'),
  'indexes', (SELECT jsonb_agg(to_jsonb(i) ORDER BY i.tablename,i.indexname) FROM pg_indexes i WHERE i.schemaname='public'),
  'views', (SELECT jsonb_agg(jsonb_build_object('name',c.relname,'definition',pg_get_viewdef(c.oid,true)) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('v','m')),
  'enums', (SELECT jsonb_agg(jsonb_build_object('type',t.typname,'value',e.enumlabel,'sort',e.enumsortorder) ORDER BY t.typname,e.enumsortorder) FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public')
) AS structure;
