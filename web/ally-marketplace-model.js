import {departments} from './colombia-locations.js';
export const searchText=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
export const categoryGroup=s=>s.specialty||s.slug==='tecnicos'?'tecnicos':s.slug==='abogados'?'legal':['inversionistas','financiadores','fiduciarias','comercializadores'].includes(s.slug)?'negocio':'desarrollo';
export const marketplaceGroups=[['all','Todas las áreas'],['legal','Legales'],['desarrollo','Diseño y desarrollo'],['tecnicos','Especialidades técnicas'],['negocio','Finanzas y comercialización']];
export function specialistMatches(s,query,group='all'){
 if(group!=='all'&&categoryGroup(s)!==group)return false;
 if(!query&&group==='all'&&(s.specialty||s.parentSlug))return false;
 if(group==='tecnicos'&&s.slug==='tecnicos')return false;
 return searchText([s.label,s.intro,...s.scope.flat()].join(' ')).includes(searchText(query));
}
export function publicAllyMatches(p,query,group='all',specialists=[]){
 const specialty=specialists.find(s=>s.slug===p.specialistSlug);
 if(group!=='all'&&(!specialty||categoryGroup(specialty)!==group))return false;
 return searchText([p.name,p.category,p.headline,p.summary,...(p.highlights||[]),...(p.businessAreas||[]).flatMap(a=>[a.title,a.description])].join(' ')).includes(searchText(query.trim()));
}
export function marketplaceState(params,specialists){
 const value=k=>params.get(k)||'';
 const specialty=specialists.find(s=>s.slug===value('especialidad'));
 return {query:(value('q')||value('rol')).slice(0,160),group:marketplaceGroups.some(([key])=>key===value('grupo'))?value('grupo'):'all',specialty:specialty?.slug||'',department:departments.some(d=>d.code===value('departamento'))?value('departamento'):'',kind:['company','person'].includes(value('tipo'))?value('tipo'):'',view:['perfiles','especialidades','guardados'].includes(value('vista'))?value('vista'):'perfiles',layout:value('formato')==='lista'?'lista':'tarjetas',sort:value('orden')==='nombre'?'nombre':'especialidad'};
}
export function marketplaceHref(s){const p=new URLSearchParams();for(const [key,value,defaultValue]of [['q',s.query?.trim(),''],['grupo',s.group,'all'],['especialidad',s.specialty,''],['departamento',s.department,''],['tipo',s.kind,''],['vista',s.view,'perfiles'],['formato',s.layout,'tarjetas'],['orden',s.sort,'especialidad']])if(value&&value!==defaultValue)p.set(key,value);return '#/aliados/buscar'+(p.size?'?'+p:'');}
export function marketplaceResults(s,profiles,specialists,saved=[]){
 let firms=profiles.filter(p=>publicAllyMatches(p,s.query,s.group,specialists)&&(!s.specialty||p.specialistSlug===s.specialty)&&(!s.kind||p.kind===s.kind)&&(s.view!=='guardados'||saved.includes(p.slug)));
 let roles=specialists.filter(role=>s.specialty?role.slug===s.specialty&&(s.group==='all'||categoryGroup(role)===s.group)&&searchText([role.label,role.intro,...role.scope.flat()].join(' ')).includes(searchText(s.query.trim())):specialistMatches(role,s.query.trim(),s.group));
 if(s.sort!=='nombre')firms=[...firms].sort((a,b)=>a.category.localeCompare(b.category,'es')||a.name.localeCompare(b.name,'es'));
 if(s.sort==='nombre'){firms=[...firms].sort((a,b)=>a.name.localeCompare(b.name,'es'));roles=[...roles].sort((a,b)=>a.label.localeCompare(b.label,'es'));}
 return {firms,roles};
}
export const serviceHref=(slug,department='')=>'#/solicitar-servicio/'+encodeURIComponent(slug)+(department?'?departamento='+encodeURIComponent(department):'');
export function savedAllies(raw,profiles){try{const value=typeof raw==='string'?JSON.parse(raw):raw;return Array.isArray(value)?[...new Set(value)].filter(slug=>profiles.some(p=>p.slug===slug)):[];}catch{return [];}}

export const marketplaceReturnHref=raw=>typeof raw==='string'&&/^#\/aliados\/buscar(?:\?[^\r\n]*)?$/.test(raw)?raw:'#/aliados/buscar';
