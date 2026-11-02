import {resolveLocation,getDepartment,departments,departmentKey} from './colombia-locations.js';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function locationBreadcrumbs(location,{project=false}={}){
 const resolved=resolveLocation(location),department=resolved?getDepartment(resolved.department_code):getDepartment(location.department_code)||departments.find(item=>departmentKey(item.name)===departmentKey(location.region));
 const city=String(location.city||resolved?.city||'').trim();const rows=[];
 const link=(name,municipality=false)=>{const params=new URLSearchParams(project?{tipo:'proyecto'}:{contenido:'todos'});if(project)params.set('q',name);else if(municipality&&resolved)params.set('municipio',resolved.municipality_code);else if(!municipality&&department)params.set('departamento_codigo',department.code);else params.set('q',name);return (project?'#/oportunidades?':'#/buscar?')+params;};
 if(department)rows.push({label:department.name,href:link(department.name)});
 if(city)rows.push({label:city,href:link(city,true)});
 return rows;
}
export function locationBreadcrumbHTML(location,options){return locationBreadcrumbs(location,options).map(({label,href})=>`<span aria-hidden="true">/</span><a href="${e(href)}">${e(label)}</a>`).join('');}
