-- Two deliberately synthetic historical sessions make the local review workflow visible.
-- Neither is a current-day occurrence, so a tester can start today's plan normally.
insert into public.sessions(id,client_id,coach_id,assignment_id,version_id,day_id,occurrence_key,local_date,title,prescription,status,note,coach_note,reviewed_at,started_at,completed_at)
select f.id::uuid,'10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',v.id,d->>'id',
 '50000000-0000-4000-8000-000000000001:'||((now() at time zone 'Asia/Dubai')::date-f.days_ago)::text||':'||(d->>'id'),(now() at time zone 'Asia/Dubai')::date-f.days_ago,v.title,d,'completed',f.note,f.reply,
 case when f.reply<>'' then now()-make_interval(days=>f.days_ago)+interval '1 hour' else null end,
 now()-make_interval(days=>f.days_ago),now()-make_interval(days=>f.days_ago)+interval '32 minutes'
from public.plan_versions v
cross join (values
 ('90000000-0000-4000-8000-000000000001',0,5,'The final reps felt harder, but I kept a steady pace.','Keep this load next time. Take the full rest between sets.'),
 ('90000000-0000-4000-8000-000000000002',1,2,'I finished most of the session. Could we review the shoulder press?','')
) f(id,day_index,days_ago,note,reply)
cross join lateral (select v.prescription->'days'->f.day_index as d) day_snapshot
where v.id='30000000-0000-4000-8000-000000000001';
insert into public.set_entries(session_id,exercise_key,set_index,reps,load,unit,completed)
select s.id,e->>'key',i,(e->>'reps')::int,(e->>'load')::numeric,e->>'unit',not(s.day_id='foundation-b' and e->>'key'='shoulder' and i=2)
from public.sessions s cross join lateral jsonb_array_elements(s.prescription->'exercises') e
cross join lateral generate_series(0,(e->>'sets')::int-1) i
where s.id in ('90000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000002');
