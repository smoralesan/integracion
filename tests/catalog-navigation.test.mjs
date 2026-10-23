import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogRouteState,savedSearchHash,searchLocationLabel} from '../web/catalog-navigation.js';
import {landSearchHTML} from '../web/land-search.js';
test('Fresh terrain searches clear unrelated filters while honoring their own category and municipality',()=>{
 const previous={type:'proyecto',reactivationFilter:'only',landContent:'land-project',searchDepartment:'11',searchMunicipality:'11001',query:'Bogotá',min:'5000',maxPrice:'2500000000',zone:[[-74,4],[-73,4],[-73,5]],placeBounds:[-75,3,-73,5]};
 const fresh={...previous,...catalogRouteState('#/buscar')};
 assert.equal(fresh.type,'terreno');assert.equal(fresh.landContent,'land-only');assert.equal(fresh.searchMunicipality,'');assert.equal(fresh.searchDepartment,'');assert.equal(fresh.query,'');assert.equal(fresh.reactivationFilter,'');assert.equal(fresh.min,'');assert.equal(fresh.maxPrice,'');assert.deepEqual(fresh.zone,[]);assert.equal(fresh.placeBounds,null);
 const located=catalogRouteState('#/buscar?contenido=con-proyecto&municipio=11001&uso=mixto');assert.equal(located.landContent,'land-project');assert.equal(located.searchMunicipality,'11001');assert.equal(located.searchDepartment,'11');assert.equal(located.intendedUse,'mixto');
});
test('Project and reactivation routes have deterministic disjoint states and ignore terrain-only filters',()=>{
 const projects=catalogRouteState('#/buscar?tipo=proyecto&municipio=11001&uso=industrial&zona=1');assert.equal(projects.type,'proyecto');assert.equal(projects.reactivationFilter,'exclude');assert.equal(projects.landContent,'');assert.equal(projects.searchMunicipality,'');assert.equal(projects.intendedUse,'');assert.equal(projects.drawing,false);
 for(const hash of ['#/proyectos-siniestrados','#/oportunidades?tipo=proyecto&estado=reactivacion','#/buscar?tipo=proyecto&estado=reactivacion'])assert.equal(catalogRouteState(hash).reactivationFilter,'only');
 assert.equal(catalogRouteState('#/oportunidades').type,'');assert.equal(catalogRouteState('#/oportunidades').reactivationFilter,'');assert.equal(catalogRouteState('#/oportunidades?tipo=terreno').landContent,'');
});
test('Drawing links, directories and all-terrain choices preserve explicit scope',()=>{
 const drawing=catalogRouteState('#/buscar?contenido=con-proyecto&zona=1');assert.equal(drawing.landContent,'land-project');assert.equal(drawing.drawing,true);assert.equal(drawing.view,'both');
 assert.equal(catalogRouteState('#/buscar?contenido=todos').landContent,'');
 const directory=catalogRouteState('#/oportunidades?tipo=terreno&ciudad=Bogot%C3%A1&contenido=solo-terreno');assert.equal(directory.directoryScope.city,'Bogotá');assert.equal(directory.landContent,'land-only');
 assert.equal(catalogRouteState('#/buscar?municipio=invalid&uso=__proto__').searchMunicipality,'');assert.equal(catalogRouteState('#/buscar?uso=invalid').intendedUse,'');
});
test('Saved search links include reactivation and territory and their summaries name the selected municipality',()=>{
 const record={type:'terreno',landContent:'land-project',searchDepartment:'11',searchMunicipality:'11001',intendedUse:'mixto'};const hash=savedSearchHash(record),restored=catalogRouteState(hash);for(const key of Object.keys(record))assert.equal(restored[key],record[key]);assert.equal(searchLocationLabel(record),'Bogotá, D. C.');assert.equal(searchLocationLabel({searchDepartment:'13'}),'Bolívar');assert.equal(searchLocationLabel({}),'Sin municipio específico');
 const project={type:'proyecto',reactivationFilter:'only',searchMunicipality:'11001'};assert.equal(catalogRouteState(savedSearchHash(project)).reactivationFilter,'only');assert.ok(!savedSearchHash(project).includes('municipio'));
});
test('Terrain scope select has exactly one initial selected choice, including all terrains',()=>{
 for(const state of [{},{type:'terreno',landContent:''},{type:'terreno',landContent:'land-project'},{type:'terreno',landContent:'land-only'}]){const select=landSearchHTML(state).split('name="landContent">')[1].split('</select>')[0];assert.equal((select.match(/selected/g)||[]).length,1);}
});
