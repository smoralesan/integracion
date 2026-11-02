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
test('municipality and department replace previous URL values rather than retaining them',()=>{
 const hash=searchLinkHash('#/buscar?tipo=terreno&municipio=05001&departamento_codigo=05&uso=industrial',{type:'terreno',searchMunicipality:'11001',searchDepartment:'11',intendedUse:'residencial'}),restored=catalogRouteState(hash);assert.equal(restored.searchMunicipality,'11001');assert.equal(restored.searchDepartment,'11');assert.equal(restored.intendedUse,'residencial');
});
test('clearing location and directory criteria removes every obsolete geographic parameter',()=>{
 const hash=searchLinkHash('#/buscar?tipo=terreno&municipio=05001&departamento_codigo=05&uso=industrial&ciudad=Medell%C3%ADn&departamento=Antioquia&lote=rural&poligono=[]&sectores=[]&limites=[]',{}),params=new URLSearchParams(hash.split('?')[1]);for(const key of ['municipio','departamento_codigo','uso','ciudad','departamento','lote','poligono','sectores','limites'])assert.equal(params.has(key),false);
});
test('public records and examples share sector, polygon and map-bounds restrictions',async()=>{
 const {matchesCatalog}=await import('../web/catalog-match.js');const base={...catalogRouteState('#/buscar?contenido=todos'),zone:[[-75,4],[-73,4],[-73,6],[-75,6]],sectors:['interior'],placeBounds:[-74.5,4.5,-73.5,5.5]},inside={kind:'terreno',coordinates:[-74,5],sector:'interior',title:'Lote'},outside={...inside,coordinates:[-76,5]};assert.ok(matchesCatalog(inside,base));assert.equal(matchesCatalog(outside,base),false);assert.equal(matchesCatalog({...inside,sector:'caribe'},base),false);assert.equal(matchesCatalog({...inside,coordinates:undefined,locationPin:{coordinates:[-74,5]}},base),false);assert.ok(matchesCatalog({...inside,type:'terreno',kind:undefined},base));assert.ok(matchesCatalog({...inside,coordinates:undefined},{...base,zone:[],sectors:[],placeBounds:null}));
});
test('clearing a drawing removes its activation flag before a fresh reload',()=>{
 const hash=searchLinkHash('#/buscar?contenido=todos&zona=1&municipio=05001',{type:'terreno',drawing:false,zone:[],sectors:[],placeBounds:null});assert.equal(new URLSearchParams(hash.split('?')[1]).has('zona'),false);assert.equal(catalogRouteState(hash).drawing,false);assert.equal(catalogRouteState(searchLinkHash('#/buscar',{type:'terreno',drawing:true})).drawing,true);
});
test('project entry from the home always produces a self-contained project URL',async()=>{
 const {projectCriteriaHash}=await import('../web/project-discovery.js');const state={type:'proyecto',reactivationFilter:'exclude',projectKind:'Oficinas',projectSpecialty:'Abogados'};
 const hash=projectCriteriaHash(searchLinkHash('#/oportunidades',state),state),restored=catalogRouteState(hash);assert.equal(restored.type,'proyecto');assert.equal(restored.projectKind,'Oficinas');assert.equal(restored.projectSpecialty,'Abogados');assert.equal(restored.reactivationFilter,'exclude');
});
test('asynchronous publication completion updates only its region and preserves pending edits',async()=>{
 const {updateCatalogPublications}=await import('../web/catalog-publications-update.js');const filter={department:'05',municipality:'05001',query:''},region={innerHTML:'Cargando…'},root={querySelector:selector=>selector==='[data-catalog-publications]'?region:null};
 let resolve;const response=new Promise(r=>resolve=r);const pending=response.then(html=>updateCatalogPublications(root,html));filter.department='11';filter.municipality='';filter.query='Texto aún sin aplicar';resolve('<article>Publicación recibida</article>');assert.equal(await pending,true);assert.deepEqual(filter,{department:'11',municipality:'',query:'Texto aún sin aplicar'});assert.match(region.innerHTML,/Publicación recibida/);assert.equal(updateCatalogPublications({querySelector:()=>null},'old result'),false);
});
