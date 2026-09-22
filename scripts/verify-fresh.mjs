// Verify migrations + synthetic fixtures in an isolated database, without resetting the preview.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
if (!readFileSync(resolve(root,'supabase/config.toml'),'utf8').includes('project_id = "rafik-revamp-local"') || existsSync(resolve(root,'supabase/.temp/project-ref'))) throw Error('Local project guard failed')
const container='supabase_db_rafik-revamp-local', database=`rafik_check_${Date.now()}`
const run=(args,input)=>execFileSync('docker',['exec','-i',container,...args],{input,encoding:'utf8',maxBuffer:20*1024*1024})
const sql=(db,input)=>run(['psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1'],input)
let created=false
try {
 sql('postgres',`create database ${database};`);created=true
 const auth=run(['pg_dump','-U','postgres','--schema-only','--no-owner','--no-acl','--schema=auth','--schema=extensions','postgres'])
 sql(database,auth+'\ngrant usage on schema auth to authenticated, anon;')
 const migrations=readdirSync(resolve(root,'supabase/migrations')).filter(f=>f.endsWith('.sql')).sort().map(f=>readFileSync(resolve(root,'supabase/migrations',f),'utf8')).join('\n')
 sql(database,migrations+'\n'+readFileSync(resolve(root,'supabase/seed.sql'),'utf8'))
 sql(database,['core.sql','daily_coaching.sql'].map(f=>readFileSync(resolve(root,'supabase/tests',f),'utf8')).join('\n'))
 console.log('Fresh migrations, synthetic fixtures and both database suites passed in an isolated database. Preview records unchanged.')
}finally{if(created)sql('postgres',`drop database ${database} with (force);`)}
