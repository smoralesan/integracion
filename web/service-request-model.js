import {specialistBySlug} from './specialist-landings.js';
import {resolveLocation} from './colombia-locations.js';
export const serviceStates={received:'Recibida',in_review:'En revisión',needs_information:'Información pendiente',matching:'Buscando especialista',connected:'Conexión coordinada',closed:'Cerrada'};
export const serviceTransitions={received:['in_review','needs_information','closed'],in_review:['needs_information','matching','closed'],needs_information:['in_review','closed'],matching:['in_review','needs_information','connected','closed'],connected:['in_review','closed'],closed:[]};
export const serviceTimings=[['soon','Lo antes posible'],['month','Durante el próximo mes'],['planning','Estoy planeando el proyecto'],['flexible','Por acordar']];
export function normalizeServiceRequest(body,accountEmail){
 const s=specialistBySlug(body.specialistSlug);if(!s)throw Error('Selecciona una especialidad de la red.');
 const text=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
 const name=text(body.name,100),description=text(body.description,3000),contactEmail=text(body.contactEmail||accountEmail,160),phone=text(body.phone,40);
 if(!name||description.length<10)throw Error('Completa tu nombre y describe el servicio que necesitas (al menos 10 caracteres).');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))throw Error('Escribe un correo de contacto válido.');
 const location=resolveLocation({department_code:body.departmentCode,municipality_code:body.municipalityCode});if(!location)throw Error('Selecciona departamento y municipio del proyecto.');
 if(body.contactConsent!==true)throw Error('Autoriza compartir esta solicitud y tus datos de contacto con el equipo.');
 const timing=text(body.timing,30);if(timing&&!serviceTimings.some(([v])=>v===timing))throw Error('Selecciona un plazo válido.');
 return {specialistSlug:s.slug,category:s.category,specialty:s.specialty||s.category,name,description,contactEmail,phone,location,projectReference:text(body.projectReference,120),timing,contactConsent:true};
}
export function ownerServiceRequest(record){const {owner,internalNotes,assignedProfileId,...safe}=record;return {...safe,history:(record.history||[]).map(({actor,...event})=>event)};}
