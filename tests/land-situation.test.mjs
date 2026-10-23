import {test} from 'node:test';
import assert from 'node:assert/strict';
import {obligations,normalizeLandSituation} from '../web/land-situation-model.js';
import {publicSummary} from '../web/workflow-model.js';
import {landSituationSummary} from '../web/land-situation.js';
import {handleApi} from '../worker/api.js';
import {MemoryBucket} from './support/memory-bucket.mjs';
const situation=()=>({version:1,declaredAt:'1900-01-01',verified:true,obligations:Object.fromEntries(obligations.map(([key])=>[key,{status:'unknown'}])),facts:{owners:'multiple',mortgage:'yes'}});
const normalize=s=>normalizeLandSituation(s,{now:'2026-10-19T12:00:00.000Z'});
test('declarations allow unknown and debt without implying verification',()=>{
 const s=situation();s.obligations.predial={status:'pending',amount:'1500000.50',asOf:'2026-10-18',resolution:'Por acordar'};
 const clean=normalize(s);assert.equal(clean.obligations.predial.amount,'1500000.50');assert.equal(clean.obligations.predial.currency,'COP');assert.equal(clean.facts.mortgage,'yes');assert.equal(clean.verified,undefined);assert.equal(clean.declaredAt,'2026-10-19T12:00:00.000Z');
});
test('invalid states, dates, amounts and unrelated support IDs are rejected',()=>{
 for(const patch of [{status:'verified'},{status:'pending',amount:'-10'},{status:'pending',amount:'1.000,00'},{status:'current',asOf:'2026-02-30'},{status:'current',asOf:'2026-99-99'},{status:'current',asOf:'2027-01-01'},{status:'current',supportId:crypto.randomUUID()}]){
  const s=situation();s.obligations.predial=patch;assert.throws(()=>normalize(s));
 }
});
test('changing to paid or not applicable removes stale debt and supporting details',()=>{
 const s=situation();s.obligations.predial={status:'current',amount:'500',creditor:'Old creditor',resolution:'Old plan'};s.obligations.otras={status:'na',amount:'500',description:'Old detail',supportId:'unrelated'};
 const c=normalize(s);assert.deepEqual(c.obligations.predial,{status:'current'});assert.deepEqual(c.obligations.otras,{status:'na'});
});
test('private financial information and premium request never enter public summaries',()=>{
 const record={form:{title:'Terreno',land_situation:normalize(situation()),valuation_assistance:true}};
 assert.equal(publicSummary(record).land_situation,undefined);assert.equal(publicSummary(record).valuation_assistance,undefined);
 const s=situation();s.obligations.predial={status:'pending',resolution:'<script>alert(1)</script>'};assert.doesNotMatch(landSituationSummary(normalize(s)),/<script>/);
});
test('API persists private situation and premium request and prevents another owner from reading them',async()=>{
 const bucket=new MemoryBucket(),env={BUCKET:bucket};
 const request=(path,body,user='alice')=>handleApi(new Request('https://portal.test/api/'+path,{method:body?'POST':'GET',headers:{origin:'https://portal.test','content-type':'application/json','oai-authenticated-user-id':user},...(body?{body:JSON.stringify(body)}:{})}),env);
 const record={id:crypto.randomUUID(),kind:'terreno',form:{title:'Prueba privada',department_code:'13',municipality_code:'13001',relationship:'Propietario',project_land_confirmed:true,valuation_assistance:true,land_situation:situation()},documentIds:[],parcel:{confirmed:true,source:'Prueba',geometry:{type:'Polygon',coordinates:[[[-75.5,10.4],[-75.49,10.4],[-75.49,10.41],[-75.5,10.41],[-75.5,10.4]]]}}};
 const response=await request('records',record);assert.equal(response.status,201);const saved=await response.json();assert.equal(saved.form.valuation_assistance,true);assert.equal(saved.form.land_situation.obligations.predial.status,'unknown');assert.equal(saved.form.land_situation.verified,undefined);
 assert.equal((await request('records/'+record.id,null,'bob')).status,404);
 record.id=crypto.randomUUID();record.form.land_situation.obligations.predial.supportId=crypto.randomUUID();assert.equal((await request('records',record)).status,400);
});
