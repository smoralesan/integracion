import test from 'node:test';
import assert from 'node:assert/strict';
import {orderCatalog,pricePerM2,normalizeCatalogOrder,catalogOrderHash} from '../web/catalog-order.js';
import {catalogPage,catalogPaginationKey} from '../web/catalog-pagination.js';
import {catalogRouteState,savedSearchHash} from '../web/catalog-navigation.js';
import {normalizeSearchContext} from '../web/search-journey.js';
import {properties} from '../web/opportunity-examples.js';
const lots=properties.filter(p=>p.type==='terreno');
test('area ordering spans all three pages and reverses without mutating the examples',()=>{
 const before=structuredClone(lots),asc=orderCatalog(lots,'area-asc'),desc=orderCatalog(lots,'area-desc');
 assert.deepEqual(asc.map(x=>x.area),lots.map(x=>x.area).sort((a,b)=>a-b));assert.deepEqual(desc.map(x=>x.area),asc.map(x=>x.area).reverse());assert.deepEqual(lots,before);
 const pages=[1,2,3].flatMap(page=>catalogPage(asc,page).items);assert.deepEqual(pages,asc);assert.equal(new Set(pages.map(x=>x.id)).size,18);
});
test('total COP price orders in both directions with unpriced contributions at the end',()=>{
 for(const mode of ['precio-asc','precio-desc']){const rows=orderCatalog(lots,mode),priced=rows.filter(x=>x.price>0),missing=rows.filter(x=>!(x.price>0));assert.deepEqual(rows.slice(-missing.length),missing);assert.deepEqual(priced.map(x=>x.price),priced.map(x=>x.price).sort((a,b)=>mode.endsWith('asc')?a-b:b-a));assert.equal(missing.length,3);}
});
test('unit price uses declared square metres, differs from total price and excludes invalid or other-currency amounts',()=>{
 const rows=[{id:'large',area:1000,price:100000},{id:'small',area:100,price:50000},{id:'unknown',area:0,price:20000},{id:'usd',area:100,price:30000,currency:'USD'},{id:'bad',area:NaN,price:Infinity},{id:'missing',area:200,price:null}];
 assert.equal(pricePerM2(rows[0]),100);assert.equal(pricePerM2(rows[1]),500);assert.equal(pricePerM2(rows[2]),null);
 assert.deepEqual(orderCatalog(rows,'m2-asc').map(x=>x.id),['large','small','unknown','usd','bad','missing']);assert.deepEqual(orderCatalog(rows,'m2-desc').map(x=>x.id),['small','large','unknown','usd','bad','missing']);
 assert.equal(orderCatalog(rows,'precio-asc')[0].id,'unknown');
});
test('ties remain stable; invalid order returns an independent copy in original order',()=>{
 const rows=[{id:'b',area:10},{id:'a',area:10},{id:'z',area:null}];assert.deepEqual(orderCatalog(rows,'area-desc'),rows);assert.deepEqual(orderCatalog(rows,'unexpected'),rows);assert.notEqual(orderCatalog(rows,''),rows);assert.equal(normalizeCatalogOrder('<script>'),'');
});
test('ordering survives deep links, saved searches and returning from details with its page',()=>{
 const hash='#/buscar?contenido=todos&orden=m2-desc&pagina=2',filters=catalogRouteState(hash),now=Date.now();assert.equal(filters.catalogOrder,'m2-desc');assert.equal(filters.catalogPage,2);
 assert.match(savedSearchHash(filters),/orden=m2-desc/);const restored=normalizeSearchContext({version:1,hash,at:now,filters},now);assert.equal(restored.filters.catalogOrder,'m2-desc');assert.equal(restored.filters.catalogPage,2);
 assert.notEqual(catalogPaginationKey({...filters,catalogOrder:'area-asc'}),filters.catalogPageKey);assert.equal(normalizeSearchContext({version:1,hash,at:now,filters:{...filters,catalogOrder:'area-asc'}},now).filters.catalogPage,1);
});
test('order URLs preserve geographic and category criteria and remove the initial-order parameter',()=>{
 const hash='#/buscar?contenido=solo-terreno&municipio=05001&pagina=2';assert.equal(catalogOrderHash(hash,'precio-asc'),hash+'&orden=precio-asc');assert.equal(catalogOrderHash(hash+'&orden=precio-asc',''),hash);assert.equal(catalogRouteState('#/buscar?orden=bad').catalogOrder,'');
});
