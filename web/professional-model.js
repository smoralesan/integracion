import {technicalSpecialties} from './ally-categories.js';
import {getDepartment,getMunicipality} from './colombia-locations.js';
export const availabilityOptions=[['available','Disponible para nuevos proyectos'],['limited','Disponibilidad limitada'],['by_agreement','A convenir según el proyecto'],['unavailable','Sin disponibilidad por ahora']];
export const projectTypeOptions=['Residencial','Comercial','Industrial','Turístico','Mixto','Urbanismo e infraestructura'];
export const professionalKeys=['specialties','services','experience','experienceYears','projectTypes','coverage','nationwide','canTravel','availability','portfolio','contactEmail','phone','shareWithTeam'];
const text=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
export function safePortfolioUrl(value){try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.href.length>2048)throw Error();return url.href;}catch{throw Error('Los enlaces del portafolio deben usar HTTPS y no incluir credenciales.');}}
export function professionalView(p={}){
 return {specialties:Array.isArray(p.specialties)?p.specialties:(p.specialty?[p.specialty]:[]),services:p.services||'',experience:p.experience||'',experienceYears:p.experienceYears??'',projectTypes:p.projectTypes||[],coverage:p.coverage||[],nationwide:p.nationwide===true,canTravel:p.canTravel===true,availability:p.availability||'',portfolio:p.portfolio||[],contactEmail:p.contactEmail||'',phone:p.phone||'',shareWithTeam:p.shareWithTeam===true};
}
export function normalizeProfessional(body,category,specialty,previous={}){
 const source=Object.fromEntries(professionalKeys.map(k=>[k,body[k]===undefined?previous[k]:body[k]])),p=professionalView(source);
 if(source.specialties!==undefined&&(!Array.isArray(source.specialties)||source.specialties.length>technicalSpecialties.length||source.specialties.some(s=>!technicalSpecialties.includes(s))))throw Error('Selecciona especialidades técnicas válidas.');
 p.specialties=category==='Técnicos'?[...new Set([specialty,...p.specialties].filter(Boolean))]:[];
 if(p.specialties.some(s=>!technicalSpecialties.includes(s)))throw Error('Selecciona especialidades técnicas válidas.');
 for(const k of ['nationwide','canTravel','shareWithTeam']){if(source[k]!==undefined&&typeof source[k]!=='boolean')throw Error('Revisa las preferencias de cobertura y autorización.');}
 p.services=text(source.services,2000);p.experience=text(source.experience,2000);p.contactEmail=text(source.contactEmail,160);p.phone=text(source.phone,40);
 if(p.contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactEmail))throw Error('Escribe un correo de contacto válido.');
 const years=source.experienceYears;if(years!==undefined&&years!==''&&(!/^\d{1,2}$/.test(String(years))||Number(years)>80))throw Error('Los años de experiencia deben estar entre 0 y 80.');p.experienceYears=years==null||years===''?'':Number(years);
 if(source.projectTypes!==undefined&&(!Array.isArray(source.projectTypes)||source.projectTypes.length>projectTypeOptions.length||source.projectTypes.some(x=>!projectTypeOptions.includes(x))))throw Error('Selecciona tipos de proyecto válidos.');p.projectTypes=[...new Set(p.projectTypes)];
 if(p.availability&&!availabilityOptions.some(([v])=>v===p.availability))throw Error('Selecciona una disponibilidad válida.');
 if(!Array.isArray(p.coverage)||p.coverage.length>12)throw Error('Puedes agregar hasta 12 zonas de cobertura.');
 p.coverage=p.coverage.filter(r=>r?.departmentCode||r?.municipalityCode).map(r=>{const d=getDepartment(r.departmentCode),m=r.municipalityCode?getMunicipality(r.municipalityCode):null;if(!d||(r.municipalityCode&&(!m||m.departmentCode!==d.code)))throw Error('Revisa el departamento y municipio de la cobertura.');return {departmentCode:d.code,municipalityCode:m?.code||''};});
 p.coverage=[...new Map(p.coverage.map(r=>[r.departmentCode+':'+r.municipalityCode,r])).values()];
 if(!Array.isArray(p.portfolio)||p.portfolio.length>5)throw Error('Puedes agregar hasta cinco trabajos de referencia.');
 p.portfolio=p.portfolio.filter(r=>r?.title||r?.url||r?.description).map(r=>{const title=text(r.title,120),description=text(r.description,500);if(!title||!r.url)throw Error('Cada trabajo del portafolio requiere título y enlace HTTPS.');return {title,description,url:safePortfolioUrl(r.url)};});
 if(p.shareWithTeam&&!p.contactEmail&&!p.phone)throw Error('Agrega un correo o teléfono para que el equipo pueda contactarte.');
 return p;
}
export const coverageLabel=row=>[getMunicipality(row.municipalityCode)?.name,getDepartment(row.departmentCode)?.name].filter(Boolean).join(', ');
