// Real local-only Auth, REST and Storage boundaries for R4. Synthetic records are cleaned up.
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
if(!readFileSync('supabase/config.toml','utf8').includes('project_id = "rafik-revamp-local"')||existsSync('supabase/.temp/project-ref'))throw Error('Local guard failed')
const status=JSON.parse(execFileSync('node_modules/.bin/supabase',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}))
const url='http://127.0.0.1:55321', users=[], team=crypto.randomUUID(), resource=crypto.randomUUID()
async function call(path,token,method='GET',body,type='application/json'){
 const response=await fetch(url+path,{method,headers:{apikey:status.ANON_KEY,Authorization:`Bearer ${token}`,'Content-Type':type},body:body===undefined?undefined:type==='application/json'?JSON.stringify(body):body})
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data=text}
 return {ok:response.ok,status:response.status,data}
}
const rpc=(actor,name,args)=>call('/rest/v1/rpc/'+name,actor.token,'POST',args)
const ok=(r)=>{assert.equal(r.ok,true,JSON.stringify(r.data));return r.data}
const sql=(text)=>execFileSync('docker',['exec','-i','supabase_db_rafik-revamp-local','psql','-U','postgres','-v','ON_ERROR_STOP=1'],{input:text,encoding:'utf8'})
let resourcePath,secondPath
const secondResource=crypto.randomUUID(),deleted=new Set()
try{
 for(let i=0;i<4;i++){
  const email=`r4-http-${crypto.randomUUID()}@rafik.test`,password=crypto.randomUUID()+'Local!'
  const account=ok(await call('/auth/v1/admin/users',status.SERVICE_ROLE_KEY,'POST',{email,password,email_confirm:true}))
  users.push({id:account.id,email})
  const session=ok(await call('/auth/v1/token?grant_type=password',status.ANON_KEY,'POST',{email,password}));users.at(-1).token=session.access_token
  ok(await rpc(users.at(-1),'ensure_profile',{p_name:'Temporary R4 verification'}))
 }
 const [owner,coach,client,outsider]=users
 ok(await rpc(owner,'create_team',{p_id:team,p_name:'Temporary service team'}))
 const invitation={p_id:crypto.randomUUID(),p_team:team,p_email:coach.email,p_role:'coach',p_token:crypto.randomUUID()+crypto.randomUUID()}
 ok(await rpc(owner,'invite_team_member',invitation))
 assert.equal((await rpc(outsider,'accept_team_invitation',{p_token:invitation.p_token})).data.message,'wrong_email')
 ok(await rpc(coach,'accept_team_invitation',{p_token:invitation.p_token}))
 console.log('PASS: real verified Auth identities enforce intended staff invitation email')
 const plan=crypto.randomUUID(),draft=JSON.parse(readFileSync('content/starter.json','utf8')).prescription
 ok(await rpc(owner,'save_plan',{p_id:plan,p_title:'Handoff verification',p_draft:draft}))
 const version=ok(await rpc(owner,'publish_plan',{p_id:plan,p_expected_version:1})),token=crypto.randomUUID()+crypto.randomUUID()
 ok(await rpc(owner,'create_invitation',{p_email:client.email,p_version_id:version.id,p_token:token,p_request_id:crypto.randomUUID()}))
 const relation=ok(await rpc(client,'accept_invitation',{p_token:token}))
 // accept_invitation returns assignment id; read its verified relationship.
 const assignment=ok(await call('/rest/v1/assignments?id=eq.'+relation,client.token))[0]
 const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10)
 const slots=ok(await rpc(owner,'publish_availability',{p_series:crypto.randomUUID(),p_local:tomorrow+'T11:00',p_zone:'UTC',p_minutes:30,p_count:1,p_every:7,p_title:'Before handoff',p_location:'Local only'}))
 const booking=ok(await rpc(client,'book_appointment',{p_id:crypto.randomUUID(),p_relationship:assignment.relationship_id,p_slot:slots[0].id}))
 const form=crypto.randomUUID()
 ok(await rpc(owner,'save_coaching_form',{p_id:form,p_title:'Before handoff check-in',p_kind:'checkin',p_fields:[{id:'note',label:'How was training?',type:'text',required:false}],p_revision:0}))
 const requests=ok(await rpc(owner,'assign_coaching_form',{p_series:crypto.randomUUID(),p_relationship:assignment.relationship_id,p_form:form,p_revision:1,p_due:tomorrow,p_count:1,p_interval:7}))
 const enrollment=crypto.randomUUID()
 ok(await rpc(owner,'propose_team_client',{p_id:enrollment,p_team:team,p_relationship:assignment.relationship_id}))
 ok(await rpc(client,'respond_team_client',{p_id:enrollment,p_revision:1,p_accept:true}))
 const session=ok(await rpc(client,'start_session',{p_id:crypto.randomUUID(),p_version_id:version.id,p_day_id:'foundation-a',p_assignment_id:assignment.id}))
 ok(await rpc(owner,'request_team_handoff',{p_id:enrollment,p_revision:2,p_coach:coach.id}))
 const replies=await Promise.all([1,2].map(()=>rpc(client,'respond_team_client',{p_id:enrollment,p_revision:3,p_accept:true})))
 replies.forEach(ok);assert.equal(replies[0].data.relationship_id,replies[1].data.relationship_id)
 assert.equal(ok(await call('/rest/v1/sessions?id=eq.'+session.id,client.token)).length,1)
 assert.equal(ok(await call('/rest/v1/sessions?id=eq.'+session.id,coach.token)).length,0)
 assert.equal(ok(await rpc(client,'start_session',{p_id:session.id,p_version_id:version.id,p_day_id:'foundation-a',p_assignment_id:assignment.id})).id,session.id)
 console.log('PASS: simultaneous handoff retries preserve one new relationship and private started history')
 assert.equal(ok(await call('/rest/v1/appointments?id=eq.'+booking.id,client.token))[0].state,'cancelled')
 assert.equal(ok(await call('/rest/v1/appointment_slots?id=eq.'+slots[0].id,owner.token))[0].state,'open')
 assert.equal(ok(await call('/rest/v1/coaching_requests?id=eq.'+requests[0].id,client.token))[0].cancelled,true)
 console.log('PASS: handoff releases future booked time and cancels unanswered old-coach requests')
 resourcePath=ok(await rpc(owner,'register_resource',{p_id:resource,p_title:'Team guide',p_filename:'team.txt',p_type:'text/plain',p_bytes:12})).object_path
 ok(await call('/storage/v1/object/rafik-private/'+resourcePath,owner.token,'POST','private text','text/plain'))
 ok(await rpc(owner,'finish_resource',{p_id:resource}))
 ok(await rpc(owner,'share_team_resource',{p_team:team,p_resource:resource,p_shared:true}))
 assert.equal((await call('/storage/v1/object/authenticated/rafik-private/'+resourcePath,coach.token)).data,'private text')
 assert.equal((await call('/storage/v1/object/authenticated/rafik-private/'+resourcePath,client.token)).ok,false)
 assert.equal((await call('/storage/v1/object/authenticated/rafik-private/'+resourcePath,outsider.token)).ok,false)
 console.log('PASS: team Storage grant reaches staff only, not enrolled clients or outsiders')
 secondPath=ok(await rpc(coach,'register_resource',{p_id:secondResource,p_title:'Departing coach guide',p_filename:'coach.txt',p_type:'text/plain',p_bytes:12})).object_path
 ok(await call('/storage/v1/object/rafik-private/'+secondPath,coach.token,'POST','private text','text/plain'))
 ok(await rpc(coach,'finish_resource',{p_id:secondResource}))
 ok(await rpc(coach,'share_team_resource',{p_team:team,p_resource:secondResource,p_shared:true}))
 const payload={state:'active',access_until:new Date(Date.now()+86400000).toISOString(),staff_limit:3,client_limit:4}
 const event={p_id:crypto.randomUUID(),p_account:team,p_sequence:4,p_payload:payload}
 assert.equal((await rpc(coach,'simulate_business_event',event)).data.message,'forbidden')
 // PostgREST hides the ungranted function from regular callers.
 assert.equal((await rpc(owner,'apply_business_event',event)).ok,false)
 const operator={token:status.SERVICE_ROLE_KEY}
 ok(await rpc(operator,'apply_business_event',event));ok(await rpc(operator,'apply_business_event',event))
 const stale=ok(await rpc(operator,'apply_business_event',{...event,p_id:crypto.randomUUID(),p_sequence:2,p_payload:{...payload,state:'cancelled'}}))
 assert.equal(stale.state,'active');assert.equal(stale.provider_sequence,4)
 console.log('PASS: service-only provider receipts survive duplicates and out-of-order delivery')
 const support=crypto.randomUUID()
 ok(await rpc(client,'create_support_case',{p_id:support,p_subject:'Local support check',p_detail:'Please review this example',p_team:null}))
 assert.equal(ok(await call('/rest/v1/support_cases?id=eq.'+support,owner.token)).length,0)
 const replyDir=mkdtempSync(join(tmpdir(),'rafik-r4-reply-'))
 try {
  const file=join(replyDir,'reply.txt');writeFileSync(file,'Local operator response')
  const output=execFileSync(process.execPath,['scripts/support-local.mjs',support,'1',file],{encoding:'utf8'})
  assert.match(output,/resolved at revision 2/)
 }finally{rmSync(replyDir,{recursive:true,force:true})}
 assert.equal(ok(await call('/rest/v1/support_cases?id=eq.'+support,client.token))[0].state,'resolved')
 console.log('PASS: private platform case and operator response use explicit access boundaries')
 ok(await rpc(client,'close_team_client',{p_id:enrollment,p_revision:4}))
 ok(await rpc(coach,'change_team_member',{p_team:team,p_user:coach.id,p_action:'remove'}))
 assert.equal((await call('/storage/v1/object/authenticated/rafik-private/'+resourcePath,coach.token)).ok,false)
 ok(await rpc(owner,'share_team_resource',{p_team:team,p_resource:resource,p_shared:false}))
 console.log('PASS: member removal immediately revokes future authenticated file downloads')
 assert.equal(ok(await rpc(coach,'my_resource_teams',{}))[0].team_id,team)
 ok(await rpc(coach,'share_team_resource',{p_team:team,p_resource:secondResource,p_shared:false}))
 assert.equal((await call('/storage/v1/object/authenticated/rafik-private/'+secondPath,owner.token)).ok,false)
 console.log('PASS: departed contributor can still inspect and revoke their owned file grant')
 assert.equal((await rpc(owner,'delete_my_account',{p_confirmation:'DELETE'})).data.message,'transfer_owner_first')
 ok(await rpc(owner,'close_team',{p_id:team,p_revision:1}))
 ok(await rpc(owner,'retire_resource',{p_id:resource,p_revision:2}))
 ok(await call('/storage/v1/object/rafik-private',owner.token,'DELETE',{prefixes:[resourcePath]}));resourcePath=null
 ok(await rpc(owner,'remove_resource_record',{p_id:resource}))
 ok(await rpc(owner,'delete_my_account',{p_confirmation:'DELETE'}));deleted.add(owner.id)
 assert.equal(ok(await call('/rest/v1/sessions?id=eq.'+session.id,client.token)).length,1)
 console.log('PASS: owner deletion is guarded, then closed-team cleanup preserves client training history')
}catch(error){throw error}finally{
 if(secondPath) await call('/storage/v1/object/rafik-private',status.SERVICE_ROLE_KEY,'DELETE',{prefixes:[secondPath]})
 if(resourcePath) await call('/storage/v1/object/rafik-private',status.SERVICE_ROLE_KEY,'DELETE',{prefixes:[resourcePath]})
 // IDs are random UUIDs created solely by this script; no existing preview data is selected.
 sql(`delete from public.teams where id='${team}';`)
 for(const actor of users.reverse()) {
  if(deleted.has(actor.id))continue
  const result=await call('/auth/v1/admin/users/'+actor.id,status.SERVICE_ROLE_KEY,'DELETE')
  assert.equal(result.ok,true,'Temporary account cleanup failed')
 }
 console.log('Temporary R4 accounts and file bytes removed.')
}
