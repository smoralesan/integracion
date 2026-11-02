import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogRecoveryOptions,catalogRecoveryHTML} from '../web/catalog-recovery.js';
import {properties} from '../web/opportunity-examples.js';
import {matchesCatalog} from '../web/catalog-match.js';
import {removeFilter} from '../web/ux-flow.js';
import {contactJourneyHTML} from '../web/opportunity-journey-ux.js';
const base=()=>({type:'terreno',landContent:'land-only',query:'',min:'',max:'',mode:'',maxPrice:'1',zone:[],sectors:[],directoryScope:null,searchDepartment:'',searchMunicipality:'',intendedUse:''});
test('las sugerencias cuentan solo los ejemplos que aparecerían al retirar un filtro y conservan el resto',()=>{
 const state=base(),before=structuredClone(state);assert.equal(properties.filter(item=>matchesCatalog(item,state)).length,0);
 const options=catalogRecoveryOptions(properties,state);assert.equal(options[0].key,'maxPrice');assert.ok(options[0].count>0);
 for(const option of options){const next=structuredClone(state);removeFilter(next,option.key);assert.equal(option.count,properties.filter(item=>matchesCatalog(item,next)).length);assert.equal(next.type,'terreno');assert.equal(next.landContent,'land-only');}
 assert.deepEqual(state,before);
});
test('si varios filtros bloquean resultados no se prometen coincidencias ni inventario disponible',()=>{
 const state={...base(),query:'<sin coincidencias>',min:'9999999999999'};const options=catalogRecoveryOptions(properties,state);assert.ok(options.every(option=>option.count===0));const html=catalogRecoveryHTML(properties,state);assert.match(html,/uno o varios filtros/);assert.match(html,/&lt;sin coincidencias&gt;/);assert.match(html,/no a inventario disponible/);assert.doesNotMatch(html,/>\d+ ejemplos</);
});
test('el contacto distingue la consulta real de la ficha de ejemplo y explica el seguimiento',()=>{
 const real=contactJourneyHTML(true),demo=contactJourneyHTML(false);assert.match(real,/La recibe el equipo de Integración/);assert.match(real,/Mis intereses/);assert.match(real,/no reserva el lote/);assert.match(demo,/No se contacta a un propietario real/);assert.doesNotMatch(demo,/La recibe el equipo de Integración/);
});
