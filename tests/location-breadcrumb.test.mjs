import test from 'node:test';
import assert from 'node:assert/strict';
import {locationBreadcrumbs,locationBreadcrumbHTML} from '../web/location-breadcrumb.js';
import {catalogRouteState} from '../web/catalog-navigation.js';
import {terrainDetailHTML} from '../web/terrain-detail.js';
import {properties} from '../web/opportunity-examples.js';
test('los enlaces de departamento y municipio abren una búsqueda con los códigos oficiales',()=>{
 const location={city:'Cartagena',region:'Bolívar'},crumbs=locationBreadcrumbs(location);assert.equal(crumbs.length,2);
 assert.equal(catalogRouteState(crumbs[0].href).searchDepartment,'13');assert.equal(catalogRouteState(crumbs[1].href).searchMunicipality,'13001');assert.equal(catalogRouteState(crumbs[1].href).landContent,'');
 const html=terrainDetailHTML(properties.find(p=>p.id==='TER-DEMO-001'));assert.match(html,/href="#\/buscar\?contenido=todos&amp;municipio=13001">Cartagena<\/a>/);assert.match(html,/aria-current="page">TER-DEMO-001/);
});
test('municipios homónimos usan su departamento y ubicaciones no resueltas usan texto sin inventar códigos',()=>{
 const crumbs=locationBreadcrumbs({city:'La Unión',region:'Valle del Cauca'});assert.equal(catalogRouteState(crumbs.at(-1).href).searchMunicipality,'76400');
 const fallback=locationBreadcrumbs({city:'<Municipio de prueba>'});assert.equal(fallback.length,1);assert.equal(catalogRouteState(fallback[0].href).query,'<Municipio de prueba>');assert.match(locationBreadcrumbHTML({city:'<Municipio de prueba>'}),/&lt;Municipio de prueba&gt;/);
 assert.deepEqual(locationBreadcrumbs({}),[]);
});
test('los enlaces geográficos de proyectos mantienen la búsqueda en proyectos',()=>{
 for(const crumb of locationBreadcrumbs({city:'Medellín',region:'Antioquia'},{project:true})){const state=catalogRouteState(crumb.href);assert.equal(state.type,'proyecto');assert.equal(state.query,crumb.label);}
});
