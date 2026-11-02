import test from 'node:test';
import assert from 'node:assert/strict';
import {properties} from '../web/opportunity-examples.js';
import {terrainDetailHTML} from '../web/terrain-detail.js';
import {formSteps} from '../web/ux-flow.js';
import {terrainSearchLabel} from '../web/terrain-search.js';
import {catalogRouteState} from '../web/catalog-navigation.js';
test('las fichas usan lote en el texto visible y conservan rutas e identificadores compatibles',()=>{
 const lots=properties.filter(item=>item.type==='terreno');assert.equal(lots.length,18);
 for(const lot of lots){const html=terrainDetailHTML(lot),visible=html.replace(/<[^>]*>/g,' ');assert.doesNotMatch(visible,/\bterrenos?\b/i);assert.match(html,/#\/oportunidades\?tipo=terreno/);assert.equal(lot.type,'terreno');}
 assert.equal(catalogRouteState('#/buscar?contenido=solo-terreno').type,'terreno');assert.equal(catalogRouteState('#/buscar?contenido=solo-terreno').landContent,'land-only');
 for(const label of [...formSteps('terreno'),terrainSearchLabel('land-only'),terrainSearchLabel('land-project')])assert.doesNotMatch(label,/\bterrenos?\b/i);
});
