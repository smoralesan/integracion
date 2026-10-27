import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi,purgeExpired} from '../worker/api.js';
const geometry={type:'Polygon',coordinates:[[[-75.5,10.4],[-75.49,10.4],[-75.49,10.41],[-75.5,10.41],[-75.5,10.4]]]};
class Bucket {
  objects=new Map();
  async put(key,value,options={}){this.objects.set(key,{bytes:typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value),...options});}
  async get(key){const o=this.objects.get(key);return o?{body:o.bytes,json:async()=>JSON.parse(new TextDecoder().decode(o.bytes))}:null;}
  async delete(keys){for(const k of Array.isArray(keys)?keys:[keys])this.objects.delete(k);}
  async list({prefix='',cursor='',limit=100}={}){const keys=[...this.objects.keys()].filter(k=>k.startsWith(prefix)&&k>cursor).sort();const truncated=keys.length>limit;return {objects:keys.slice(0,limit).map(key=>({key,customMetadata:this.objects.get(key).customMetadata})),truncated,cursor:truncated?keys[limit-1]:null};}
}
function harness(){
  const bucket=new Bucket();
  return {bucket,request:async(path,body,{owner='alice',origin='https://portal.test',method=body?'POST':'GET'}={})=>{
    const headers=new Headers();if(owner)headers.set('oai-authenticated-user-id',owner);if(origin)headers.set('origin',origin);
    let payload=body;if(body&&!(body instanceof FormData)){headers.set('content-type','application/json');payload=JSON.stringify(body);}
    return handleApi(new Request('https://portal.test/api/'+path,{method,headers,...(payload?{body:payload}:{})}),{BUCKET:bucket});
  }};
}
const upload=(name,bytes)=>{const f=new FormData();f.set('file',new File([bytes],name));return f;};
const record=(documentIds=[])=>({id:crypto.randomUUID(),kind:'terreno',form:{title:'Terreno ficticio de prueba',city:'Cartagena',region:'Bolívar',relationship:'owner',project_land_confirmed:true,amount:'2000000000.50'},parcel:{geometry,confirmed:true,source:'Prueba'},documentIds});
test('requires trusted identity and same origin mutations',async()=>{
  const h=harness();assert.equal((await h.request('session',null,{owner:null})).status,401);
  assert.equal((await h.request('documents',{name:'Plan',url:'https://example.com/a'},{origin:'https://other.test'})).status,403);
  assert.equal((await h.request('documents',{name:'Plan',url:'http://example.com/a'})).status,400);
});
test('upload persists actual bytes privately and expires in 60 days without renewal',async()=>{
  const h=harness(),bytes='%PDF-1.7\nPrueba privada';
  const response=await h.request('documents',upload('prueba.pdf',bytes));assert.equal(response.status,201);const doc=await response.json();
  assert.equal(Date.parse(doc.expiresAt)-Date.parse(doc.createdAt),60*86400000);assert.equal(doc.analysis.status,'pending_review');
  assert.equal((await h.request('documents/'+doc.id,null,{owner:'bob'})).status,404);
  const retrieved=await h.request('documents/'+doc.id+'/download');assert.equal(await retrieved.text(),bytes);assert.match(retrieved.headers.get('content-disposition'),/attachment/);
  assert.equal((await(await h.request('documents/'+doc.id)).json()).expiresAt,doc.expiresAt);
  const metaKey=[...h.bucket.objects.keys()].find(k=>k.endsWith('meta.json'));const meta=await(await h.bucket.get(metaKey)).json();meta.expiresAt=new Date(Date.now()-1).toISOString();await h.bucket.put(metaKey,JSON.stringify(meta));
  assert.equal((await h.request('documents/'+doc.id+'/download')).status,410);assert.equal([...h.bucket.objects.keys()].filter(k=>k.includes('/documents/')).length,0);
});
test('enforces 10MB exactly and verifies common file signatures',async()=>{
  const h=harness();const bytes=new Uint8Array(10_000_000);bytes.set(new TextEncoder().encode('%PDF-1.7'));
  assert.equal((await h.request('documents',upload('limite.pdf',bytes))).status,201);
  assert.equal((await h.request('documents',upload('grande.pdf',new Uint8Array(10_000_001)))).status,413);
  assert.equal((await h.request('documents',upload('falso.pdf','HTML mal rotulado'))).status,415);
});
test('server interprets geometry, requires confirmation, persists record and isolates owners',async()=>{
  const h=harness();const doc=await(await h.request('documents',upload('lote.geojson',JSON.stringify(geometry)))).json();assert.equal(doc.analysis.candidates.length,1);
  const data=record([doc.id]);data.parcel.confirmed=false;assert.equal((await h.request('records',data)).status,400);data.parcel.confirmed=true;
  const response=await h.request('records',data);assert.equal(response.status,201);const stored=await response.json();assert.ok(stored.parcel.areaM2>1);assert.equal(stored.files[0].analysis.candidates,undefined);
  assert.deepEqual(await(await h.request('records/'+data.id)).json(),stored);assert.equal((await h.request('records/'+data.id,null,{owner:'bob'})).status,404);
  assert.equal((await(await h.request('records')).json()).records.length,1);assert.equal((await(await h.request('records',null,{owner:'bob'})).json()).records.length,0);
  assert.equal((await h.request('records',data)).status,200);assert.equal((await(await h.request('records')).json()).records.length,1);
  const other=record([doc.id]);assert.equal((await h.request('records',other,{owner:'bob'})).status,404);
});
test('large files can be referenced without downloading links; invalid geometry remains reviewable',async()=>{
  const h=harness();const link=await(await h.request('documents',{name:'Plano mayor a 10 MB',url:'https://example.com/archivo.zip'})).json();assert.equal(link.origin,'link');assert.equal(link.size,null);assert.equal([...h.bucket.objects.keys()].filter(k=>k.endsWith('/content')).length,0);
  const bad=await(await h.request('documents',upload('punto.geojson',JSON.stringify({type:'Point',coordinates:[-75,10]})))).json();assert.equal(bad.analysis.status,'needs_review');
});
test('physical cleanup deletes expired objects and rotates through pages',async()=>{
  const bucket=new Bucket();for(let i=0;i<105;i++)await bucket.put('users/test/'+String(i).padStart(3,'0'),'x',{customMetadata:{expiresAt:new Date(0).toISOString()}});
  const first=await purgeExpired(bucket);assert.equal(first.deleted,100);assert.ok(first.cursor);assert.equal((await purgeExpired(bucket,Date.now(),first.cursor)).deleted,5);assert.equal(bucket.objects.size,0);
});
test('records validate DIVIPOLA hierarchy and retain optional neighborhood privately',async()=>{
  const h=harness(),data=record();
  Object.assign(data.form,{department_code:'05',municipality_code:'08001'});
  assert.equal((await h.request('records',data)).status,400);
  data.form.municipality_code='05001';data.form.neighborhood='  El Poblado  ';
  const response=await h.request('records',data);assert.equal(response.status,201);
  const stored=await response.json();
  assert.equal(stored.form.region,'Antioquia');assert.equal(stored.form.city,'Medellín');
  assert.equal(stored.form.department_code,'05');assert.equal(stored.form.municipality_code,'05001');
  assert.equal(stored.form.neighborhood,'El Poblado');
  const {publicSummary}=await import('../web/workflow-model.js');
  assert.equal(publicSummary(stored).neighborhood,undefined);
  const withoutNeighborhood=record();
  delete withoutNeighborhood.form.city;delete withoutNeighborhood.form.region;
  Object.assign(withoutNeighborhood.form,{department_code:'11',municipality_code:'11001'});
  assert.equal((await h.request('records',withoutNeighborhood)).status,201);
  const invalid=record();invalid.form.city='Inventado';
  assert.equal((await h.request('records',invalid)).status,400);
});
test('land submissions require explicit project scope, reject string bypasses and impose no area threshold',async()=>{
  const h=harness();
  for(const value of [undefined,false,'true','yes']){
    const data=record();data.form.project_land_confirmed=value;
    const response=await h.request('records',data);assert.equal(response.status,400);
    assert.match((await response.json()).error,/una sola vivienda/);
  }
  const data=record();data.form.area='280';
  const response=await h.request('records',data);assert.equal(response.status,201);
  const stored=await response.json();assert.equal(stored.form.project_land_confirmed,true);assert.equal(stored.form.area,'280');
});

