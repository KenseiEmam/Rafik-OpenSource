// Real local Auth/REST/Storage checks. Only temporary synthetic accounts are created/deleted.
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import assert from 'node:assert/strict'
if(!readFileSync('supabase/config.toml','utf8').includes('project_id = "rafik-revamp-local"')||existsSync('supabase/.temp/project-ref'))throw Error('Local guard failed')
const status=JSON.parse(execFileSync('node_modules/.bin/supabase',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}))
const url='http://127.0.0.1:55321',created=[],ids=[],resource=crypto.randomUUID(),rel1=crypto.randomUUID(),rel2=crypto.randomUUID()
let coach,resourcePath
async function call(path,token,method='GET',body,type='application/json'){
 const response=await fetch(url+path,{method,headers:{apikey:status.ANON_KEY,Authorization:`Bearer ${token}`,'Content-Type':type,'Cache-Control':'no-cache'},body:body===undefined?undefined:type==='application/json'?JSON.stringify(body):body})
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data=text}
 return {ok:response.ok,status:response.status,data}
}
const rpc=(actor,name,args)=>call('/rest/v1/rpc/'+name,actor.token,'POST',args)
function ok(result){assert.equal(result.ok,true,JSON.stringify(result.data));return result.data}
const sql=(text)=>execFileSync('docker',['exec','-i','supabase_db_rafik-revamp-local','psql','-U','postgres','-v','ON_ERROR_STOP=1'],{input:text,encoding:'utf8'})
try{
 for(let i=0;i<3;i++){
  const email=`r3-${crypto.randomUUID()}@rafik.test`,password=crypto.randomUUID()+'Local!'
  const account=ok(await call('/auth/v1/admin/users',status.SERVICE_ROLE_KEY,'POST',{email,password,email_confirm:true}));ids.push(account.id)
  const session=ok(await call('/auth/v1/token?grant_type=password',status.ANON_KEY,'POST',{email,password}))
  created.push({id:account.id,token:session.access_token})
  ok(await rpc(created.at(-1),'ensure_profile',{p_name:'Temporary service check'}))
 }
 coach=created[0];const [a,b]=created.slice(1)
 sql(`insert into public.coach_clients(id,coach_id,client_id) values('${rel1}','${coach.id}','${a.id}'),('${rel2}','${coach.id}','${b.id}');`)
 const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10)+'T11:00'
 const slots=ok(await rpc(coach,'publish_availability',{p_series:crypto.randomUUID(),p_local:tomorrow,p_zone:'UTC',p_minutes:30,p_count:2,p_every:7,p_title:'Temporary race check',p_location:'Local only'}))
 const attempts=await Promise.all([[a,rel1],[b,rel2]].map(([actor,rel])=>rpc(actor,'book_appointment',{p_id:crypto.randomUUID(),p_relationship:rel,p_slot:slots[0].id})))
 assert.equal(attempts.filter(r=>r.ok).length,1);assert.equal(attempts.find(r=>!r.ok).data.message,'time_unavailable')
 console.log('PASS: simultaneous bookings have exactly one winner')
 const winner=attempts[0].ok?a:b,appointment=attempts.find(r=>r.ok).data
 const crossRel=crypto.randomUUID(),otherActor=winner.id===a.id?b:a
 sql(`insert into public.coach_clients(id,coach_id,client_id) values('${crossRel}','${winner.id}','${otherActor.id}');`)
 const crossSlots=ok(await rpc(winner,'publish_availability',{p_series:crypto.randomUUID(),p_local:tomorrow,p_zone:'UTC',p_minutes:30,p_count:1,p_every:7,p_title:'Dual-role check',p_location:'Local only'}))
 const crossBooking=await rpc(otherActor,'book_appointment',{p_id:crypto.randomUUID(),p_relationship:crossRel,p_slot:crossSlots[0].id})
 assert.equal(crossBooking.data.message,'time_unavailable')
 console.log('PASS: a person cannot be double-booked across coach and client roles')
 const path=ok(await rpc(coach,'register_resource',{p_id:resource,p_title:'Temporary guide',p_filename:'guide.txt',p_type:'text/plain',p_bytes:12})).object_path;resourcePath=path
 assert.equal((await call('/storage/v1/object/rafik-private/'+coach.id+'/'+crypto.randomUUID(),coach.token,'POST','private text','text/plain')).ok,false)
 ok(await call('/storage/v1/object/rafik-private/'+path,coach.token,'POST','private text','text/plain'))
 ok(await rpc(coach,'finish_resource',{p_id:resource}))
 assert.equal((await call('/storage/v1/object/rafik-private/'+path,coach.token,'PUT','changed text','text/plain')).ok,false)
 assert.equal((await call('/storage/v1/object/authenticated/rafik-private/'+path,a.token)).ok,false)
 ok(await rpc(coach,'share_resource',{p_id:resource,p_relationship:rel1,p_shared:true}))
 assert.equal(ok(await call('/storage/v1/object/authenticated/rafik-private/'+path,a.token)),'private text')
 assert.equal((await call('/storage/v1/object/authenticated/rafik-private/'+path,b.token)).ok,false)
 ok(await rpc(coach,'share_resource',{p_id:resource,p_relationship:rel1,p_shared:false}))
 assert.equal((await call('/storage/v1/object/authenticated/rafik-private/'+path,a.token)).ok,false)
 console.log('PASS: private bytes require registered paths, resist overwrite, and follow share/revoke access')
 assert.equal((await rpc(coach,'delete_my_account',{p_confirmation:'DELETE'})).data.message,'file_cleanup_required')
 ok(await rpc(coach,'retire_resource',{p_id:resource,p_revision:2}))
 ok(await call('/storage/v1/object/rafik-private',coach.token,'DELETE',{prefixes:[path]}))
 ok(await rpc(coach,'remove_resource_record',{p_id:resource}));resourcePath=undefined
 assert.equal((await call('/storage/v1/object/authenticated/rafik-private/'+path,coach.token)).ok,false)
 console.log('PASS: file lifecycle deletes real bytes before metadata/account cleanup')
 // Delete only the temporary winning client; its coach must regain the future slot.
 ok(await rpc(winner,'delete_my_account',{p_confirmation:'DELETE'}))
 const reopened=ok(await call('/rest/v1/appointment_slots?id=eq.'+appointment.slot_id+'&select=state',coach.token))
 assert.equal(reopened[0].state,'open')
 // The coach account must be removable while the other temporary client still has a booking.
 const other=winner.id===a.id?b:a,otherRel=winner.id===a.id?rel2:rel1
 ok(await rpc(other,'book_appointment',{p_id:crypto.randomUUID(),p_relationship:otherRel,p_slot:slots[1].id}))
 ok(await rpc(coach,'delete_my_account',{p_confirmation:'DELETE'}))
 console.log('PASS: client deletion reopens future slots; coach deletion handles appointment foreign keys')
}finally{
 // Cleanup is deliberately scoped to IDs generated in this process, never preview sample accounts.
 if(resourcePath&&coach){await rpc(coach,'retire_resource',{p_id:resource,p_revision:2});await call('/storage/v1/object/rafik-private',status.SERVICE_ROLE_KEY,'DELETE',{prefixes:[resourcePath]})}
 for(const id of ids)await call('/auth/v1/admin/users/'+id,status.SERVICE_ROLE_KEY,'DELETE')
}
