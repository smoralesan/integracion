import {readDirectoryScope} from '../web/footer-directory.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {properties} from '../web/opportunity-examples.js';
import {matchesOpportunityFilters} from '../web/opportunity-filters.js';
import {terrainSearchKind,terrainSearchFromQuery,terrainSearchQuery} from '../web/terrain-search.js';
import {normalizeSearchContext} from '../web/search-journey.js';
import {catalogGroupsHTML} from '../web/journey-ui.js';
import {publicSummary} from '../web/workflow-model.js';
import {handleApi} from '../worker/api.js';
import {MemoryBucket} from './support/memory-bucket.mjs';
test('Bare land and land with a project have disjoint results and preserve location, area and price criteria',()=>{
 const match=filters=>properties.filter(p=>matchesOpportunityFilters(p,{type:'terreno',...filters})).map(p=>p.id);
 assert.deepEqual(match({landContent:'land-only'}),['TER-DEMO-001','TER-DEMO-004']);
 assert.deepEqual(match({landContent:'land-project'}),['TER-DEMO-002','TER-DEMO-003']);
 assert.deepEqual(match({landContent:'land-project',query:'Bogotá',min:'3000',max:'4000'}),['TER-DEMO-003']);
 assert.deepEqual(match({landContent:'land-only',query:'Bogotá'}),[]);
 assert.ok(properties.filter(p=>p.type==='proyecto').every(p=>!matchesOpportunityFilters(p,{landContent:'land-project'})));
});
test('Unknown, contradictory and cross-linked records are not silently classified',()=>{
 assert.equal(terrainSearchKind({kind:'terreno'}),'');
 assert.equal(terrainSearchKind({kind:'terreno',land_content:'land-only'}),'land-only');
 assert.equal(terrainSearchKind({kind:'terreno',land_content:'land-project'}),'land-project');
 assert.equal(terrainSearchKind({kind:'proyecto',land_content:'land-project'}),'');
 assert.equal(terrainSearchKind({id:'a',kind:'terreno',landContent:'land-project',developmentProject:{landReference:'b'}}),'');
 assert.equal(terrainSearchKind({kind:'terreno',landContent:'land-only',developmentProject:{}}),'');
 assert.equal(matchesOpportunityFilters({kind:'terreno'},{type:'terreno'}),true);
 assert.equal(matchesOpportunityFilters({kind:'terreno'},{type:'terreno',landContent:'land-only'}),false);
});
test('Each terrain format has its own URL, selected tab and restored search context',()=>{
 for(const [key,query] of [['land-only','solo-terreno'],['land-project','con-proyecto']]){
  assert.equal(terrainSearchFromQuery(query),key);assert.equal(terrainSearchQuery(key),query);
  const html=catalogGroupsHTML({type:'terreno',landContent:key});assert.ok(html.includes('contenido='+query+'" aria-current="page"'));assert.equal((html.match(/aria-current/g)||[]).length,1);
  const context=normalizeSearchContext({version:1,at:Date.now(),hash:'#/buscar?contenido='+query,filters:{type:'terreno',landContent:key,searchMunicipality:'11001'}});assert.equal(context.filters.landContent,key);assert.equal(context.filters.searchMunicipality,'11001');
 }
 const invalid=normalizeSearchContext({version:1,at:Date.now(),hash:'#/buscar',filters:{type:'proyecto',landContent:'land-project'}});assert.equal(invalid.filters.landContent,'');
 assert.equal(terrainSearchFromQuery('__proto__'),'');
});
test('New terrain declarations survive the private API and the authorized public summary without inventing project details',async()=>{
 const env={BUCKET:new MemoryBucket()};
 for(const value of ['land-only','land-project','invalid',true]){
  const body={id:crypto.randomUUID(),kind:'terreno',form:{title:'Predio de prueba',relationship:'Propietario',department_code:'13',municipality_code:'13001',project_land_confirmed:true,land_content:value},documentIds:[],parcel:{confirmed:true,source:'Prueba',geometry:{type:'Polygon',coordinates:[[[-75.5,10.4],[-75.49,10.4],[-75.49,10.41],[-75.5,10.41],[-75.5,10.4]]]}}};
  const response=await handleApi(new Request('https://portal.test/api/records',{method:'POST',headers:{origin:'https://portal.test','content-type':'application/json','oai-authenticated-user-id':'terrain-search-test'},body:JSON.stringify(body)}),env);
  assert.equal(response.status,['land-only','land-project'].includes(value)?201:400);
  if(response.status===201){const record=await response.json();assert.equal(record.form.land_content,value);const summary=publicSummary(record);assert.equal(summary.land_content,value);assert.equal(summary.developmentProject,undefined);}
 }
 assert.equal(publicSummary({kind:'terreno',form:{}}).land_content,undefined);
});

test('A terrain category URL is not mistaken for a city or land-type directory',()=>{assert.equal(readDirectoryScope('#/oportunidades?tipo=terreno&contenido=con-proyecto'),null);assert.equal(readDirectoryScope('#/oportunidades?tipo=terreno&contenido=solo-terreno&ciudad=Bogot%C3%A1').city,'Bogotá');});
