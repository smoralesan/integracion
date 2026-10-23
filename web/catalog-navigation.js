import {readDirectoryScope,directoryTitle} from './footer-directory.js';
import {getMunicipality,getDepartment} from './colombia-locations.js';
import {landUses} from './development-sectors.js';
import {terrainSearchFromQuery,terrainSearchQuery} from './terrain-search.js';
// A fresh navigation starts from its URL. Form submissions and explicit returns
// retain their own criteria in app.js, rather than inheriting an unrelated search.
export function catalogRouteState(hash){
 const [path,query='']=hash.slice(1).split('?'),params=new URLSearchParams(query);
 const directoryScope=path==='/oportunidades'?readDirectoryScope(hash):null;
 const type=path==='/proyectos-siniestrados'?'proyecto':directoryScope?'terreno':params.get('tipo')==='proyecto'?'proyecto':params.get('tipo')==='todos'?'':path==='/buscar'||params.get('tipo')==='terreno'?'terreno':'';
 const municipality=type==='terreno'?getMunicipality(params.get('municipio')):null;
 const department=type==='terreno'?(municipality?getDepartment(municipality.departmentCode):getDepartment(params.get('departamento_codigo'))):null;
 return {type,landContent:type==='terreno'?(terrainSearchFromQuery(params.get('contenido'))||(path==='/buscar'&&params.get('contenido')!=='todos'?'land-only':'')):'',reactivationFilter:type==='proyecto'?(path==='/proyectos-siniestrados'||params.get('estado')==='reactivacion'?'only':'exclude'):'',searchTypeExplicit:true,directoryScope,searchDepartment:department?.code||'',searchMunicipality:municipality?.code||'',intendedUse:type==='terreno'&&landUses.some(([key])=>key===params.get('uso'))?params.get('uso'):'',query:'',mode:'',min:'',max:'',maxPrice:'',zone:[],sectors:[],drawPoints:[],drawing:type==='terreno'&&params.get('zona')==='1',view:type==='terreno'&&params.get('zona')==='1'?'both':'list',mapPlace:null,placeBounds:null,placeResults:[],mapSearchText:'',pendingLocationQuery:'',searchCamera:null,searchCameraRevision:-1};
}
export function savedSearchHash(state){
 const params=new URLSearchParams({tipo:state.type||'todos'});
 if(state.type==='terreno')params.set('contenido',terrainSearchQuery(state.landContent)||'todos');
 if(state.type==='proyecto'&&state.reactivationFilter==='only')params.set('estado','reactivacion');
 if(state.type==='terreno'&&getMunicipality(state.searchMunicipality))params.set('municipio',state.searchMunicipality);
 if(state.type==='terreno'&&getDepartment(state.searchDepartment))params.set('departamento_codigo',state.searchDepartment);
 if(state.type==='terreno'&&landUses.some(([key])=>key===state.intendedUse))params.set('uso',state.intendedUse);
 return '#/buscar?'+params;
}
export function searchLocationLabel(state){return getMunicipality(state.searchMunicipality)?.name||getDepartment(state.searchDepartment)?.name||state.query||directoryTitle(state.directoryScope)||'Sin municipio específico';}
