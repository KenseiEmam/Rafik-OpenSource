begin;
-- Isolate today’s synthetic fixture occurrences inside this rollback transaction.
-- Local preview activity is restored unchanged at the end of the suite.
delete from public.sessions where client_id='10000000-0000-4000-8000-000000000002' and local_date=(select (now() at time zone timezone)::date from public.profiles where id='10000000-0000-4000-8000-000000000002');
create function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
set local role rafik_guest;
select pg_temp.assert((select count(*) from public.plan_versions)=1,'public sample is readable without an account');
reset role;
set local role rafik_user;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"rafik_user"}',true);
do $$ declare s jsonb; again jsonb; entries jsonb; result jsonb; replay jsonb; completed timestamptz; begin
 s:=public.start_session('60000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','foundation-a','50000000-0000-4000-8000-000000000001');
 again:=public.start_session('60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','foundation-a','50000000-0000-4000-8000-000000000001');
 perform pg_temp.assert(s->>'id'=again->>'id','duplicate start returns one canonical occurrence');
 perform pg_temp.assert(jsonb_array_length(s->'entries')=12,'prescribed sets are created exactly once');
 select jsonb_agg(value||jsonb_build_object('completed',true)) into entries from jsonb_array_elements(s->'entries');
 result:=public.save_session((s->>'id')::uuid,1,'70000000-0000-4000-8000-000000000001',entries,'Felt good',true);
 replay:=public.save_session((s->>'id')::uuid,1,'70000000-0000-4000-8000-000000000001',entries,'Felt good',true);
 perform pg_temp.assert(result=replay and (replay->>'version')::int=2,'completion replay returns the original receipt without another transition');
 completed:=(result->>'completed_at')::timestamptz;
 result:=public.save_session((s->>'id')::uuid,2,'70000000-0000-4000-8000-000000000002',entries,'Corrected note',false);
 perform pg_temp.assert((result->>'completed_at')::timestamptz=completed and result->>'status'='completed','note correction preserves completion and history');
 begin
  perform public.save_session((s->>'id')::uuid,1,'70000000-0000-4000-8000-000000000003',entries,'Stale',false);
  raise exception 'stale write accepted';
 exception when raise_exception then if sqlerrm<>'conflict' then raise; end if; end;
 perform pg_temp.assert((public.session_document((s->>'id')::uuid)->>'note')='Corrected note','stale write rejects without losing the acknowledged result');
 begin
  perform public.save_session((s->>'id')::uuid,1,'70000000-0000-4000-8000-000000000001',entries,'Changed retry',true);
  raise exception 'changed replay accepted';
 exception when raise_exception then if sqlerrm<>'operation_reused' then raise; end if; end;
 perform pg_temp.assert(true,'same operation ID cannot be reused with a different payload');
end $$;
-- The other client cannot read or mutate a private workout.
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"rafik_user"}',true);
select pg_temp.assert((select count(*) from public.sessions)=0,'unrelated client cannot read another client history');
do $$ begin
 begin
  perform public.start_session(gen_random_uuid(),'30000000-0000-4000-8000-000000000001','foundation-a','50000000-0000-4000-8000-000000000001');
  raise exception 'wrong client started assignment';
 exception when raise_exception then if sqlerrm<>'assignment_unavailable' then raise; end if; end;
 perform pg_temp.assert(true,'wrong client cannot start a private assignment');
