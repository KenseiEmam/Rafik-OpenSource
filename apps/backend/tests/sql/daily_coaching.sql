begin;
-- Rollback-only isolation from notes entered through the local preview.
delete from public.client_context where id='40000000-0000-4000-8000-000000000001';
create function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
set local role rafik_user;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"rafik_user"}',true);
select public.save_client_context('40000000-0000-4000-8000-000000000001','Build consistency','Limited equipment','Private coaching context',0);
select pg_temp.assert((public.save_client_context('40000000-0000-4000-8000-000000000001','Build consistency','Limited equipment','Private coaching context',0)).revision=1,'context save replay does not increment revision');
do $$ begin
 begin perform public.save_client_context('40000000-0000-4000-8000-000000000001','Stale','','',0);raise exception 'stale accepted'; exception when raise_exception then if sqlerrm<>'conflict' then raise; end if; end;
 perform pg_temp.assert(true,'stale context cannot overwrite notes');
end $$;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"rafik_user"}',true);
select pg_temp.assert((select count(*) from public.client_context)=0,'client cannot read private coach notes');
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000004","role":"rafik_user"}',true);
select pg_temp.assert((select count(*) from public.client_context)=0,'another coach cannot read private notes');
do $$ begin
 begin perform public.set_client_state('40000000-0000-4000-8000-000000000001','archived');raise exception 'foreign archive accepted'; exception when raise_exception then if sqlerrm<>'forbidden' then raise; end if; end;
 perform pg_temp.assert(true,'unrelated coach cannot archive a relationship');
end $$;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"rafik_user"}',true);
select public.set_client_state('40000000-0000-4000-8000-000000000001','archived');
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"rafik_user"}',true);
do $$ begin
 begin perform public.start_session(gen_random_uuid(),'30000000-0000-4000-8000-000000000001','foundation-a','50000000-0000-4000-8000-000000000001');raise exception 'archived start accepted'; exception when raise_exception then if sqlerrm<>'assignment_unavailable' then raise; end if; end;
 perform pg_temp.assert((select count(*) from public.sessions)>0,'archive prevents new starts and preserves readable history');
