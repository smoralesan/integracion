import test from 'node:test';
import assert from 'node:assert/strict';
import {properties} from '../web/opportunity-examples.js';
import {matchesOpportunityFilters} from '../web/opportunity-filters.js';
import {publicOpportunityHTML} from '../web/opportunity-experience.js';
import {consultationHTML,detailTabsHTML,catalogGroupsHTML} from '../web/journey-ui.js';
const id='8c47b791-252a-433e-8adf-cd329a0b1d65';
const record={id,kind:'terreno',reference:'TER-PRUEBA',title:'<script>no ejecutar</script>',city:'Bogotá',region:'Bogotá D.C.',availability:'available',price_method:'mixed',amount:'2000000000',amount_usd:'50000',area:'5200',negotiation:'sale',technical:{use:'Residencial propuesto'},description:'Descripción autorizada',photos:['/api/catalog/'+id+'/photos/photo-id'],evidence:{planning:{state:'provided',count:1}}};
test('Terrain, active project and reactivation groups are disjoint and retain other criteria',()=>{
 const terrain=properties.filter(p=>matchesOpportunityFilters(p,{type:'terreno'}));
 const projects=properties.filter(p=>matchesOpportunityFilters(p,{type:'proyecto',reactivationFilter:'exclude'}));
 const rescue=properties.filter(p=>matchesOpportunityFilters(p,{type:'proyecto',reactivationFilter:'only'}));
 assert.ok(terrain.length&&projects.length&&rescue.length);
 assert.ok(projects.every(p=>!p.reactivation));assert.ok(rescue.every(p=>p.reactivation));
 assert.equal(new Set([...terrain,...projects,...rescue].map(p=>p.id)).size,properties.length);
 assert.equal(matchesOpportunityFilters({...record,kind:'proyecto',reactivation:true},{type:'proyecto',reactivationFilter:'only',query:'Medellín'}),false);
});
test('Public land keeps exact perimeter reserved and starts with map before optional images',()=>{
 const html=publicOpportunityHTML(record);assert.ok(html.includes('Perímetro reservado'));assert.ok(!html.includes('api.mapbox.com'));
 assert.match(html,/data-jr-media-panel="fotos" hidden/);assert.ok(html.indexOf('data-jr-media-panel="mapa"')<html.indexOf('data-jr-media-panel="fotos"'));
 assert.match(html,/COP \$2\.000\.000\.000(?:,00)? \+ USD \$50\.000(?:,00)?/);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes('Sin dato declarado'));assert.ok(html.includes('Grupo: Soporte aportado'));
});
test('Public withdrawal removes all request entry points without removing context',()=>{
 const html=publicOpportunityHTML({...record,availability:'withdrawn'});assert.ok(!html.includes('data-jr-consult'));assert.ok(!html.includes('jr-real-mobile-contact'));assert.ok(html.includes('No se reciben nuevos intereses'));assert.ok(html.includes('Participantes'));
});
test('Tab navigation references unique panels and has one initial selection',()=>{
 const html=detailTabsHTML(id,[['first','Uno','contenido 1'],['second','Dos','contenido 2']]);
 assert.equal((html.match(/aria-selected="true"/g)||[]).length,1);assert.equal((html.match(/role="tabpanel"/g)||[]).length,2);
 for(const [,target]of html.matchAll(/aria-controls="([^"]+)"/g))assert.ok(html.includes('id="'+target+'"'));
});
test('Consultation chooser only produces approved internal routes and never submits a form',()=>{
 const html=consultationHTML('#/interes/publicacion/'+id);assert.equal((html.match(/consulta=/g)||[]).length,3);assert.ok(!html.includes('<form'));assert.ok(html.includes('no envía información'));
 for(const bad of ['javascript:alert(1)','#/interes/publicacion/" onclick="x','https://example.com'])assert.equal(consultationHTML(bad),'');
 assert.ok(catalogGroupsHTML({type:'proyecto',reactivationFilter:'only'}).includes('estado=reactivacion" aria-current="page"'));
});
