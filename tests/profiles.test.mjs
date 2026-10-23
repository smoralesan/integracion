import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {handleApi} from '../worker/api.js';
import {MemoryBucket} from './support/memory-bucket.mjs';
import {decodeAvatar} from '../worker/profiles.js';
import {avatarHTML,avatarStack,uniqueParticipants,initials} from '../web/avatars.js';
import {publicSummary} from '../web/workflow-model.js';

// Actual 128px PNG fixture, including valid CRCs and scanlines.
function png(size=128){
  const crc=bytes=>{let value=0xffffffff;for(const byte of bytes){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}return(value^0xffffffff)>>>0;};
  const chunk=(type,data)=>{const body=Buffer.concat([Buffer.from(type),data]),header=Buffer.alloc(4),tail=Buffer.alloc(4);header.writeUInt32BE(data.length);tail.writeUInt32BE(crc(body));return Buffer.concat([header,body,tail]);};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.alloc((size*4+1)*size))),chunk('IEND',Buffer.alloc(0))]);
}
const image='data:image/png;base64,'+png().toString('base64');
function harness(){
  const bucket=new MemoryBucket(),env={BUCKET:bucket,II_TEAM_ROLES:JSON.stringify({'reviewer@example.test':'reviewer'})};
  const request=(path,body,{user='alice',method=body?'POST':'GET',origin='https://portal.test'}={})=>handleApi(new Request('https://portal.test/api/'+path,{method,headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test',origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);
  const profile=(user='alice',extra={})=>request('profile',{kind:'person',name:user,headline:'Consultoría',shareInProjects:true,revision:0,avatar:image,...extra},{user,method:'PUT'});
  const project=()=>request('records',{id:crypto.randomUUID(),kind:'proyecto',form:{title:'Proyecto ficticio',department_code:'05',municipality_code:'05001',relationship:'Promotor'},documentIds:[]});
  return {bucket,request,profile,project};
}
test('avatars accept only a bounded 128px PNG and reject remote URLs, SVG and wrong dimensions',()=>{
  assert.equal(decodeAvatar(image).length,png().length);
  for(const input of ['https://example.test/photo.png','data:image/svg+xml;base64,AAAA','data:image/png;base64,'+png(64).toString('base64'),'data:image/png;base64,AAAA',image.slice(0,-15)])assert.throws(()=>decodeAvatar(input));
});
test('profiles persist per account, keep stable IDs, isolate photos and reject stale edits',async()=>{
  const h=harness();assert.equal((await(await h.request('profile')).json()).profile,null);
  assert.equal((await h.profile('alice')).status,200);let p=(await(await h.request('profile')).json()).profile;
  assert.ok(p.avatarUrl);assert.equal(p.avatarKey,undefined);
  assert.equal((await h.request('profile/avatar')).status,200);
  assert.equal((await h.request('profile/avatar',null,{user:'bob'})).status,404);
  assert.equal((await(await h.request('profile',null,{user:'bob'})).json()).profile,null);
  assert.equal((await h.profile('alice',{name:'Stale'})).status,409);
  const id=p.id;
  assert.equal((await h.profile('alice',{revision:p.revision,kind:'company',name:'Empresa ficticia',avatar:null})).status,200);
  p=(await(await h.request('profile')).json()).profile;assert.equal(p.id,id);assert.equal(p.kind,'company');assert.equal(p.avatarUrl,null);
  assert.equal((await h.request('profile/avatar')).status,404);
  assert.equal((await h.request('profile',{kind:'person',name:'X',shareInProjects:false,revision:0},{user:'mallory',method:'PUT',origin:'https://evil.test'})).status,403);
});
test('project interactions deduplicate mixed profiles, protect avatars and keep participants out of publication',async()=>{
  const h=harness();await h.profile();await h.profile('reviewer',{kind:'company',name:'Empresa de revisión'});
  const r=await(await h.project()).json();assert.equal(r.participants.length,1);assert.equal(r.participants[0].profileKey,undefined);
  const avatarUrl=r.participants[0].avatarUrl;
  assert.equal((await h.request(avatarUrl.slice(5))).status,200);
  assert.equal((await h.request(avatarUrl.slice(5),null,{user:'bob'})).status,404);
  const rows=(await(await h.request('team/records',null,{user:'reviewer'})).json()).records,key=rows[0].teamKey;
  const update=body=>h.request('team/records/'+encodeURIComponent(key),body,{user:'reviewer',method:'PATCH'});
  let result=await(await update({revision:0,status:'in_review',internalNote:'Internal only'})).json();assert.equal(result.participants.length,1);
  result=await(await update({revision:1,status:'needs_information',message:'Aclara el área.'})).json();assert.equal(result.participants.length,2);assert.equal(result.participants[1].kind,'company');assert.equal(result.participants[1].profileKey,undefined);
  assert.equal((await h.request(result.participants[1].avatarUrl.slice(5),null,{user:'reviewer'})).status,200);
  assert.equal((await h.request(result.participants[1].avatarUrl.slice(5),null,{user:'bob'})).status,403);
  result=await(await h.request('records/'+r.id+'/reply',{revision:2,message:'Área aclarada',documentIds:[]})).json();assert.equal(result.participants.length,2);
  assert.equal(publicSummary(result).participants,undefined);
  assert.equal(JSON.stringify(result).includes('profileKey'),false);
  assert.equal(JSON.stringify(result).includes('Internal only'),false);
});
test('profile linking requires opt-in and never grants another account project access',async()=>{
  const h=harness();await h.profile('alice',{shareInProjects:false});const r=await(await h.project()).json();assert.equal(r.participants.length,0);
  assert.equal((await h.request('records/'+r.id+'/profile',{revision:0})).status,400);
  assert.equal((await h.request('records/'+r.id+'/profile',{revision:0},{user:'bob'})).status,404);
  await h.profile('alice',{revision:1,shareInProjects:true});
  const joined=await(await h.request('records/'+r.id+'/profile',{revision:0})).json();assert.equal(joined.participants.length,1);
  assert.equal((await h.request('records/'+r.id,null,{user:'bob'})).status,404);
});
test('simultaneous profile creation preserves one stable identity and cleans the rejected photo',async()=>{
  const h=harness();
  const responses=await Promise.all([h.profile('alice',{name:'First'}),h.profile('alice',{name:'Second'})]);
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  const stored=(await(await h.request('profile')).json()).profile;
  assert.equal(stored.revision,1);
  assert.equal([...h.bucket.objects.keys()].filter(k=>k.includes('/profile-images/')).length,1);
  assert.equal((await h.request('profile/avatar')).status,200);
});
test('technical profiles require a supported specialty and persist it',async()=>{
  const h=harness();
  assert.equal((await h.profile('alice',{category:'Técnicos',specialty:''})).status,400);
  assert.equal((await h.profile('alice',{category:'Técnicos',specialty:'Otro inventado'})).status,400);
  const response=await h.profile('alice',{category:'Técnicos',specialty:'Ingenieros eléctricos'});assert.equal(response.status,200);
  const p=(await response.json()).profile;assert.equal(p.category,'Técnicos');assert.equal(p.specialty,'Ingenieros eléctricos');
});
test('a project avatar follows the current photo even when the original interaction used initials',async()=>{
  const h=harness();await h.profile('alice',{avatar:null});
  const record=await(await h.project()).json(),url=record.participants[0].avatarUrl.slice(5);
  const fallback=await h.request(url);assert.equal(fallback.headers.get('content-type'),'image/svg+xml');
  await h.profile('alice',{revision:1,avatar:image});
  assert.equal((await h.request(url)).headers.get('content-type'),'image/png');
});
test('stack counts unique profiles and escapes names while excluding external images',()=>{
  const people=Array.from({length:7},(_,i)=>({id:String(i),name:i===0?'<script>':'Persona '+i,kind:i%2?'company':'person',avatarUrl:'https://example.test/tracker'}));
  const html=avatarStack([...people,people[0]]);
  assert.equal(uniqueParticipants([...people,people[0]]).length,7);assert.match(html,/>\+3</);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|example.test/);
  assert.match(avatarHTML(people[1],128),/--avatar-size:128px/);assert.equal(initials('  Ana  Ríos  '),'AR');
});

test('interventor and hydraulic design specialties persist as technical profiles',async()=>{
 const h=harness();
 for(const [revision,specialty] of ['Interventores','Diseñadores hidráulicos'].entries()){
  const response=await h.profile('alice',{revision,category:'Técnicos',specialty});assert.equal(response.status,200);assert.equal((await response.json()).profile.specialty,specialty);
 }
});
