// Real local Prisma API, PostgreSQL and private file checks. Only temporary synthetic accounts are created/deleted.
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import assert from 'node:assert/strict'
import {createActor,deleteActor,call,rpc,sql,operator,cleanupFile} from './prisma/fixture.mjs'
const created=[],ids=[],resource=crypto.randomUUID(),rel1=crypto.randomUUID(),rel2=crypto.randomUUID()
let coach,resourcePath
const ok=(r)=>{assert.equal(r.ok,true,JSON.stringify(r.data));return r.data}
try{
 for(let i=0;i<3;i++){
  const actor=createActor('r3');ids.push(actor.id);created.push(actor)
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
 assert.equal((await call('/v1/files/'+coach.id+'/'+crypto.randomUUID(),coach.token,'PUT','private text','text/plain')).ok,false)
 ok(await call('/v1/files/'+path,coach.token,'PUT','private text','text/plain'))
 ok(await rpc(coach,'finish_resource',{p_id:resource}))
 assert.equal((await call('/v1/files/'+path,coach.token,'PUT','changed text','text/plain')).ok,false)
 assert.equal((await call('/v1/files/'+path,a.token)).ok,false)
 ok(await rpc(coach,'share_resource',{p_id:resource,p_relationship:rel1,p_shared:true}))
 assert.equal(ok(await call('/v1/files/'+path,a.token)),'private text')
 assert.equal((await call('/v1/files/'+path,b.token)).ok,false)
 ok(await rpc(coach,'share_resource',{p_id:resource,p_relationship:rel1,p_shared:false}))
 assert.equal((await call('/v1/files/'+path,a.token)).ok,false)
 console.log('PASS: private bytes require registered paths, resist overwrite, and follow share/revoke access')
 assert.equal((await rpc(coach,'delete_my_account',{p_confirmation:'DELETE'})).data.message,'file_cleanup_required')
 ok(await rpc(coach,'retire_resource',{p_id:resource,p_revision:2}))
 ok(await call('/v1/files/'+path,coach.token,'DELETE'))
 ok(await rpc(coach,'remove_resource_record',{p_id:resource}));resourcePath=undefined
 assert.equal((await call('/v1/files/'+path,coach.token)).ok,false)
 console.log('PASS: file lifecycle deletes real bytes before metadata/account cleanup')
 // Delete only the temporary winning client; its coach must regain the future slot.
 ok(await rpc(winner,'delete_my_account',{p_confirmation:'DELETE'}))
 const reopened=ok(await call('/v1/queries/appointment_slots?column=id&value='+appointment.slot_id,coach.token))
 assert.equal(reopened[0].state,'open')
 // The coach account must be removable while the other temporary client still has a booking.
 const other=winner.id===a.id?b:a,otherRel=winner.id===a.id?rel2:rel1
 ok(await rpc(other,'book_appointment',{p_id:crypto.randomUUID(),p_relationship:otherRel,p_slot:slots[1].id}))
 ok(await rpc(coach,'delete_my_account',{p_confirmation:'DELETE'}))
 console.log('PASS: client deletion reopens future slots; coach deletion handles appointment foreign keys')
}finally{
 // Cleanup is deliberately scoped to IDs generated in this process, never preview sample accounts.
 if(resourcePath&&coach){await rpc(coach,'retire_resource',{p_id:resource,p_revision:2});cleanupFile(resourcePath)}
 for(const id of ids)deleteActor(id)
}
