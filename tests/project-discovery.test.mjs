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
