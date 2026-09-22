SELECT jsonb_build_object(
 'migration_count',(SELECT count(*) FROM supabase_migrations.schema_migrations),
 'follow_forms_by_recent_day',(SELECT jsonb_agg(to_jsonb(x) ORDER BY day) FROM (SELECT created_at::date AS day,count(*) FROM public.forms WHERE created_at>now()-interval '14 days' GROUP BY created_at::date) x),
 'follow_groups',(SELECT jsonb_build_object('groups',count(*),'groups_with_multiple_pending',count(*) FILTER(WHERE pending>1),'maximum_pending_per_client_program',max(pending)) FROM (SELECT client_id,program_id,count(*) FILTER(WHERE status='pending') AS pending FROM public.forms WHERE type='follow' GROUP BY client_id,program_id) x),
 'workout_duplicates',(SELECT jsonb_build_object('same_client_assignment_date_groups',count(*),'extra_rows',coalesce(sum(n-1),0),'groups_multiple_done',count(*) FILTER(WHERE done>1),'groups_multiple_open',count(*) FILTER(WHERE open>1)) FROM (SELECT client_id,user_program_id,created_for_date,count(*) AS n,count(*) FILTER(WHERE done IS TRUE) AS done,count(*) FILTER(WHERE done IS FALSE) AS open FROM public.workout_sheets GROUP BY client_id,user_program_id,created_for_date HAVING count(*)>1) x),
 'nutrition_duplicate_days',(SELECT jsonb_build_object('groups',count(*),'extra_rows',coalesce(sum(n-1),0)) FROM (SELECT profile_id,date_logged,count(*) AS n FROM public.nutritional_sheets WHERE date_logged IS NOT NULL GROUP BY profile_id,date_logged HAVING count(*)>1) x),
 'assignment_identity_mismatch',(SELECT count(*) FROM public.workout_sheets ws JOIN public.user_programs up ON up.id=ws.user_program_id JOIN public.profiles p ON p.id=up.client_id WHERE ws.client_id IS DISTINCT FROM p.user_id),
 'profile_link_mismatch',(SELECT count(*) FROM public.users u JOIN public.profiles p ON p.id=u.profile_id WHERE p.user_id IS DISTINCT FROM u.id),
 'known_dead_relations',jsonb_build_object('singular_user',to_regclass('public.user')::text,'documents',to_regclass('public.documents')::text),
 'current_activity',(SELECT jsonb_agg(to_jsonb(a)) FROM (SELECT state,wait_event_type,count(*) FROM pg_stat_activity WHERE datname=current_database() GROUP BY state,wait_event_type) a)
) AS consistency;
