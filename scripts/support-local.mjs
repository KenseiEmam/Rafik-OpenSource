// Explicit local operator action. No hosted credentials, outbound messaging or billing provider.
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
if (!readFileSync('supabase/config.toml','utf8').includes('project_id = "rafik-revamp-local"') || existsSync('supabase/.temp/project-ref')) throw Error('Local guard failed')
const [id, revision, file] = process.argv.slice(2)
if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id||'') || !/^\d+$/.test(revision||'') || !file) throw Error('Usage: npm run support:local -- <case UUID> <current revision> <reply text file>')
const reply=readFileSync(file,'utf8').trim()
if(!reply || reply.length>4000)throw Error('Reply must contain 1–4000 characters')
const status=JSON.parse(execFileSync('node_modules/.bin/supabase',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}))
const response=await fetch('http://127.0.0.1:55321/rest/v1/rpc/operator_support_reply',{method:'POST',headers:{apikey:status.SERVICE_ROLE_KEY,Authorization:`Bearer ${status.SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({p_id:id,p_revision:Number(revision),p_reply:reply})})
const result=await response.json()
if(!response.ok)throw Error(result.message||'Local reply failed')
console.log(`Local case ${result.id} resolved at revision ${result.revision}. No external message sent.`)
