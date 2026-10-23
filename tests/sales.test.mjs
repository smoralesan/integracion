import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi} from '../worker/api.js';
import {MemoryBucket} from './support/memory-bucket.mjs';
import {bogotaLocalToISO,bogotaInput,normalizeVisit,normalizeProposal} from '../web/sales-model.js';
function harness(){
 const bucket=new MemoryBucket(),env={BUCKET:bucket,II_TEAM_ROLES:JSON.stringify({'admin@example.test':'admin'})};
 const request=(path,body,{user='buyer',method=body?'POST':'GET',origin='https://portal.test'}={})=>handleApi(new Request('https://portal.test/api/'+path,{method,headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test',origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);
 const get=async(path,user='buyer')=>{const r=await request(path,null,{user});assert.equal(r.status,200,await r.clone().text());return r.json();};
 const put=async(path,body,user='admin')=>{const r=await request(path,body,{user,method:'PATCH'});assert.equal(r.status,200,await r.clone().text());return r.json();};
 const publication=async()=>{
  let res=await request('records',{id:crypto.randomUUID(),kind:'terreno',form:{title:'Terreno para desarrollo',city:'Cartagena',region:'Bolívar',relationship:'owner',project_land_confirmed:true,description:'PRIVADO-DESCRIPCION',amount:'2000000000',area:'5200'},parcel:{confirmed:true,geometry:{type:'Polygon',coordinates:[[[-75.5,10.4],[-75.49,10.4],[-75.49,10.41],[-75.5,10.41],[-75.5,10.4]]]}},documentIds:[]},{user:'seller'});assert.equal(res.status,201,await res.clone().text());let r=await res.json();
  const key=(await get('team/records','admin')).records.find(x=>x.id===r.id).teamKey;
  r=await put('team/records/'+key,{revision:r.revision,status:'in_review'});r=await put('team/records/'+key,{revision:r.revision,status:'approved'});
  res=await request('records/'+r.id+'/publication-consent',{revision:r.revision,authorized:true},{user:'seller'});assert.equal(res.status,200);r=await res.json();
  r=await put('team/records/'+key,{revision:r.revision,status:'published'});return r;
 };
 const payload=p=>({id:crypto.randomUUID(),sourceKind:'publication',sourceId:p.publicationId,name:'Comprador privado',email:'buyer-contact@example.test',phone:'123',role:'Comprador',intent:'Comprar',message:'MENSAJE PRIVADO DEL COMPRADOR',contactConsent:true});
 const lead=async(p,extra={})=>{const body={...payload(p),...extra},r=await request('purchase-leads',body);assert.equal(r.status,201,await r.clone().text());return {r:await r.json(),body};};
 const manage=(r,status,extra={})=>put('team/purchase-leads/'+r.id,{revision:r.revision,status,message:'Seguimiento: '+status,...extra});
 const grant=async r=>{const res=await request('received-leads/'+r.id+'/authorization',{revision:r.revision,action:'grant',confirm:true,contact:{name:'Titular autorizado',email:'seller-contact@example.test',phone:'321'}},{user:'seller'});assert.equal(res.status,200,await res.clone().text());return res.json();};
 return {bucket,request,get,put,publication,payload,lead,manage,grant};
}
test('sales resolves real approved summaries and ignores forged client source fields',async()=>{
 const h=harness(),p=await h.publication();const s=await h.get('purchase-leads/source/publication/'+p.publicationId);assert.equal(s.isOwn,false);assert.equal((await h.get('purchase-leads/source/publication/'+p.publicationId,'seller')).isOwn,true);
 const {r}=await h.lead(p,{source:{snapshot:{title:'FORGED'}},targetRecordKey:'FORGED'});assert.equal(r.source.snapshot.title,'Terreno para desarrollo');assert.doesNotMatch(JSON.stringify(r),/FORGED|PRIVADO-DESCRIPCION|users\//);assert.equal(r.status,'received');
 assert.equal((await h.request('purchase-leads',h.payload(p),{user:'seller'})).status,400);
 await h.request('records/'+p.id+'/publication-consent',{revision:p.revision,authorized:false},{user:'seller'});
 assert.equal((await h.request('purchase-leads/source/publication/'+p.publicationId)).status,404);assert.equal((await h.request('purchase-leads',h.payload(p))).status,404);
});
test('sales validates source, consent, identity and idempotent references',async()=>{
 const h=harness(),p=await h.publication();for(const change of [{contactConsent:false},{role:'Admin'},{intent:'Bad'},{email:'invalid'},{message:'short'},{sourceId:crypto.randomUUID()}])assert.ok([400,404].includes((await h.request('purchase-leads',{...h.payload(p),...change})).status));
 const {r,body}=await h.lead(p);const retry=await h.request('purchase-leads',body);assert.equal(retry.status,200);assert.equal((await retry.json()).id,r.id);assert.equal((await h.get('purchase-leads')).leads.length,1);
 assert.equal((await h.request('purchase-leads',body,{user:'stranger'})).status,409);assert.equal((await h.get('purchase-leads','stranger')).leads.length,0);assert.equal((await h.request('purchase-leads/'+r.id,null,{user:'stranger'})).status,404);
});
test('seller cannot see buyer contact before accepting; other owners cannot authorize',async()=>{
 const h=harness(),p=await h.publication(),{r}=await h.lead(p),seller=await h.get('received-leads/'+r.id,'seller');
 assert.equal(seller.recordId,p.id);assert.equal(seller.ownContactEmail,'seller@example.test');assert.equal(seller.buyer.role,'Comprador');assert.doesNotMatch(JSON.stringify(seller),/buyer-contact|Comprador privado|MENSAJE PRIVADO/);
 assert.equal((await h.get('received-leads','seller')).leads.length,1);assert.equal((await h.get('received-leads','stranger')).leads.length,0);assert.equal((await h.request('received-leads/'+r.id+'/authorization',{revision:0,action:'grant',confirm:true,contact:{name:'Fake',email:'fake@example.test'}},{user:'stranger'})).status,404);
 assert.equal(r.sellerContact,null);assert.equal(r.targetTeamKey,undefined);assert.equal(r.targetRecordKey,undefined);
});
test('only explicit owner authorization reveals contact and unlocks commercial stages',async()=>{
 const h=harness(),p=await h.publication();let {r}=await h.lead(p);r=await h.manage(r,'in_review',{assignee:'Ana',internalNote:'NOTA INTERNA'});
 assert.equal((await h.request('team/purchase-leads/'+r.id,{revision:r.revision,status:'contact_authorized',message:'Intento'},{user:'admin',method:'PATCH'})).status,400);
 assert.equal((await h.request('received-leads/'+r.id+'/authorization',{revision:r.revision,action:'grant',contact:{name:'Titular',email:'seller@example.test'}},{user:'seller'})).status,400);
 r=await h.grant(r);const buyer=await h.get('purchase-leads/'+r.id);assert.equal(buyer.sellerContact.email,'seller-contact@example.test');assert.doesNotMatch(JSON.stringify(buyer),/NOTA INTERNA|admin@example/);assert.equal(r.buyer.email,'buyer-contact@example.test');
 r=await h.manage(r,'contact_authorized');r=await h.manage(r,'contacted');r=await h.manage(r,'visit_scheduled',{visit:{at:'2026-11-01T15:30:00.000Z',channel:'En el predio'}});assert.equal(r.visit.timeZone,'America/Bogota');
 r=await h.manage(r,'visited');r=await h.manage(r,'proposal',{proposal:{summary:'Pago acordado por evaluar',amount:'2000000000.50',currency:'COP'}});r=await h.manage(r,'negotiation');r=await h.manage(r,'closed_won');assert.equal(r.proposal.amount,'2000000000.50');assert.equal(r.status,'closed_won');assert.equal((await h.get('purchase-leads/'+r.id)).visit.at,'2026-11-01T15:30:00.000Z');
 assert.equal((await h.request('purchase-leads/'+r.id+'/reply',{revision:r.revision,message:'No reabrir'})).status,400);
});
test('revoking contact removes shared details and blocks progression; decline closes the request',async()=>{
 const h=harness(),p=await h.publication();let {r}=await h.lead(p);r=await h.manage(r,'in_review');r=await h.grant(r);r=await h.manage(r,'contact_authorized');
 let res=await h.request('received-leads/'+r.id+'/authorization',{revision:r.revision,action:'revoke'},{user:'seller'});assert.equal(res.status,200);r=await res.json();assert.equal(r.status,'awaiting_authorization');assert.equal((await h.get('purchase-leads/'+r.id)).sellerContact,null);assert.equal(r.buyer.email,undefined);
 assert.equal((await h.request('team/purchase-leads/'+r.id,{revision:r.revision,status:'contact_authorized',message:'No autorizado'},{user:'admin',method:'PATCH'})).status,400);
 res=await h.request('received-leads/'+r.id+'/authorization',{revision:r.revision,action:'decline'},{user:'seller'});assert.equal((await res.json()).status,'closed_lost');
});
test('commercial permissions and revisions prevent privilege escalation and concurrent overwrites',async()=>{
 const h=harness(),p=await h.publication(),{r}=await h.lead(p);assert.equal((await h.request('team/purchase-leads')).status,403);assert.equal((await h.request('team/purchase-leads/'+r.id)).status,403);
 assert.equal((await h.request('purchase-leads',h.payload(p),{origin:'https://evil.test'})).status,403);
 const patch={revision:r.revision,status:'in_review',message:'Revisar'};const responses=await Promise.all([h.request('team/purchase-leads/'+r.id,patch,{user:'admin',method:'PATCH'}),h.request('team/purchase-leads/'+r.id,patch,{user:'admin',method:'PATCH'})]);assert.deepEqual(responses.map(x=>x.status).sort(),[200,409]);
 const current=await h.get('team/purchase-leads/'+r.id,'admin');assert.equal(current.revision,1);assert.equal(current.history.length,2);assert.equal((await h.request('team/purchase-leads/'+r.id,{revision:0,internalNote:'Stale'},{user:'admin',method:'PATCH'})).status,409);
});
test('shared messages are visible to the buyer while notes and staff identities remain private',async()=>{
 const h=harness(),p=await h.publication();let {r}=await h.lead(p);r=await h.manage(r,'in_review',{message:'Comparte tu disponibilidad',internalNote:'Solo equipo'});
 const res=await h.request('purchase-leads/'+r.id+'/reply',{revision:r.revision,message:'Disponible el martes'});assert.equal(res.status,200);r=await res.json();assert.equal(r.history.at(-1).message,'Disponible el martes');assert.equal(r.internalNotes,undefined);assert.doesNotMatch(JSON.stringify(r),/Solo equipo|admin@example/);assert.equal((await h.get('team/purchase-leads/'+r.id,'admin')).internalNotes.length,1);
 assert.equal((await h.request('team/purchase-leads/'+r.id,{revision:r.revision,status:'closed_lost'},{user:'admin',method:'PATCH'})).status,400);
});
test('example interests and simulated contact stages require acknowledgement',async()=>{
 const h=harness(),body={...h.payload({}),sourceKind:'demo',sourceId:'TER-DEMO-001'};assert.equal((await h.request('purchase-leads',body)).status,400);let {r}=await h.lead({}, {...body,demoAcknowledged:true});assert.equal(r.source.kind,'demo');assert.equal(r.authorization.state,'demo');r=await h.manage(r,'in_review');
 assert.equal((await h.request('team/purchase-leads/'+r.id,{revision:r.revision,status:'contact_authorized',message:'Demo'},{user:'admin',method:'PATCH'})).status,400);r=await h.manage(r,'contact_authorized',{demoAcknowledged:true});assert.equal(r.sellerContact,null);assert.equal((await h.get('received-leads','seller')).leads.length,0);
});
test('visit dates use Colombia time, reject invalid calendar values, and proposals validate currency and amount',()=>{
 assert.equal(bogotaLocalToISO('2026-11-01T10:30'),'2026-11-01T15:30:00.000Z');assert.equal(bogotaInput('2026-11-01T15:30:00.000Z'),'2026-11-01T10:30');assert.equal(bogotaLocalToISO('2026-02-30T10:30'),'');
 assert.throws(()=>normalizeVisit({at:'2026-02-30T15:30:00Z',channel:'Virtual'}));assert.throws(()=>normalizeVisit({at:'2026-11-01T15:30:00Z',channel:'Bad'}));assert.equal(normalizeVisit({at:'2026-11-01T15:30:00Z',channel:'Virtual'}).at,'2026-11-01T15:30:00.000Z');
 for(const amount of ['-1','1.234,00','0','1.123'])assert.throws(()=>normalizeProposal({summary:'Evaluar',currency:'COP',amount}));assert.throws(()=>normalizeProposal({summary:'',currency:'USD',amount:''}));assert.throws(()=>normalizeProposal({summary:'Evaluar',currency:'EUR',amount:'100'}));
});