end $$;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"rafik_user"}',true);
select public.set_client_state('40000000-0000-4000-8000-000000000001','active');
do $$ declare e public.exercises; p public.plans; v public.plan_versions; a public.assignments; day date; draft jsonb; schedule jsonb; begin
 e:=public.save_exercise('r1-test-timer','{"name":"Hold","name_ar":"ثبات","equipment":"Mat","equipment_ar":"حصيرة","instructions":"Hold steadily.","instructions_ar":"اثبت.","movement":"brace","kind":"timed","media_url":""}',0);
 perform pg_temp.assert((public.save_exercise(e.id,to_jsonb(e)-'id'-'owner_id'-'active'-'revision',0)).revision=1,'custom exercise create retries return the same record');
 draft:='{"schema":2,"cycleWeeks":2,"days":[{"id":"timed-a","name":"Mixed training","week":1,"weekday":0,"minutes":30,"exercises":[{"key":"hold","exerciseId":"r1-test-timer","kind":"timed","sets":2,"reps":1,"load":0,"unit":"kg","rest":30,"note":"","group":"A","targets":[{"reps":1,"load":0,"seconds":30,"effort":6},{"reps":1,"load":0,"seconds":45,"effort":7}]},{"key":"walk","exerciseId":"goblet-squat","kind":"distance","sets":1,"reps":1,"load":0,"unit":"kg","rest":0,"note":"","metres":500}]},{"id":"recovery","name":"Recovery","week":1,"weekday":1,"restDay":true,"exercises":[]},{"id":"week-two","name":"Second week","week":2,"weekday":0,"exercises":[{"key":"squat","exerciseId":"goblet-squat","sets":1,"reps":10,"load":5,"unit":"kg","rest":60,"note":""}]}]}';
 p:=public.save_plan('21000000-0000-4000-8000-000000000001','Mixed cycle',draft,null);
 v:=public.publish_plan(p.id,p.draft_version);
 perform pg_temp.assert(v.prescription#>>'{days,0,exercises,0,info,name}'='Hold','publication captures private exercise instructions');
 perform public.set_exercise_active(e.id,false);
 perform pg_temp.assert((select prescription#>>'{days,0,exercises,0,info,name}' from public.plan_versions where id=v.id)='Hold','retiring custom content does not change the published snapshot');
 select (now() at time zone timezone)::date into day from public.profiles where id='10000000-0000-4000-8000-000000000002';
 a:=public.assign_plan('40000000-0000-4000-8000-000000000001',v.id);
 a:=public.configure_assignment(a.id,v.id,day,day+27,'cycle',a.revision);
 schedule:=public.assignment_schedule(a.id,day,day+27);
 perform pg_temp.assert(jsonb_array_length(schedule)=6,'two-week cycle projects exactly two cycles including rest days');
 perform public.change_scheduled_day(a.id,'week-two',day+7,day+8,'moved');
 perform pg_temp.assert(exists(select 1 from jsonb_array_elements(public.assignment_schedule(a.id,day+7,day+8)) x where x->>'scheduled_date'=(day+7)::text and x->>'date'=(day+8)::text),'reschedule preserves the original occurrence date');
 perform public.change_scheduled_day(a.id,'week-two',day+7,day+8,'skipped');
 perform pg_temp.assert(exists(select 1 from jsonb_array_elements(public.assignment_schedule(a.id,day+7,day+8)) x where x->>'state'='skipped'),'skip is explicit and does not generate a completed session');
 perform public.set_exercise_active(e.id,true);
 begin perform public.save_plan(p.id,p.title,jsonb_set(draft,'{days,2,week}','1'),p.draft_version);raise exception 'duplicate slot accepted';exception when raise_exception then if sqlerrm<>'invalid_duplicate_day' then raise;end if;end;
 perform pg_temp.assert(true,'duplicate cycle slots are rejected');
 begin perform public.save_plan(p.id,p.title,jsonb_set(draft,'{days,0,exercises,0,targets,0,seconds}','0'),p.draft_version);raise exception 'zero target accepted';exception when raise_exception then if sqlerrm<>'invalid_target' then raise;end if;end;
 perform pg_temp.assert(true,'timed prescriptions require a positive duration');
end $$;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000004","role":"rafik_user"}',true);
select pg_temp.assert(not exists(select 1 from public.exercises where id='r1-test-timer'),'private catalog is isolated across coaches');
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"rafik_user"}',true);
do $$ declare a public.assignments; s jsonb; entries jsonb; result jsonb; op uuid:=gen_random_uuid(); begin
 select * into a from public.assignments where id='50000000-0000-4000-8000-000000000001';
 s:=public.start_session('61000000-0000-4000-8000-000000000001',a.version_id,'timed-a',a.id,a.start_date);
 perform pg_temp.assert(s#>>'{prescription,exercises,0,info,name}'='Hold','assigned clients receive private exercise snapshots');
 perform pg_temp.assert(exists(select 1 from jsonb_array_elements(s->'entries') x where x->>'seconds'='45'),'individual targets initialize distinct actual values');
 select jsonb_agg(value||jsonb_build_object('completed',true)) into entries from jsonb_array_elements(s->'entries');
 begin perform public.save_session((s->>'id')::uuid,1,op,jsonb_set(entries,'{0,seconds}','0'),'test',true);raise exception 'empty timed actual accepted';exception when raise_exception then if sqlerrm<>'invalid_entry' then raise;end if;end;
 perform pg_temp.assert(true,'timed completion requires positive seconds');
 result:=public.save_session((s->>'id')::uuid,1,op,entries,'Mixed done',true);
 perform pg_temp.assert(result=public.save_session((s->>'id')::uuid,1,op,entries,'Mixed done',true),'mixed-result completion replays exactly once');
 perform pg_temp.assert(jsonb_array_length(public.previous_performance(array['r1-test-timer','goblet-squat'],now()+interval '1 second'))=2,'previous performance finds each exercise independently');
 begin perform public.start_session(gen_random_uuid(),a.version_id,'week-two',a.id,a.start_date+7);raise exception 'wrong date accepted';exception when raise_exception then if sqlerrm<>'assignment_unavailable' then raise;end if;end;
 perform pg_temp.assert(true,'future or skipped occurrence cannot start today');
end $$;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"rafik_user"}',true);
do $$ declare a public.assignments; begin
 select * into a from public.assignments where id='50000000-0000-4000-8000-000000000001';
 begin perform public.change_scheduled_day(a.id,'timed-a',a.start_date,a.start_date+1,'moved');raise exception 'started move accepted';exception when raise_exception then if sqlerrm<>'session_started' then raise;end if;end;
 perform pg_temp.assert(true,'rescheduling cannot rewrite a started occurrence');
end $$;
-- The same published plan can serve another client without sharing their occurrence/history.
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"rafik_user"}',true);
select public.create_invitation('other@rafik.test',(select id from public.plan_versions where plan_id='21000000-0000-4000-8000-000000000001'),repeat('d',64),gen_random_uuid());
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"rafik_user"}',true);
select set_config('r1.other_assignment',public.accept_invitation(repeat('d',64))::text,true);
do $$ declare a public.assignments;s jsonb; begin
 select * into a from public.assignments where id=current_setting('r1.other_assignment')::uuid;
 s:=public.start_session(gen_random_uuid(),a.version_id,'timed-a',a.id);
 perform pg_temp.assert(s->>'client_id'='10000000-0000-4000-8000-000000000003' and s->>'status'='in_progress','a second client gets an independent session from the same plan');
 perform pg_temp.assert(not exists(select 1 from public.sessions where client_id='10000000-0000-4000-8000-000000000002'),'two assigned clients cannot read each other’s results');
end $$;
rollback;
