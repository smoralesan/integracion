import {validateAttachmentLimits} from './attachment-limits.js';
import {resolveLocation} from './colombia-locations.js';
import {terrainLocationMode,normalizeLocationPin,validateTerrainDetails} from './terrain-location.js';
import {normalizeNegotiationForm} from './land-negotiation.js';
import {validateNegotiationSubmission,expiredSubmissionFiles} from './submission-validation.js';
import {normalizeBrokerExclusivity} from './broker-exclusivity.js';
import {normalizeLandSituation} from './land-situation-model.js';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function publicationReviewIssues(form,files=[],{preview=true}={}){
 const issues=[],add=(step,field,label)=>issues.push({step,field,label});
 if(!String(form.title||'').trim())add(1,'title','Completa el nombre del lote');
 if(!resolveLocation(form))add(1,'department_code','Selecciona departamento y municipio');
 if(!form.land_type)add(1,'land_type','Selecciona el tipo de lote');
 if(!form.relationship)add(1,'relationship','Indica tu relación con el registro');
 if(!['land-only','land-project'].includes(form.land_content))add(1,'land_content','Indica qué incluye la oferta');
 if(form.project_land_confirmed!==true)add(1,'project_land_confirmed','Confirma que ofreces el lote para un desarrollo');
 try{normalizeBrokerExclusivity(form.relationship,form.broker_exclusivity);}catch(error){add(1,'broker_exclusivity',error.message);}
 if(!String(form.cadastral_address||'').trim())add(1,'cadastral_address','Completa la dirección catastral del lote');
 try{validateTerrainDetails({...form,cadastral_address:'Validación del área'});}catch(error){add(1,'area',error.message);}
 if(terrainLocationMode(form)==='pin'){try{normalizeLocationPin({coordinates:form.location_pin,confirmed:form.location_pin_confirmed});}catch(error){add(1,'location',error.message);}}
 else if(!form.parcel_geometry||!form.parcel_confirmed)add(1,'location','Completa y confirma el polígono de referencia');
 try{validateNegotiationSubmission(form);normalizeNegotiationForm(form);}catch(error){add(2,!['public','off-market'].includes(form.visibility)?'visibility':error.message.includes('porcentaje')?'cash_percent':error.message.includes('valor de referencia')?'amount':'value_status',error.message);}
 try{normalizeLandSituation(form.land_situation,{documentIds:files.map(file=>file.id)});}catch(error){add(3,'land_situation',error.message);}
 try{validateAttachmentLimits(files);}catch(error){add(4,'files',error.message);}
 if(expiredSubmissionFiles(files).length)add(4,'files','Quita o reemplaza los adjuntos vencidos');
 if(!preview&&files.some(file=>file.localPhoto||!file.id))add(4,'files','Vuelve a seleccionar los archivos de prueba para cargarlos con el acceso real');
 return [...new Map(issues.map(issue=>[issue.step+':'+issue.field,issue])).values()];
}
export function publicationReviewChecksHTML(issues){return `<section class="pr-review-checks" aria-label="Revisión antes de finalizar"><h3>${issues.length?'Debes corregir antes de finalizar':'Sin correcciones obligatorias pendientes'}</h3><p>${issues.length?'Usa estos accesos para volver al dato que requiere atención.':'Revisa el resumen y confirma la autorización para terminar. Los soportes y declaraciones siguen sujetos a revisión.'}</p>${issues.length?`<ul>${issues.map(issue=>`<li><button type="button" class="text-button" data-action="review-correction" data-step="${issue.step}" data-review-target="${e(issue.field)}"><span>Paso ${issue.step} · ${e(issue.label)}</span><span aria-hidden="true">→</span></button></li>`).join('')}</ul>`:''}<small>Los pendientes opcionales aparecen por separado en «Puedes completar después».</small></section>`;}
export function completedSubmissionProgressHTML(preview=false){return `<div class="pr-completed-progress"><strong>100 % · ${preview?'Recorrido de demostración completado':'Envío completado'}</strong><progress max="100" value="100" aria-label="${preview?'Demostración guardada':'Expediente recibido'}">100 %</progress><p>${preview?'Guardado en este navegador. No se envió ni se publicó.':'El expediente está guardado. Su revisión y publicación son pasos posteriores.'}</p></div>`;}
