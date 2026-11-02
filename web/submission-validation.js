import {valueStatus,validateContributionPercentage} from './land-negotiation.js';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateNegotiationSubmission(form){
 validateContributionPercentage(form);
 if(!['public','off-market'].includes(form.visibility))throw Error('Elige Público u Off-market antes de continuar.');
 if(valueStatus(form)!=='known')return;
 const method=form.price_method||'cop';if(!['cop','usd','dual','mixed'].includes(method))throw Error('Elige cómo quieres expresar el valor.');
 for(const field of ['amount',...(['dual','mixed'].includes(method)?['amount_usd']:[])])if(!/^\d{1,15}(?:\.\d{1,2})?$/.test(String(form[field]||''))||Number(form[field])<1)throw Error('Indica el valor de referencia en cada moneda seleccionada o elige que aún no lo sabes.');
}
export function migratePublicationForm(form){const next=structuredClone(form);if(next.need==='Terreno')next.need='Lote';return next;}
export function validateProjectAreaRange(form){if(form.land_status!=='searching')return;for(const key of ['desired_min','desired_max'])if(form[key]!=null&&form[key]!==''&&(!Number.isFinite(Number(form[key]))||Number(form[key])<1))throw Error('Indica un área de búsqueda válida de al menos 1 m².');if(form.desired_min&&form.desired_max&&Number(form.desired_min)>Number(form.desired_max))throw Error('El área máxima debe ser mayor o igual al área mínima.');}
export function normalizeProjectForm(form){const next=migratePublicationForm(form);if(next.land_status!=='searching')for(const key of ['desired_min','desired_max','desired_zone'])delete next[key];return next;}
export const expiredSubmissionFiles=(files,now=Date.now())=>files.filter(file=>file.expiresAt!=null&&(!Number.isFinite(Date.parse(file.expiresAt))||Date.parse(file.expiresAt)<=now));
export function expiredAttachmentsHTML(files){const expired=expiredSubmissionFiles(files);return expired.length?`<section class="ux-expired-attachments" data-expired-attachments aria-label="Adjuntos vencidos"><h3>Revisa los adjuntos vencidos</h3><p>${expired.length===1?'Este':'Estos'} ${expired.length===1?'archivo ya no está disponible':'archivos ya no están disponibles'}. Quita sus referencias y, si los necesitas, selecciona de nuevo los originales.</p><ul>${expired.map(file=>`<li>${e(file.name)}</li>`).join('')}</ul><button type="button" class="button outline" data-action="remove-expired-files">Quitar referencias vencidas</button><p>Los archivos vigentes se conservan. Si una obligación necesita soportes, vuelve a asociarlos antes de enviar.</p></section>`:'';}
export const currencyChangeNotice='Cambiar de COP a USD, o a otra modalidad de precio, no convierte ni recalcula el importe. Revisa el valor en la moneda seleccionada.';
