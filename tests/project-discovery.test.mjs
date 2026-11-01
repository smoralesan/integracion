import test from 'node:test';
import assert from 'node:assert/strict';
import {properties} from '../web/opportunity-examples.js';
import {matchesProjectDiscovery,projectStage,projectKind,projectFiltersHTML} from '../web/project-discovery.js';
import {catalogOrderHTML} from '../web/catalog-order.js';
import {catalogRouteState} from '../web/catalog-navigation.js';
import {normalizeSearchContext} from '../web/search-journey.js';
test('project filters combine kind, stage and required specialty while preserving terrain records',()=>{
 const office=properties.find(p=>p.id==='PRO-DEMO-003');assert.equal(projectKind(office),'Oficinas');assert.equal(projectStage(office),'Factibilidad');assert.ok(matchesProjectDiscovery(office,{projectKind:'Oficinas',projectStage:'Factibilidad',projectSpecialty:'Abogados'}));assert.equal(matchesProjectDiscovery(office,{projectKind:'Hotelero'}),false);assert.ok(matchesProjectDiscovery(properties[0],{projectKind:'Hotelero'}));
});
test('project controls do not offer terrain negotiation or square metre ordering',()=>{
 const html=projectFiltersHTML(properties,{});assert.match(html,/Especialidad requerida/);assert.ok(!html.includes('Venta o aporte'));assert.ok(!catalogOrderHTML('',{project:true}).includes('Precio/m²'));
});
test('return snapshots retain project criteria and detect changed pagination filters',()=>{
 const filters={...catalogRouteState('#/oportunidades?tipo=proyecto'),projectStage:'Diseño',projectKind:'Hotelero',projectSpecialty:'Operador'};const context=normalizeSearchContext({version:1,at:Date.now(),hash:'#/oportunidades?tipo=proyecto',filters});assert.equal(context.filters.projectStage,'Diseño');assert.equal(context.filters.projectSpecialty,'Operador');
});
test('unknown projects are not silently classified as residential or concept',()=>{
 assert.equal(projectStage({label:'Proyecto residencial en diseño'}),'Sin especificar');assert.equal(projectKind({title:'Hotel de ejemplo'}),'Sin especificar');for(const p of properties.filter(p=>p.type==='proyecto')){assert.notEqual(projectStage(p),'Sin especificar');assert.notEqual(projectKind(p),'Sin especificar');}
});
test('project search URLs restore combined criteria without a session snapshot',async()=>{
 const {projectCriteriaHash,projectCriteriaSummary,clearProjectCriteria}=await import('../web/project-discovery.js');
 const criteria={projectKind:'Oficinas',projectStage:'Factibilidad',projectSpecialty:'Abogados',query:'Bogotá'},hash=projectCriteriaHash('#/oportunidades?tipo=proyecto&vista=mapa',criteria),restored=catalogRouteState(hash);
 for(const [key,value]of Object.entries(criteria))assert.equal(restored[key],value);assert.equal(restored.view,'both');assert.match(projectCriteriaSummary(restored),/Abogados/);assert.match(projectCriteriaSummary(restored),/Oficinas/);
 const clear=clearProjectCriteria();assert.deepEqual(clear.zone,[]);assert.deepEqual(clear.sectors,[]);assert.equal(clear.placeBounds,null);assert.equal(clear.drawing,false);assert.equal(clear.catalogPage,1);
});
test('keyword lookup includes neighborhood, description and requested specialists',async()=>{
 const {matchesOpportunityFilters}=await import('../web/opportunity-filters.js');const row={type:'terreno',neighborhood:'La Esmeralda',description:'Acceso pavimentado',need:'Diseñador hidráulico'};
 for(const query of ['esmeralda','pavimentado','hidraulico'])assert.ok(matchesOpportunityFilters(row,{query}));assert.equal(matchesOpportunityFilters(row,{query:'inexistente'}),false);
});
