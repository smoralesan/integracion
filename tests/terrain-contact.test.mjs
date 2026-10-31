import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainConsultOptions,consultationKey,consultationDraft,terrainConsultPreset,terrainLocationStatus} from '../web/terrain-contact.js';
import {terrainDetailHTML,terrainConsultHTML} from '../web/terrain-detail.js';
import {SalesUI} from '../web/sales-ui.js';
import {publicOpportunityHTML} from '../web/opportunity-experience.js';
const keys=p=>terrainConsultOptions(p,{secondary:false}).map(([key])=>key);
test('contact actions follow the actual offered negotiation without manufacturing an alternative',()=>{
 assert.deepEqual(keys({negotiation:'sale'}),['compra','informacion']);
 assert.deepEqual(keys({negotiation:'contribution'}),['aporte','informacion']);
 assert.deepEqual(keys({negotiation:'open'}),['compra','aporte','informacion']);
 assert.deepEqual(keys({mode:'Venta o aporte'}),['compra','aporte','informacion']);
 assert.deepEqual(keys({kind:'proyecto',negotiation:'sale'}),['informacion']);
 assert.deepEqual(keys({}),['informacion']);
 assert.equal(consultationKey('aporte',{negotiation:'sale'}),'informacion');
 assert.equal(consultationKey('__proto__',{negotiation:'open'}),'informacion');
});
test('switching a consultation updates its intent and automatic message, preserving a custom message',()=>{
 const offer={negotiation:'open'},initial=terrainConsultPreset('informacion').message;
 const buy=consultationDraft({message:initial},'compra',offer);assert.equal(buy.intent,'Comprar');assert.equal(buy.message,terrainConsultPreset('compra').message);
 const custom='Quisiera evaluar un aporte con un programa por etapas.';
 const contribution=consultationDraft({message:custom},'aporte',offer);assert.equal(contribution.intent,'Evaluar aporte');assert.equal(contribution.message,custom);assert.equal(contribution.automatic,false);
});
test('location labels distinguish a point, declared perimeter, illustrative geometry and unshared location',()=>{
 assert.equal(terrainLocationStatus({geometry:{}}).label,'Perímetro declarado');
 assert.equal(terrainLocationStatus({geometry:{},demo:true}).label,'Polígono ilustrativo');
 assert.equal(terrainLocationStatus({pin:[-75,6]}).label,'Pin aproximado');
 assert.match(terrainLocationStatus({pin:[-75,6]}).detail,/No define los linderos/);
 assert.equal(terrainLocationStatus().label,'Perímetro no compartido');
});
test('the summary preserves barrio and offer scope without introducing a project or verified perimeter',()=>{
 const p={id:'OTHER',type:'terreno',title:'Ejemplo',city:'Medellín',region:'Antioquia',neighborhood:'Barrio de prueba',area:5200,mode:'Venta',price:2000000000};
 const html=terrainDetailHTML(p);assert.match(html,/Resumen del terreno/);assert.match(html,/Barrio de prueba/);assert.match(html,/Se ofrece/);assert.match(html,/Solo terreno/);assert.match(html,/Ver guardados/);assert.match(html,/Ver comparación/);assert.doesNotMatch(html,/Perímetro verificado/);
 assert.doesNotMatch(terrainConsultHTML(p),/consulta=aporte/);
});
test('source negotiation preselects the matching commercial intent, and rejects unsupported deep links',()=>{
 const ui=new SalesUI();ui.profile={};ui.options={sourceId:'id',consultation:'compra'};ui.source={kind:'publication',snapshot:{kind:'terreno',negotiation:'sale',title:'Terreno',city:'Medellín',region:'Antioquia'}};
 const buy=ui.formHTML();assert.match(buy,/name="intent" value="Comprar"/);assert.doesNotMatch(buy,/data-sales-consult="aporte"/);assert.doesNotMatch(buy,/<option value="Evaluar aporte"/);
 ui.options.consultation='aporte';const fallback=ui.formHTML();assert.match(fallback,/name="intent" value="Solicitar información"/);
});
test('authorized terrain summary respects missing neighborhood and private perimeter without inventing either',()=>{
 const html=publicOpportunityHTML({id:'2f8ed48e-7c24-41ae-b92c-45c79a3300e2',kind:'terreno',title:'Terreno',city:'Medellín',region:'Antioquia',negotiation:'sale',availability:'available'});
 assert.match(html,/Resumen del terreno/);assert.match(html,/Perímetro no compartido/);assert.match(html,/No compartido/);assert.match(html,/data-jr-negotiation="sale"/);assert.match(html,/data-jr-kind="terreno"/);assert.doesNotMatch(html,/api\.mapbox\.com/);
});
