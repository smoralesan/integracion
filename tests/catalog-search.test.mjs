import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogTerritory,readCatalogTerritory,drawingTerritory,catalogSearchHTML} from '../web/catalog-search.js';
import {activeFilters,removeFilter,filterChipsHTML} from '../web/ux-flow.js';
const base=()=>({searchDepartment:'05',searchMunicipality:'05001',intendedUse:'residencial',type:'terreno',landContent:'land-only',mode:'Venta',min:'100',max:'20000',maxPrice:'5000000000',query:'',zone:[],sectors:[],directoryScope:null});
test('directory links resolve official municipality and department controls',()=>{
 assert.deepEqual(catalogTerritory({directoryScope:{city:'Medellín'}}),{searchDepartment:'05',searchMunicipality:'05001'});
 assert.deepEqual(catalogTerritory({directoryScope:{department:'Antioquia'}}),{searchDepartment:'05',searchMunicipality:''});
 assert.deepEqual(catalogTerritory({directoryScope:{city:'No existe'}}),{searchDepartment:'',searchMunicipality:''});
});
test('territory validation rejects mismatched municipalities and preserves independent land type',()=>{
 const state={...base(),directoryScope:{city:'Medellín',department:'Antioquia',landType:'Urbano'}};
 const before=structuredClone(state);
 assert.throws(()=>readCatalogTerritory(state,{searchDepartment:'08',searchMunicipality:'05001'}));
 assert.throws(()=>readCatalogTerritory(state,{intendedUse:'arbitrario'}));
 const result=readCatalogTerritory(state,{searchDepartment:'08',searchMunicipality:'08001',intendedUse:'logistico'});
 assert.equal(result.locationChanged,true);assert.equal(result.filters.searchMunicipality,'08001');
 assert.deepEqual(result.filters.directoryScope,{city:'',department:'',landType:'Urbano'});
 assert.deepEqual(state,before);
 assert.equal(readCatalogTerritory(state,{searchDepartment:'',searchMunicipality:'',intendedUse:''}).filters.searchDepartment,'');
});
test('drawing replaces official territory while preserving commercial filters and previous zone for cancellation',()=>{
 const state={...base(),query:'Medellín',zone:[[1,2],[3,4],[5,6]],directoryScope:{city:'Medellín',landType:'Urbano'}};
 const next={...state,...drawingTerritory(state)};
 for(const key of ['mode','min','max','maxPrice','intendedUse','landContent','zone'])assert.deepEqual(next[key],state[key]);
 assert.equal(next.query,'');assert.equal(next.searchMunicipality,'');assert.equal(next.directoryScope.landType,'Urbano');assert.equal(next.directoryScope.city,'');
});
test('removable territory and use chips broaden only the selected criteria',()=>{
 const state=base();assert.ok(activeFilters(state).some(([key,label])=>key==='searchMunicipality'&&label==='Medellín'));
 assert.equal(removeFilter(state,'searchMunicipality'),true);assert.equal(state.searchDepartment,'05');
 assert.equal(removeFilter(state,'searchDepartment'),true);assert.equal(state.searchDepartment,'');
 assert.equal(removeFilter(state,'intendedUse'),true);assert.equal(state.intendedUse,'');
 assert.equal(state.mode,'Venta');assert.equal(state.min,'100');assert.equal(state.maxPrice,'5000000000');
 assert.equal(removeFilter(state,'__proto__'),false);
});
test('single search form includes safe advanced fields associated to the same form',()=>{
 const html=catalogSearchHTML({state:{...base(),query:'"><script>'},icon:()=>'',priceLimits:[],filterChipsHTML});
 assert.equal((html.match(/<form /g)||[]).length,1);assert.equal((html.match(/name="query"/g)||[]).length,1);
 assert.match(html,/name="query" form="opportunity-filters"/);assert.match(html,/data-catalog-draw/);assert.doesNotMatch(html,/<script>/);
});
