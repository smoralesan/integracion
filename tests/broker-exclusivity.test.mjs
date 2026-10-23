import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBrokerExclusivity,brokerExclusivityFields} from '../web/broker-exclusivity.js';
import {publicSummary} from '../web/workflow-model.js';
import {handleApi} from '../worker/api.js';
import {MemoryBucket} from './support/memory-bucket.mjs';
test('broker answers are explicit and non-broker stale answers are ignored',()=>{
 for(const role of ['Intermediario','Intermediario / broker','Broker']){
  assert.equal(normalizeBrokerExclusivity(role,'yes'),'yes');assert.equal(normalizeBrokerExclusivity(role,'no'),'no');
  for(const v of [undefined,'',true,false,'false','unknown'])assert.throws(()=>normalizeBrokerExclusivity(role,v));
 }
 assert.equal(normalizeBrokerExclusivity('Propietario','yes'),undefined);
 assert.match(brokerExclusivityFields({relationship:'Intermediario',broker_exclusivity:'no'}),/otros brokers podrían publicar este mismo inmueble/);
});
test('API stores the broker declaration privately and does not accept missing or invalid answers',async()=>{
 const env={BUCKET:new MemoryBucket()},request=body=>handleApi(new Request('https://portal.test/api/records',{method:'POST',headers:{origin:'https://portal.test','content-type':'application/json','oai-authenticated-user-id':'broker-test'},body:JSON.stringify(body)}),env);
 const record=answer=>({id:crypto.randomUUID(),kind:'terreno',form:{title:'Terreno de prueba',department_code:'13',municipality_code:'13001',relationship:'Intermediario',project_land_confirmed:true,broker_exclusivity:answer},documentIds:[],parcel:{confirmed:true,source:'Prueba',geometry:{type:'Polygon',coordinates:[[[-75.5,10.4],[-75.49,10.4],[-75.49,10.41],[-75.5,10.41],[-75.5,10.4]]]}}});
 for(const answer of ['yes','no']){const response=await request(record(answer));assert.equal(response.status,201);const saved=await response.json();assert.equal(saved.form.broker_exclusivity,answer);assert.equal(publicSummary(saved).broker_exclusivity,undefined);}
 for(const answer of [undefined,'',true,'unknown'])assert.equal((await request(record(answer))).status,400);
 const owner=record('yes');owner.form.relationship='Propietario';const saved=await(await request(owner)).json();assert.equal(saved.form.broker_exclusivity,undefined);
});