test('pin submissions keep an approximate private point without inventing a polygon or computed area',async()=>{
  const h=harness(),data=record();delete data.parcel;
  data.locationMode='pin';data.locationPin={coordinates:[-74.059821234,4.650571234],confirmed:true};data.form.area='5200';
  const response=await h.request('records',data);assert.equal(response.status,201);
  const stored=await response.json();assert.equal(stored.parcel,null);assert.equal(stored.form.area,'5200');
  assert.deepEqual(stored.locationPin.coordinates,[-74.0598212,4.6505712]);assert.equal(stored.locationPin.precision,'approximate');
  assert.equal(stored.locationPin.areaM2,undefined);assert.equal(stored.locationPin.geometry,undefined);
  assert.equal((await h.request('records/'+data.id,null,{owner:'bob'})).status,404);
  const {publicSummary}=await import('../web/workflow-model.js');const summary=publicSummary(stored);
  assert.equal(summary.locationPin,undefined);assert.equal(summary.coordinates,undefined);assert.equal(summary.geometry,undefined);
});
test('pin validation rejects unconfirmed, malformed, absent and conflicting locations and needs a declared area',async()=>{
  const h=harness();
  for(const locationPin of [undefined,{coordinates:[-74,4]},{coordinates:[-74,4],confirmed:'true'},{coordinates:['-74',4],confirmed:true},{coordinates:[0,0],confirmed:true},{coordinates:[-74,4,8],confirmed:true}]){
    const data=record();delete data.parcel;Object.assign(data,{locationMode:'pin',locationPin});data.form.area='5200';
    assert.equal((await h.request('records',data)).status,400);
  }
  const missingArea=record();delete missingArea.parcel;Object.assign(missingArea,{locationMode:'pin',locationPin:{coordinates:[-74,4],confirmed:true}});
  assert.equal((await h.request('records',missingArea)).status,400);
  const conflicting=record();Object.assign(conflicting,{locationMode:'pin',locationPin:{coordinates:[-74,4],confirmed:true}});conflicting.form.area='5200';
  assert.equal((await h.request('records',conflicting)).status,400);
  const unknown=record();unknown.locationMode='anything';assert.equal((await h.request('records',unknown)).status,400);
  const missing=record();delete missing.parcel;assert.equal((await h.request('records',missing)).status,400);
});

test('submitted value preferences exclude inactive draft prices on both API and local flows',async()=>{
 const h=harness();
 for(const status of ['pending','advice']){
  const data=record();Object.assign(data.form,{value_status:status,amount_usd:'500',exchange_rate:'4000',valuation_assistance:false});
  const response=await h.request('records',data);assert.equal(response.status,201);
  const saved=await response.json();assert.equal(saved.form.value_status,status);
  for(const field of ['amount','amount_usd','exchange_rate'])assert.ok(!(field in saved.form));
  assert.equal(saved.form.valuation_assistance,false);
 }
 const bad=record();bad.form.value_status='invalid';assert.equal((await h.request('records',bad)).status,400);
 const contribution=record();Object.assign(contribution.form,{value_status:'known',negotiation:'contribution',compensation:'units',receive_currencies:['USD'],exchange_rate:'4000'});
 const response=await h.request('records',contribution);assert.equal(response.status,201);const saved=await response.json();
 assert.equal(saved.form.amount,contribution.form.amount);assert.ok(!('receive_currencies' in saved.form));
});