end $$;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"rafik_user"}',true);
do $$ declare p public.plans; v public.plan_versions; s jsonb; inv public.invitations; begin
 select * into p from public.plans where id='20000000-0000-4000-8000-000000000001';
 p:=public.save_plan(p.id,p.title,jsonb_set(p.draft,'{days,0,exercises,0,load}','12'),p.draft_version);
 perform pg_temp.assert((public.save_plan(p.id,p.title,p.draft,p.draft_version-1)).draft_version=p.draft_version,'retrying a plan save does not create another revision');
 v:=public.publish_plan(p.id,p.draft_version);
 perform public.assign_plan('40000000-0000-4000-8000-000000000001',v.id);
 s:=public.session_document('60000000-0000-4000-8000-000000000001');
 perform pg_temp.assert(s#>>'{prescription,exercises,0,load}'='8','publishing a future revision does not rewrite the started prescription');
 perform pg_temp.assert((select prescription#>>'{days,0,exercises,0,load}' from public.plan_versions where id='30000000-0000-4000-8000-000000000001')='8','old published version remains immutable');
 perform public.review_session('60000000-0000-4000-8000-000000000001','Keep the same load next time.');
 perform pg_temp.assert((public.session_document('60000000-0000-4000-8000-000000000001')->>'coach_note')='Keep the same load next time.','coach feedback belongs to a real result');
 inv:=public.create_invitation('other@rafik.test',v.id,repeat('a',48),'80000000-0000-4000-8000-000000000001');
 perform pg_temp.assert(public.get_invitation(repeat('a',48))->>'coach_name'='Laila Khoury','invitation preview exposes coach context without private assignment contents');
 perform pg_temp.assert(not(public.get_invitation(repeat('a',48)) ? 'intended_email'),'invitation preview does not disclose the client email');
end $$;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"rafik_user"}',true);
do $$ begin
 begin
  perform public.accept_invitation(repeat('a',48));raise exception 'wrong email accepted';
 exception when raise_exception then if sqlerrm<>'wrong_email' then raise; end if; end;
 perform pg_temp.assert(true,'private invitation rejects a different verified email');
end $$;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"rafik_user"}',true);
do $$ declare a uuid; b uuid; begin
 a:=public.accept_invitation(repeat('a',48));b:=public.accept_invitation(repeat('a',48));
 perform pg_temp.assert(a=b,'invitation acceptance is atomic and idempotent');
 perform pg_temp.assert((select count(*) from public.assignments where client_id=identity.actor_id() and state='active')=1,'accepted invitation creates exactly one active assignment');
end $$;
reset role;
select pg_temp.assert((select count(*) from pg_trigger where tgrelid in ('public.assignments'::regclass,'public.sessions'::regclass) and not tgisinternal and not (tgrelid='public.sessions'::regclass and tgname='notification_workout' and tgfoid='public.capture_domain_notification()'::regprocedure))=0,'assignment/session updates allow only the documented notification-intent capture trigger');
set local role rafik_user;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"rafik_user"}',true);
do $$ declare s jsonb; entries jsonb; v uuid; begin
 select version_id into v from public.assignments where id='50000000-0000-4000-8000-000000000001';
 perform public.update_profile('Amir Hassan','en','lb','Pacific/Kiritimati');
 s:=public.start_session('60000000-0000-4000-8000-000000000003',v,'foundation-b','50000000-0000-4000-8000-000000000001');
 perform pg_temp.assert(s->>'id'<>'60000000-0000-4000-8000-000000000001','different prescribed sessions can be performed on the same day');
 perform pg_temp.assert(s->>'local_date'=((now() at time zone 'Pacific/Kiritimati')::date)::text,'occurrence date follows the client timezone');
 perform pg_temp.assert(exists(select 1 from jsonb_array_elements(s->'entries') e where e->>'exercise_key'='shoulder' and e->>'unit'='lb' and (e->>'load')::numeric=8.82),'preferred units convert the value, not just its label');
 entries:=s->'entries';
 begin
  perform public.save_session((s->>'id')::uuid,null,gen_random_uuid(),entries,'bypass',false);raise exception 'null version accepted';
 exception when raise_exception then if sqlerrm<>'conflict' then raise; end if; end;
 perform pg_temp.assert(true,'an omitted expected version cannot bypass concurrency checks');
 begin
  perform public.save_session((s->>'id')::uuid,1,gen_random_uuid(),jsonb_set(entries,'{0,reps}','-1'),'bad',false);raise exception 'invalid entry accepted';
 exception when raise_exception then if sqlerrm<>'invalid_entry' then raise; end if; end;
 perform pg_temp.assert(public.session_document((s->>'id')::uuid)=s,'invalid saves roll back the entire change');
 begin
  update public.sessions set note='direct bypass' where id=(s->>'id')::uuid;raise exception 'direct mutation accepted';
 exception when insufficient_privilege then null; end;
 perform pg_temp.assert(true,'ordinary clients cannot bypass transactional commands');
end $$;
reset role;
set local role rafik_user;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"rafik_user"}',true);
select public.delete_my_account('DELETE');
reset role;
select pg_temp.assert(not exists(select 1 from identity.users where id='10000000-0000-4000-8000-000000000001'),'account deletion removes the auth identity');
select pg_temp.assert(exists(select 1 from public.sessions where client_id='10000000-0000-4000-8000-000000000002' and version_id is null and coach_id is null and prescription->>'id'='foundation-a'),'coach deletion preserves client-owned session snapshots');
rollback;
