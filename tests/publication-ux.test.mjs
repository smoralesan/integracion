import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainPresentation,publicationPreviewHTML,publicationFollowUps,nextStepsHTML,terrainBasicsHTML} from '../web/publication-ux.js';
const form=()=>({title:'Terreno de prueba',land_content:'land-only',city:'Medellín',region:'Antioquia',neighborhood:'BARRIO PRIVADO',department_code:'05',municipality_code:'05001',area:'5200',negotiation:'sale',value_status:'known',price_method:'cop',amount:'2000000000',visibility:'public',description:'DESCRIPCIÓN PRIVADA',relationship:'Propietario',contact:'CONTACTO PRIVADO',location_pin:[-75.5,6.2],parcel_geometry:{type:'Polygon',coordinates:[]},land_situation:{obligations:{predial:{status:'pending',amount:'SALDO PRIVADO'}}}});
test('preview uses only public catalog projection and never exposes precise or private facts',()=>{
 const input=form(),before=structuredClone(input),projection=terrainPresentation(input);
 for(const key of ['neighborhood','description','contact','location_pin','parcel_geometry','land_situation','relationship'])assert.equal(key in projection,false);
 assert.equal(projection.land_content,'land-only');assert.deepEqual(input,before);
 const html=publicationPreviewHTML(input,{privateSummary:'RESUMEN INTERNO'});
 for(const secret of ['BARRIO PRIVADO','DESCRIPCIÓN PRIVADA','CONTACTO PRIVADO','SALDO PRIVADO','-75.5'])assert.ok(!html.includes(secret));
 assert.match(html,/Vista previa · Aún no publicado/);assert.match(html,/Ver expediente privado completo/);
});
test('Off-market preview and receipt describe private selective offering without public publication step',()=>{
 const input={...form(),visibility:'off-market'},html=publicationPreviewHTML(input,{privateSummary:''}),receipt=nextStepsHTML(input,{preview:true});
 assert.match(html,/Off-market · Presentación selectiva/);assert.match(html,/sin publicarlo en Internet al público/);
 assert.doesNotMatch(html,/Vista previa · Aún no publicado/);assert.match(receipt,/Gestión Off-market/);assert.doesNotMatch(receipt,/Autorización del resumen/);assert.match(receipt,/La demostración no inició/);
});
test('pending or advice price hides retained draft amounts and monetary choices reflect active fields',()=>{
 const input={...form(),value_status:'pending',amount_usd:'500000'},projection=terrainPresentation(input);
 assert.equal(projection.amount,undefined);assert.equal(projection.amount_usd,undefined);
 const html=publicationPreviewHTML(input,{privateSummary:''});assert.match(html,/Por definir/);assert.doesNotMatch(html,/2\.000\.000\.000/);
 const dual=publicationPreviewHTML({...form(),price_method:'dual',amount_usd:'500000'},{privateSummary:''});assert.match(dual,/USD \$500\.000/);
});
test('follow-ups remain optional and distinguish missing, expired and usable supports',()=>{
 const input={...form(),location_mode:'pin',value_status:'advice',valuation_assistance:true,land_situation:{obligations:{predial:{status:'unknown'}}}};
 const before=structuredClone(input),expired=[{id:'doc',expiresAt:'2020-01-01'}],current=[{id:'doc',expiresAt:'2030-01-01'}];
 assert.deepEqual(publicationFollowUps(input,expired).map(x=>x.key),['perimeter','price','obligations','supports']);
 assert.ok(!publicationFollowUps(input,current).some(x=>x.key==='supports'));assert.deepEqual(input,before);
 assert.ok(!publicationFollowUps({...input,location_mode:'polygon'},current).some(x=>x.key==='perimeter'));
});
test('conditional terrain controls keep one description and no duplicated negotiation in the first step',()=>{
 const input=form(),html=terrainBasicsHTML(input,{inputField:(_label,name)=>`<input name="${name}">`,locationFields:()=>'<select name="department_code"></select>'});
 assert.equal((html.match(/name="description"/g)||[]).length,1);assert.doesNotMatch(html,/name="negotiation"/);
 assert.match(html,/data-pu-project-note hidden/);assert.match(html,/name="broker_exclusivity" disabled/);
 const broker=terrainBasicsHTML({...input,relationship:'Intermediario',land_content:'land-project'},{inputField:()=>'',locationFields:()=>''});assert.match(broker,/name="broker_exclusivity" required/);assert.match(broker,/Describe el proyecto asociado/);
});
