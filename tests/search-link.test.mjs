import test from 'node:test';import assert from 'node:assert/strict';
import {searchLinkHash,readSearchLink,savedSearchView} from '../web/search-link.js';
import {catalogRouteState,savedSearchHash} from '../web/catalog-navigation.js';
import {matchesProjectDiscovery,projectFiltersHTML} from '../web/project-discovery.js';
test('complete terrain search survives a fresh URL, including geometry and bounds',()=>{
 const state={type:'terreno',landContent:'land-only',view:'both',query:'Esmeralda',mode:'Venta',min:'5000',max:'20000',maxPrice:'5000000000',zone:[[-75,10],[-74,10],[-74,11]],sectors:['interior'],placeBounds:[-76,9,-73,12]};const restored=catalogRouteState(savedSearchHash(state));for(const key of ['query','mode','min','max','maxPrice','zone','sectors','placeBounds','view','landContent'])assert.deepEqual(restored[key],state[key]);
});
test('invalid shared coordinates and numeric filters do not become valid restrictions',()=>{
 const s=readSearchLink(new URLSearchParams({poligono:'[[999,0],[0,1],[1,1]]',limites:'[1,2,0,3]',area_min:'-2',precio_max:'Infinity'}));assert.deepEqual(s.zone,[]);assert.equal(s.placeBounds,null);assert.equal(s.min,'');assert.equal(s.maxPrice,'');
});
test('clearing criteria removes their URL parameters and saved view preserves both modes',()=>{
 assert.equal(searchLinkHash('#/buscar?area_min=500&modalidad=Venta',{}),'#/buscar');assert.equal(savedSearchView({view:'list'}),'list');assert.equal(savedSearchView({view:'both'}),'both');assert.equal(savedSearchView({}),'list');
});
test('real project publications use the same stage, kind and specialty rules as examples',()=>{
 const p={kind:'proyecto',project_stage:'Diseño',project_kind:'Hotelero',need:'Operador hotelero'};assert.ok(matchesProjectDiscovery(p,{projectStage:'Diseño',projectKind:'Hotelero',projectSpecialty:'Operador'}));assert.equal(matchesProjectDiscovery(p,{projectKind:'Oficinas'}),false);
});
test('all supported project categories remain selectable without any examples',()=>{const html=projectFiltersHTML([],{});for(const value of ['Industrial','Logístico','Infraestructura','Sin especificar','Factibilidad'])assert.ok(html.includes('value="'+value+'"'));});

test('directory land classification is retained in a shared saved-search link',()=>{const restored=catalogRouteState(savedSearchHash({type:'terreno',view:'list',directoryScope:{city:'',department:'',landType:'Rural'}}));assert.equal(restored.directoryScope.landType,'Rural');});
