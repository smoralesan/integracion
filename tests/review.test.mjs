import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi} from '../worker/api.js';
import {MemoryBucket} from './support/memory-bucket.mjs';
const geometry={type:'Polygon',coordinates:[[[-75.5,10.4],[-75.49,10.4],[-75.49,10.41],[-75.5,10.41],[-75.5,10.4]]]};
function harness(){
  const bucket=new MemoryBucket(),env={BUCKET:bucket,II_TEAM_ROLES:JSON.stringify({'admin@example.test':'admin','reviewer@example.test':'reviewer'})};
  const request=async(path,body,{user='alice',method=body?'POST':'GET',origin='https://portal.test',email=user+'@example.test'}={})=>{
    const headers=new Headers({'oai-authenticated-user-id':user,'oai-authenticated-user-email':email,origin});
    let payload=body;if(body&&!(body instanceof FormData)){headers.set('content-type','application/json');payload=JSON.stringify(body);}
    return handleApi(new Request('https://portal.test/api/'+path,{method,headers,...(payload?{body:payload}:{})}),env);
  };
  const create=async(user='alice',visibility)=>{const response=await request('records',{id:crypto.randomUUID(),kind:'terreno',form:{...(visibility===undefined?{}:{visibility}),title:'Lote ficticio',city:'Cartagena',region:'Bolívar',neighborhood:'Manzanillo del Mar',relationship:'owner',project_land_confirmed:true,description:'INFORMACIÓN RESERVADA',amount:'2000000000.50',area:'5200'},parcel:{geometry,confirmed:true},documentIds:[]},{user});assert.equal(response.status,201);return response.json();};
  const find=async id=>(await(await request('team/records',null,{user:'admin'})).json()).records.find(r=>r.id===id).teamKey;
  const update=async(key,body,user='admin')=>request('team/records/'+encodeURIComponent(key),body,{user,method:'PATCH'});
  return {bucket,request,create,find,update};
}
test('team roles come only from server configuration; owners cannot enter the team queue',async()=>{
  const h=harness();await h.create();assert.equal((await h.request('team/records')).status,403);
  assert.equal((await h.request('team/records',{role:'admin'},{method:'PATCH'})).status,403);
  assert.equal((await(await h.request('session',null,{user:'admin',email:'ADMIN@EXAMPLE.TEST'})).json()).teamRole,'admin');
  assert.equal((await(await h.request('session')).json()).teamRole,null);
  assert.equal((await h.request('team/records',{}, {user:'admin',method:'PATCH',origin:'https://another.test'})).status,403);
});
test('team queue reads different owners while ordinary users remain isolated',async()=>{
  const h=harness(),a=await h.create(),b=await h.create('bob');const queue=await(await h.request('team/records',null,{user:'reviewer'})).json();assert.equal(queue.records.length,2);
  assert.equal((await(await h.request('records')).json()).records.length,1);
  const key=await h.find(b.id);assert.equal((await h.request('team/records/'+key)).status,403);assert.equal((await h.request('records/'+b.id)).status,404);
  assert.equal((await h.request('team/records/'+key,null,{user:'reviewer'})).status,200);assert.notEqual(a.id,b.id);
});
test('reviewers request information, owners respond, and internal notes stay private',async()=>{
  const h=harness(),record=await h.create(),key=await h.find(record.id);
  let response=await h.update(key,{revision:0,status:'in_review',assignee:'Ana',internalNote:'NOTA SOLO EQUIPO'},'reviewer');assert.equal(response.status,200);let r=await response.json();
  assert.equal((await h.update(key,{revision:r.revision,status:'needs_information'},'reviewer')).status,400);
  r=await(await h.update(key,{revision:r.revision,status:'needs_information',assignee:'Ana',message:'Aporta el levantamiento y aclara el área.'},'reviewer')).json();
  const owner=await(await h.request('records/'+record.id)).json();assert.equal(owner.internalNotes,undefined);assert.equal(owner.owner,undefined);assert.equal(owner.history.some(x=>x.actor),false);assert.equal(JSON.stringify(owner).includes('NOTA SOLO EQUIPO'),false);assert.equal(owner.assignee,'Ana');
  const reply=await h.request('records/'+record.id+'/reply',{revision:r.revision,message:'Área aclarada para continuar.',documentIds:[]});assert.equal(reply.status,200);r=await reply.json();assert.equal(r.status,'in_review');assert.equal(r.history.at(-1).type,'reply');
  assert.equal((await h.request('records/'+record.id+'/reply',{revision:r.revision,message:'Duplicado'})).status,409);
  assert.equal((await h.update(key,{revision:r.revision,status:'approved'},'reviewer')).status,403);
  assert.equal((await h.update(key,{revision:r.revision,status:'approved'})).status,200);
});
test('stale versions and concurrent changes cannot overwrite review history',async()=>{
  const h=harness(),record=await h.create(),key=await h.find(record.id);
  const results=await Promise.all([h.update(key,{revision:0,status:'in_review',message:'Primero'}),h.update(key,{revision:0,status:'in_review',message:'Segundo'})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  const r=await(await h.request('team/records/'+key,null,{user:'admin'})).json();assert.equal(r.revision,1);assert.equal(r.history.length,2);
  assert.equal((await h.update(key,{revision:0,status:'needs_information',message:'Versión antigua'})).status,409);
});
test('publication requires review plus owner consent and returns only the approved public fields',async()=>{
  const h=harness(),record=await h.create(),key=await h.find(record.id);
  assert.equal((await h.update(key,{revision:0,status:'published'})).status,403);
  let r=await(await h.update(key,{revision:0,status:'in_review'})).json();r=await(await h.update(key,{revision:r.revision,status:'approved'})).json();
  assert.equal((await h.update(key,{revision:r.revision,status:'published'})).status,400);
  assert.equal((await h.request('records/'+record.id+'/publication-consent',{revision:r.revision,authorized:true},{user:'bob'})).status,404);
  r=await(await h.request('records/'+record.id+'/publication-consent',{revision:r.revision,authorized:true})).json();
  r=await(await h.update(key,{revision:r.revision,status:'published'})).json();assert.equal(r.status,'published');
  const publication=await(await h.request('catalog/'+r.publicationId,null,{user:'bob'})).json();assert.equal(publication.amount,'2000000000.50');
  for(const field of ['form','owner','files','parcel','description','internalNotes','history','teamKey'])assert.equal(publication[field],undefined);
  assert.equal(JSON.stringify(publication).includes('INFORMACIÓN RESERVADA'),false);assert.equal((await(await h.request('catalog')).json()).records.length,1);
  const revoked=await h.request('records/'+record.id+'/publication-consent',{revision:r.revision,authorized:false});assert.equal(revoked.status,200);assert.equal((await revoked.json()).status,'approved');
  assert.equal((await h.request('catalog/'+r.publicationId)).status,404);assert.equal((await(await h.request('catalog')).json()).records.length,0);
  assert.equal((await h.update(key,{revision:r.revision,status:'published'})).status,400);
});
test('team document access is limited to attached documents and honors the original expiry',async()=>{
  const h=harness(),record=await h.create(),key=await h.find(record.id);
  const make=()=>{const form=new FormData();form.set('file',new File(['%PDF-1.4\nprivado'],'prueba.pdf'));return form;};
  const doc=await(await h.request('documents',make())).json();
  assert.equal((await h.request('team/records/'+key+'/documents/'+doc.id,null,{user:'admin'})).status,404);
  const received=await(await h.update(key,{revision:0,status:'in_review'})).json();const pending=await(await h.update(key,{revision:received.revision,status:'needs_information',message:'Envía el plano.'})).json();
  await h.request('records/'+record.id+'/reply',{revision:pending.revision,message:'Adjunto el plano.',documentIds:[doc.id]});
  const download=await h.request('team/records/'+key+'/documents/'+doc.id+'/download',null,{user:'reviewer'});assert.equal(download.status,200);assert.match(await download.text(),/privado/);
  assert.equal((await h.request('team/records/'+key+'/documents/'+doc.id,null,{user:'bob'})).status,403);
  const metaKey=[...h.bucket.objects.keys()].find(k=>k.includes(doc.id)&&k.endsWith('meta.json')),meta=await(await h.bucket.get(metaKey)).json();meta.expiresAt=new Date(0).toISOString();await h.bucket.put(metaKey,JSON.stringify(meta));
  assert.equal((await h.request('team/records/'+key+'/documents/'+doc.id+'/download',null,{user:'admin'})).status,410);
});
test('older pending_review records remain readable and enter the workflow without migrating user data',async()=>{
  const h=harness(),r=await h.create(),key=await h.find(r.id),objectKey=[...h.bucket.objects.keys()].find(k=>k.endsWith(r.id+'.json'));const legacy=await(await h.bucket.get(objectKey)).json();
  delete legacy.revision;delete legacy.publicationId;delete legacy.history;delete legacy.internalNotes;legacy.status='pending_review';await h.bucket.put(objectKey,JSON.stringify(legacy));
  const own=await(await h.request('records/'+r.id)).json();assert.equal(own.status,'received');assert.equal(own.revision,0);
  assert.equal((await h.update(key,{revision:0,status:'in_review'})).status,200);
});

test('Neighborhood publication requires a new authorization that includes the displayed location',async()=>{
 const h=harness(),created=await h.create(),key=await h.find(created.id);
 let r=await(await h.update(key,{revision:0,status:'in_review'})).json();
 r=await(await h.update(key,{revision:r.revision,status:'approved'})).json();
 r=await(await h.request('records/'+r.id+'/publication-consent',{revision:r.revision,authorized:true})).json();
 r=await(await h.update(key,{revision:r.revision,status:'published'})).json();
 let published=await(await h.request('catalog/'+r.publicationId)).json();
 assert.equal(published.neighborhood,undefined,'An old authorization must not expose the private neighborhood');
 r=await(await h.request('records/'+r.id+'/publication-consent',{revision:r.revision,authorized:false})).json();
 r=await(await h.request('records/'+r.id+'/publication-consent',{revision:r.revision,authorized:true,includeNeighborhood:true})).json();
 r=await(await h.update(key,{revision:r.revision,status:'published'})).json();
 published=await(await h.request('catalog/'+r.publicationId)).json();
 assert.equal(published.neighborhood,'Manzanillo del Mar');
 assert.equal(published.description,undefined);
 assert.equal(published.form,undefined);
});

test('Off-market se conserva privado y bloquea ambas autorizaciones y la publicación administrativa',async()=>{
 const h=harness(),r=await h.create('alice','off-market'),key=await h.find(r.id);
 assert.equal(r.form.visibility,'off-market');
 const queue=await(await h.request('team/records',null,{user:'admin'})).json();assert.equal(queue.records[0].visibility,'off-market');
 let current=await(await h.update(key,{revision:r.revision,status:'in_review'})).json();current=await(await h.update(key,{revision:current.revision,status:'approved'})).json();
 assert.equal((await h.request('records/'+r.id+'/publication-consent',{revision:current.revision,authorized:true})).status,400);
 assert.equal((await h.request('records/'+r.id+'/presentation',{revision:current.revision,authorized:true,presentation:{}})).status,400);
 assert.equal((await h.update(key,{revision:current.revision,status:'published'})).status,403);
 assert.equal((await(await h.request('catalog')).json()).records.length,0);
 await assert.rejects(()=>h.create('alice','hidden-invalid'));
});
test('Cambiar un lote publicado a Off-market oculta el enlace; volver a Público no restaura el consentimiento',async()=>{
 const h=harness(),r=await h.create('alice','public'),key=await h.find(r.id);
 let current=await(await h.update(key,{revision:0,status:'in_review'})).json();current=await(await h.update(key,{revision:current.revision,status:'approved'})).json();
 current=await(await h.request('records/'+r.id+'/publication-consent',{revision:current.revision,authorized:true})).json();current=await(await h.update(key,{revision:current.revision,status:'published'})).json();
 assert.equal((await h.request('catalog/'+current.publicationId)).status,200);
 assert.equal((await h.request('records/'+r.id+'/visibility',{revision:current.revision,visibility:'off-market'},{user:'bob'})).status,404);
 assert.equal((await h.request('records/'+r.id+'/visibility',{revision:0,visibility:'off-market'})).status,409);
 assert.equal((await h.request('records/'+r.id+'/visibility',{revision:current.revision,visibility:'other'})).status,400);
 current=await(await h.request('records/'+r.id+'/visibility',{revision:current.revision,visibility:'off-market'})).json();
 assert.equal(current.status,'approved');assert.equal(current.form.visibility,'off-market');assert.equal(current.publicationConsent.authorized,false);assert.equal(current.history.at(-1).type,'visibility');
 assert.equal((await h.request('catalog/'+current.publicationId)).status,404);assert.equal((await(await h.request('catalog')).json()).records.length,0);
 current=await(await h.request('records/'+r.id+'/visibility',{revision:current.revision,visibility:'public'})).json();assert.equal(current.publicationConsent.authorized,false);
 assert.equal((await h.update(key,{revision:current.revision,status:'published'})).status,400);
 current=await(await h.request('records/'+r.id+'/publication-consent',{revision:current.revision,authorized:true})).json();
 assert.equal((await h.update(key,{revision:current.revision,status:'published'})).status,200);
});
