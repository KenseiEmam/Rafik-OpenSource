"""Replay selected captured trigger definitions against synthetic local tables only.
Uses a disposable Docker PostgreSQL instance with network disabled, no host mounts,
no production credentials, and no Supabase connection. Not a full schema restore.
"""
from pathlib import Path
import json,subprocess
ROOT=Path(__file__).resolve().parents[1]
behavior=json.loads((ROOT/'evidence/live-backend/behavior.json').read_text())['rows'][0]['behavior']
functions={f['name']:f['definition'] for f in behavior['functions']}
setup="""
CREATE TABLE profiles(id bigint PRIMARY KEY,user_id bigint,coach bigint);
CREATE TABLE user_programs(id bigint PRIMARY KEY,client_id bigint,trainer_id bigint,program_id bigint,workouts json[],status text,latest_start timestamptz,months_package int,expires_on timestamptz,sets_muscle jsonb);
CREATE TABLE programs(id bigint PRIMARY KEY,trainer_id bigint,workouts json[]);
CREATE TABLE workout_sheets(id bigserial PRIMARY KEY,client_id bigint,user_program_id bigint,iteration int,done bool,week_of_program int DEFAULT 1,previous_id int,exercises json[],average_intensity numeric,average_volume numeric,created_at timestamptz DEFAULT now(),workout_summary text);
CREATE TABLE debug_logs(id bigserial PRIMARY KEY,message text);
CREATE TABLE notifications(id bigserial PRIMARY KEY,user_id bigint,title text,body text,created_at timestamptz);
CREATE TABLE weights(id bigserial PRIMARY KEY,profile_id bigint,created_at timestamptz DEFAULT now(),previous bigint);
CREATE TABLE entitlements(id bigint PRIMARY KEY,status text,start_date timestamp,end_date timestamp,client_email text);
INSERT INTO profiles VALUES (1,1,10),(2,2,10);
INSERT INTO user_programs(id,client_id,status,workouts) VALUES (1,1,'active',ARRAY['{"exercises":[]}'::json]);
"""
selected=['workout_new_iteration','delete_incomplete_workout_sheets','notify_program_update','apply_progression_on_workout_update','update previous weight','updateExpiry','Start and end dates Entitlement','fn_sync_sets_muscle','copy_workouts_to_user_programs']
triggers="""
CREATE TRIGGER "WorkoutSheetIteration" BEFORE INSERT ON workout_sheets FOR EACH ROW EXECUTE FUNCTION workout_new_iteration();
CREATE TRIGGER trigger_delete_incomplete_workouts AFTER UPDATE ON user_programs FOR EACH ROW EXECUTE FUNCTION delete_incomplete_workout_sheets();
CREATE TRIGGER trg_notify_program_update AFTER UPDATE ON user_programs FOR EACH ROW EXECUTE FUNCTION notify_program_update();
CREATE TRIGGER trg_apply_progression AFTER UPDATE ON workout_sheets FOR EACH ROW WHEN (new.done IS TRUE) EXECUTE FUNCTION apply_progression_on_workout_update();
CREATE TRIGGER "UpdatePreviousWeight" BEFORE INSERT ON weights FOR EACH ROW EXECUTE FUNCTION "update previous weight"();
CREATE TRIGGER "updateExpiryTrigger" BEFORE INSERT OR UPDATE ON user_programs FOR EACH ROW EXECUTE FUNCTION "updateExpiry"();
CREATE TRIGGER "StartEndDatesEntitlements" BEFORE UPDATE ON entitlements FOR EACH ROW EXECUTE FUNCTION "Start and end dates Entitlement"();
"""
cases="""
INSERT INTO workout_sheets(client_id,user_program_id,iteration,done,exercises) VALUES (1,1,0,false,ARRAY[]::json[]),(1,1,0,false,ARRAY[]::json[]);
DO $$BEGIN IF (SELECT count(*) FROM workout_sheets WHERE client_id=1)<>2 THEN RAISE EXCEPTION 'Expected duplicate insert reproduction'; END IF; END$$;
SELECT 'PASS A: duplicate guard returns NEW and admits both rows' AS result;
INSERT INTO workout_sheets(client_id,user_program_id,iteration,done,exercises) VALUES (2,1,0,false,ARRAY[]::json[]);
DO $$BEGIN IF (SELECT week_of_program FROM workout_sheets WHERE client_id=2)<>3 THEN RAISE EXCEPTION 'Expected cross-client week count'; END IF; END$$;
SELECT 'PASS B: another client first workout receives week 3 from global count' AS result;
UPDATE user_programs SET status=status WHERE id=1;
DO $$BEGIN IF (SELECT count(*) FROM workout_sheets)<>0 OR (SELECT count(*) FROM notifications)<>1 THEN RAISE EXCEPTION 'Expected deletion and notification on unrelated update'; END IF; END$$;
SELECT 'PASS C: no-op assignment status update deletes unfinished workouts and sends notification' AS result;
UPDATE user_programs SET workouts=ARRAY['{"exercises":[]}'::json] WHERE id=1;
TRUNCATE notifications;
INSERT INTO workout_sheets(client_id,user_program_id,iteration,done,exercises) VALUES (1,1,0,false,ARRAY['{"exercise_name":"Synthetic exercise","reps":10,"intensity":50,"true_sets":[{"reps_done":10,"weight_done":50}]}'::json]);
UPDATE workout_sheets SET done=true WHERE client_id=1;
UPDATE workout_sheets SET workout_summary='Synthetic note correction' WHERE client_id=1;
DO $$BEGIN IF (SELECT count(*) FROM notifications)<>2 THEN RAISE EXCEPTION 'Expected repeated progression/notification'; END IF; END$$;
SELECT 'PASS D: editing a completed session note replays progression and notifies again' AS result;
INSERT INTO weights(profile_id,created_at) VALUES(1,now()-interval '1 day'),(1,now());
DO $$BEGIN IF EXISTS(SELECT 1 FROM weights WHERE previous IS NOT NULL) THEN RAISE EXCEPTION 'Expected missing previous link'; END IF; END$$;
SELECT 'PASS E: BEFORE INSERT weight update cannot populate its not-yet-inserted row' AS result;
INSERT INTO user_programs(id,client_id,latest_start,months_package) VALUES(2,2,'2026-01-01Z',1);
UPDATE user_programs SET latest_start='2026-02-01Z' WHERE id=2;
DO $$BEGIN IF (SELECT expires_on FROM user_programs WHERE id=2)<>'2026-03-01Z'::timestamptz THEN RAISE EXCEPTION 'Expiry trigger did not work'; END IF; END$$;
SELECT 'PASS F: live expiry trigger advances expiry when latest_start changes (correction to repository-only uncertainty)' AS result;
INSERT INTO entitlements VALUES(1,'active','2000-01-01','2000-02-01','synthetic@example.invalid');
UPDATE entitlements SET client_email='changed@example.invalid' WHERE id=1;
DO $$BEGIN IF (SELECT start_date FROM entitlements WHERE id=1)<>CURRENT_DATE THEN RAISE EXCEPTION 'Expected entitlement date reset'; END IF; END$$;
SELECT 'PASS G: updating an already-active entitlement resets its access dates' AS result;
CREATE TRIGGER trg_user_program_sync_sets_muscle BEFORE INSERT OR UPDATE ON user_programs FOR EACH ROW EXECUTE FUNCTION fn_sync_sets_muscle();
CREATE TRIGGER trigger_copy_workouts BEFORE INSERT ON user_programs FOR EACH ROW EXECUTE FUNCTION copy_workouts_to_user_programs();
INSERT INTO programs VALUES(5,10,ARRAY['{"exercises":[]}'::json]);
DO $$DECLARE caught bool:=false; BEGIN BEGIN INSERT INTO user_programs(id,client_id,program_id) VALUES(3,1,5); EXCEPTION WHEN null_value_not_allowed THEN caught:=true; END; IF NOT caught THEN RAISE EXCEPTION 'Expected null-loop failure before plan copy'; END IF; END$$;
SELECT 'PASS H: derived-set trigger runs before plan-copy trigger and fails when workouts omitted' AS result;
"""
sql='\\set ON_ERROR_STOP on\n'+setup+'\n'.join(functions[n]+';' for n in selected)+triggers+cases
(ROOT/'evidence/live-backend/local-trigger-reproduction.sql').write_text('-- SYNTHETIC LOCAL TEST ONLY. Never execute against the linked Supabase project.\n'+sql)
script='''set -eu
TASK_PG_DIR=$(mktemp -d)
initdb -D "$TASK_PG_DIR/data" --auth=trust --no-locale >/dev/null
pg_ctl -D "$TASK_PG_DIR/data" -o "-c listen_addresses='' -k $TASK_PG_DIR" -w start >/dev/null
psql -X -q -h "$TASK_PG_DIR" -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SYNTHETIC_SQL'
'''+sql+'''\nSYNTHETIC_SQL
pg_ctl -D "$TASK_PG_DIR/data" -m fast -w stop >/dev/null
'''
p=subprocess.run(['docker','run','--rm','-i','--network','none','--user','postgres','--entrypoint','bash','public.ecr.aws/supabase/postgres:15.6.1.127'],input=script,capture_output=True,text=True,timeout=55)
result={'engine':'local isolated PostgreSQL 15 image; live database is PostgreSQL 15.8','network':'none','fixtures':'synthetic only; selected real functions; simplified tables and selected triggers','exit_code':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
(ROOT/'evidence/live-backend/local-trigger-reproductions.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
raise SystemExit(p.returncode)
