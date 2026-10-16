SELECT jsonb_build_object(
 'snapshot_date',CURRENT_DATE,
 'auth', (SELECT jsonb_build_object('users',count(*),'email_confirmed',count(*) FILTER(WHERE email_confirmed_at IS NOT NULL),'signed_in_last_30_days',count(*) FILTER(WHERE last_sign_in_at>now()-interval '30 days'),'signed_in_last_90_days',count(*) FILTER(WHERE last_sign_in_at>now()-interval '90 days'),'latest_sign_in',max(last_sign_in_at)) FROM auth.users),
 'application_users',(SELECT count(*) FROM public.users),
 'user_identity_match',(SELECT jsonb_build_object('matched_auth_email',count(*) FILTER(WHERE EXISTS(SELECT 1 FROM auth.users a WHERE lower(a.email)=lower(u.email))),'without_auth_email_match',count(*) FILTER(WHERE NOT EXISTS(SELECT 1 FROM auth.users a WHERE lower(a.email)=lower(u.email)))) FROM public.users u),
 'profiles',(SELECT jsonb_build_object('count',count(*),'without_user',count(*) FILTER(WHERE user_id IS NULL),'assigned',count(*) FILTER(WHERE user_program_id IS NOT NULL)) FROM public.profiles),
 'profile_users_with_multiple_profiles',(SELECT count(*) FROM (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL GROUP BY user_id HAVING count(*)>1) d),
 'programs',(SELECT jsonb_agg(to_jsonb(p)) FROM (SELECT status,count(*) FROM public.programs GROUP BY status) p),
 'assignments',(SELECT jsonb_agg(to_jsonb(p)) FROM (SELECT status,count(*),count(*) FILTER(WHERE expires_on<now()) AS past_expiry FROM public.user_programs GROUP BY status) p),
 'entitlements',(SELECT jsonb_agg(to_jsonb(p)) FROM (SELECT status,count(*) FROM public.entitlements GROUP BY status) p),
 'workouts',(SELECT jsonb_build_object('total',count(*),'done',count(*) FILTER(WHERE done IS TRUE),'rest',count(*) FILTER(WHERE rest_day IS TRUE),'done_non_rest',count(*) FILTER(WHERE done IS TRUE AND rest_day IS NOT TRUE),'dated_completed',count(*) FILTER(WHERE date_completed IS NOT NULL),'latest_created',max(created_at),'latest_completed',max(date_completed),'completed_last_30_days',count(*) FILTER(WHERE date_completed>now()-interval '30 days'),'clients_with_done_non_rest',count(DISTINCT client_id) FILTER(WHERE done IS TRUE AND rest_day IS NOT TRUE)) FROM public.workout_sheets),
 'duplicate_workout_dates',(SELECT count(*) FROM (SELECT client_id,user_program_id,created_for_date FROM public.workout_sheets GROUP BY client_id,user_program_id,created_for_date HAVING count(*)>1) d),
 'nutrition',(SELECT jsonb_build_object('total',count(*),'latest_created',max(created_at),'latest_date_logged',max(date_logged)) FROM public.nutritional_sheets),
 'forms',(SELECT jsonb_agg(to_jsonb(p)) FROM (SELECT type,status,count(*) FROM public.forms GROUP BY type,status) p),
 'chat',(SELECT jsonb_build_object('total',count(*),'form_linked',count(*) FILTER(WHERE form IS NOT NULL),'latest_created',max(created_at)) FROM public.chat_messages)
) AS aggregates;
