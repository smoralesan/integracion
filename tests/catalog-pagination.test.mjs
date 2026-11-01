import {matchesDirectory,readDirectoryScope} from '../web/footer-directory.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {properties} from '../web/opportunity-examples.js';
import {additionalTerrainExamples} from '../web/additional-terrain-examples.js';
import {demoTerrainGeometry} from '../web/terrain-parcels.js';
import {getMunicipality,getDepartment} from '../web/colombia-locations.js';
import {describeGeometry} from '../lib/parcel.js';
import {catalogPage,catalogPaginationKey,catalogPageHash,catalogPaginationHTML,quickPaginationHTML} from '../web/catalog-pagination.js';
import {catalogRouteState} from '../web/catalog-navigation.js';
import {normalizeSearchContext} from '../web/search-journey.js';
const lots=properties.filter(p=>p.type==='terreno');
test('the demonstration contains exactly 18 distinct lots, preserving both associated construction projects',()=>{
 assert.equal(matchesDirectory(lots.find(lot=>lot.id==='TER-DEMO-007'),readDirectoryScope('#/oportunidades?tipo=terreno&ciudad=Cali')),true);
 assert.equal(lots.length,18);assert.equal(new Set(properties.map(p=>p.id)).size,properties.length);assert.equal(lots.filter(p=>p.landContent==='land-only').length,16);assert.equal(lots.filter(p=>p.landContent==='land-project').length,2);
 for(const lot of additionalTerrainExamples){assert.equal(getMunicipality(lot.municipality_code).name,lot.city);assert.equal(getDepartment(lot.department_code).name,lot.region);const geometry=demoTerrainGeometry(lot.id),info=describeGeometry(geometry);assert.ok(info.areaM2>0);assert.ok(info.vertices>=5);assert.ok(info.areaM2/lot.area>.95&&info.areaM2/lot.area<1.05);assert.match(lot.description,/simulado/);}
});
test('three pages expose every lot exactly once and do not mutate the underlying result set',()=>{
 const before=structuredClone(lots),pages=[1,2,3].map(page=>catalogPage(lots,page));assert.deepEqual(pages.map(p=>p.items.length),[6,6,6]);assert.deepEqual(pages.map(p=>[p.from,p.to]),[[1,6],[7,12],[13,18]]);assert.equal(new Set(pages.flatMap(p=>p.items.map(item=>item.id))).size,18);assert.deepEqual(lots,before);
 const bare=lots.filter(p=>p.landContent==='land-only');assert.equal(catalogPage(bare,3).items.length,4);
});
test('invalid and out-of-range page requests clamp safely, including an empty or newly filtered list',()=>{
 for(const value of [0,-1,'bad',Infinity,1.5])assert.equal(catalogPage(lots,value).page,1);assert.equal(catalogPage(lots,999).page,3);assert.equal(catalogPage(lots.slice(0,2),3).page,1);const empty=catalogPage([],3);assert.equal(empty.from,0);assert.equal(empty.to,0);assert.equal(empty.page,1);assert.equal(catalogPaginationHTML(empty),'');
});
test('filter changes invalidate the pagination context, while list and map views preserve it',()=>{
 const state=catalogRouteState('#/buscar?contenido=todos&pagina=2'),key=catalogPaginationKey(state);assert.equal(state.catalogPage,2);assert.equal(state.catalogPageKey,key);assert.equal(catalogPaginationKey({...state,view:'both',mapStyle:'satellite'}),key);
 for(const change of [{query:'Medellín'},{searchMunicipality:'05001'},{mode:'Aporte'},{landContent:'land-only'},{zone:[[-75,6],[-74,6],[-74,7]]}])assert.notEqual(catalogPaginationKey({...state,...change}),key);
});
test('the return-to-results context retains the page only when its saved filters still match',()=>{
 const now=Date.parse('2026-11-01T13:00:00Z'),filters=catalogRouteState('#/buscar?contenido=todos&pagina=3'),input={version:1,at:now,hash:'#/buscar?contenido=todos&pagina=3',filters};assert.equal(normalizeSearchContext(input,now).filters.catalogPage,3);assert.equal(normalizeSearchContext({...input,filters:{...filters,query:'Cali'}},now).filters.catalogPage,1);
});
test('page URLs keep the category and municipality; accessible controls identify the current and disabled pages',()=>{
 const hash='#/buscar?contenido=solo-terreno&municipio=05001',second=catalogPageHash(hash,2);assert.match(second,/contenido=solo-terreno/);assert.match(second,/municipio=05001/);assert.match(second,/pagina=2/);assert.equal(catalogPageHash(second,1),hash);
 const html=catalogPaginationHTML(catalogPage(lots,2));assert.equal((html.match(/aria-current="page"/g)||[]).length,1);assert.match(html,/aria-label="Página 2" aria-current="page"/);assert.match(quickPaginationHTML(catalogPage(lots,1)),/aria-label="Página anterior" disabled/);assert.match(quickPaginationHTML(catalogPage(lots,3)),/aria-label="Página siguiente" disabled/);
});

test('map browsing allows 24 results per page while list browsing retains six',async()=>{
 const {catalogPageSize,catalogViewHash}=await import('../web/catalog-pagination.js');
 assert.equal(catalogPageSize({view:'both'}),24);assert.equal(catalogPageSize({view:'list'}),6);
 const examples=Array.from({length:53},(_,i)=>({id:i})),pages=[1,2,3].map(page=>catalogPage(examples,page,catalogPageSize({view:'both'})));
 assert.deepEqual(pages.map(p=>p.items.length),[24,24,5]);assert.deepEqual(pages.flatMap(p=>p.items),examples);assert.equal(catalogPage(lots,1,catalogPageSize({view:'both'})).items.length,18);
 const hash=catalogViewHash('#/buscar?contenido=todos&orden=m2-asc','both');assert.equal(catalogRouteState(hash).view,'both');assert.match(hash,/orden=m2-asc/);assert.equal(catalogViewHash(hash,'list'),'#/buscar?contenido=todos&orden=m2-asc');
});
