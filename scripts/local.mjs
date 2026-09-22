import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const config = readFileSync(resolve(root,'supabase/config.toml'),'utf8')
if (!config.includes('project_id = "rafik-revamp-local"') || existsSync(resolve(root,'supabase/.temp/project-ref'))) {
  throw new Error('Local guard: the revamp must have its own identity and no linked remote project.')
}
const cli = existsSync(resolve(root,'node_modules/.bin/supabase')) ? resolve(root,'node_modules/.bin/supabase') : 'supabase'
const command=process.argv[2]
const run=(args)=> { const r=spawnSync(cli,args,{cwd:root,stdio:'inherit'}); if(r.status!==0)process.exit(r.status||1) }
if(command==='start')run(['start','-x','realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor'])
else if(command==='stop')run(['stop'])
else if(command==='reset')run(['db','reset','--local'])
else if(command==='test') {
  const r=spawnSync('docker',['exec','-i','supabase_db_rafik-revamp-local','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{cwd:root,input:['core.sql','daily_coaching.sql','ongoing_coaching.sql'].map(name=>readFileSync(resolve(root,'supabase/tests',name),'utf8')).join('\n'),encoding:'utf8'})
  process.stdout.write(r.stdout||''); process.stderr.write(r.stderr||'');process.exit(r.status??1)
} else if(command==='types') {
  const types=execFileSync(cli,['gen','types','typescript','--local','--schema','public'],{cwd:root,encoding:'utf8'})
  writeFileSync(resolve(root,'../RAFIK-FRONTEND/src/lib/database.types.ts'),types)
  console.log('Generated web database types from the local schema.')
} else if(command==='web-env') {
  const status=JSON.parse(execFileSync(cli,['status','-o','json'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}))
  const key=status.ANON_KEY
  if(!key)throw new Error('Local publishable key unavailable')
  writeFileSync(resolve(root,'../RAFIK-FRONTEND/.env.local'),`VITE_SUPABASE_URL=http://127.0.0.1:55321\nVITE_SUPABASE_ANON_KEY=${key}\nVITE_LOCAL_PREVIEW=true\n`)
  console.log('Wrote local-only web configuration. No remote credentials used.')
} else throw new Error('Use start, stop, reset, test, types or web-env. Remote operations are not exposed here.')
