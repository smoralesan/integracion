import {normalizePreparation} from '../web/terrain-evaluation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainDetailHTML,terrainContexts,terrainConsultPreset,terrainConsultHTML} from '../web/terrain-detail.js';
import {properties} from '../web/opportunity-examples.js';
import {specialistBySlug} from '../web/specialist-landings.js';
test('Terrain details preserve the boundary between demo content and private supporting information',()=>{
 for(const p of properties.filter(p=>p.type==='terreno')){
  const html=terrainDetailHTML(p,{specialistBySlug});
  assert.match(html,/Ficha de ejemplo/);assert.match(html,/No hay documentos descargables/);assert.match(html,/Por informar/);
  assert.ok(!html.includes('download='));assert.ok(!html.includes('tel:'));assert.ok(!html.includes('<main'));
  for(const slug of terrainContexts[p.id].specialists)assert.ok(specialistBySlug(slug),slug);
  for(const target of [...html.matchAll(/data-target="([^"]+)"/g)])assert.ok(html.includes('id="'+target[1]+'"'),target[1]);
 }
});
test('Unknown values cannot invent unit prices, project programs or interpret markup in a terrain detail',()=>{
 const p={id:'UNKNOWN',type:'terreno',title:'<script>unsafe</script>',city:'Test',region:'Test',mode:'Venta',price:null,area:null};
 const html=terrainDetailHTML(p);
 assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('/ m² de terreno'));assert.ok(!html.includes('td-proyecto'));assert.ok(!html.includes('NaN'));assert.ok(!html.includes('Infinity'));
 assert.equal(terrainDetailHTML({...p,type:'proyecto'}),'');
});

test('Preparation accepts only known personal checklist items',()=>{
 assert.deepEqual(normalizePreparation(['purpose','purpose','unknown',null,'budget']),['purpose','budget']);
 assert.deepEqual(normalizePreparation({purpose:true}),[]);
});

test('Compact terrain navigation keeps a single initial panel and includes the project only for linked programs',()=>{
 for(const p of properties.filter(p=>p.type==='terreno')){
  const html=terrainDetailHTML(p);
  const tabs=[...html.matchAll(/role="tab" id="([^"]+)" aria-controls="([^"]+)" aria-selected="(true|false)"/g)];
  assert.equal(tabs.length,p.landContent==='land-project'?5:4);
  assert.equal(tabs.filter(t=>t[3]==='true').length,1);
  for(const tab of tabs)assert.ok(html.includes('id="'+tab[2]+'"'));
  assert.ok(!html.includes('data-terrain-preparation='));
 }
});
test('Consultation choices are allowlisted and never submit a request or invent a confirmed appointment',()=>{
 for(const key of ['informacion','visita','negociacion']){assert.equal(terrainConsultPreset(key).intent,'Solicitar información');assert.ok(terrainConsultPreset(key).message.length>10);}
 for(const key of ['__proto__','constructor','other',''])assert.equal(terrainConsultPreset(key),null);
 const html=terrainConsultHTML(properties[0]);assert.equal((html.match(/consulta=/g)||[]).length,3);assert.ok(!html.includes('<form'));
});

test('El terreno abre con un solo mapa y permite ver las fotos después',()=>{
 const map='<div data-test-map></div>';
 for(const p of properties.filter(p=>p.type==='terreno')){
  const html=terrainDetailHTML(p,{map});
  assert.equal((html.match(/data-test-map/g)||[]).length,1);
  assert.match(html,/aria-pressed="true" aria-controls="tu-media-mapa" data-terrain-media="mapa"/);
  assert.match(html,/data-terrain-media-panel="imagenes" hidden/);
  assert.ok(html.indexOf('data-test-map')<html.indexOf('class="tu-photo"'));
  assert.match(html,/Polígono ilustrativo · No predial/);
  assert.match(html,/data-terrain-media-go="mapa"/);
 }
});
