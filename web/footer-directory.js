import {municipalityKey,departmentKey} from './colombia-locations.js';
export const cities=['Bogotá','Medellín','Cali','Barranquilla','Bucaramanga','Pereira','Manizales','Armenia','Cúcuta','Ibagué','Villavicencio','Pasto','Neiva','Tunja','Montería','Cartagena'];
export const departments=['Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas','Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés, Providencia y Santa Catalina','Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada'];
export const landTypes=[['urbano','Lotes urbanos','Urbano'],['rural','Lotes rurales','Rural'],['expansion','Lotes de expansión urbana','Expansión urbana']];
const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function directoryLink(label,key,value){return `<a href="#/oportunidades?tipo=terreno${key?'&'+key+'='+encodeURIComponent(value):''}">${label}</a>`;}
export function footerDirectoryHTML(){
 const featured=['Antioquia','Cundinamarca','Valle del Cauca','Santander','Atlántico','Bolívar','Risaralda','Caldas','Quindío','Tolima','Meta','Boyacá'];
 return `<section class="footer-directory" aria-labelledby="directory-title"><div class="container"><div class="directory-heading"><div><span>Explora por ubicación y tipo</span><h2 id="directory-title">Terrenos en Colombia</h2></div><p>Accesos de búsqueda. La oferta depende de las publicaciones disponibles.</p></div><div class="directory-grid"><nav aria-label="Terrenos por ciudad"><h3>Ciudades</h3><div class="directory-links">${cities.map(c=>directoryLink(c,'ciudad',c)).join('')}</div></nav><nav aria-label="Terrenos por departamento"><h3>Departamentos</h3><div class="directory-links">${featured.map(d=>directoryLink(d,'departamento',d)).join('')}</div><details class="directory-more"><summary><span class="directory-show">Ver los 32 departamentos</span><span class="directory-hide">Mostrar menos departamentos</span></summary><div class="directory-links">${departments.filter(d=>!featured.includes(d)).map(d=>directoryLink(d,'departamento',d)).join('')}</div></details></nav><nav class="directory-types" aria-label="Terrenos por tipo de lote"><h3>Tipos de lote</h3><div class="directory-links">${landTypes.map(([key,label])=>directoryLink(label,'lote',key)).join('')}</div>${directoryLink('Explorar todos los lotes →','','')}<p>La clasificación del lote debe verificarse con sus soportes y la normativa aplicable.</p></nav></div></div></section>`;
}
export function readDirectoryScope(hash){
 const params=new URLSearchParams(hash.split('?')[1]||'');
 if(params.get('tipo')!=='terreno')return null;
 const city=cities.find(c=>c===params.get('ciudad'))||'';
 const department=departments.find(d=>d===params.get('departamento'))||'';
 const landType=landTypes.find(([key])=>key===params.get('lote'))?.[2]||'';
 return {city,department,landType};
}
export function directoryTitle(scope){
 if(!scope)return '';
 if(scope.city)return 'Terrenos en '+scope.city;
 if(scope.department)return 'Terrenos en '+scope.department;
 if(scope.landType)return landTypes.find(t=>t[2]===scope.landType)?.[1]||'Terrenos';
 return 'Todos los lotes';
}
export function matchesDirectory(record,scope){
 if(!scope)return true;
 if((record.kind||record.type)!=='terreno')return false;
 const city=municipalityKey(record.city);
 return (!scope.city||city===municipalityKey(scope.city)) &&
  (!scope.department||departmentKey(record.region)===departmentKey(scope.department)) &&
  (!scope.landType||normalized(record.land_type||record.label?.replace(/^Terreno /i,''))===normalized(scope.landType));
}
