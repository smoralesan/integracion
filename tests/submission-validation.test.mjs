import test from 'node:test';
import assert from 'node:assert/strict';
import {validateNegotiationSubmission,migratePublicationForm,normalizeProjectForm,validateProjectAreaRange,expiredSubmissionFiles,expiredAttachmentsHTML,currencyChangeNotice} from '../web/submission-validation.js';
import {canonicalDeclaredArea} from '../web/declared-area.js';
import {validateTerrainDetails} from '../web/terrain-location.js';
import {publicSummary} from '../web/workflow-model.js';
import {publicationPreviewHTML} from '../web/publication-ux.js';
test('la validación final exige visibilidad explícita y los importes de las monedas activas',()=>{
 const base={negotiation:'sale',visibility:'public',value_status:'known',price_method:'cop',amount:'1000000'};
 assert.doesNotThrow(()=>validateNegotiationSubmission(base));
 for(const amount of ['',undefined,'0','-1','no','100.123'])assert.throws(()=>validateNegotiationSubmission({...base,amount}),/valor de referencia/);
 for(const visibility of ['',undefined,'invalid'])assert.throws(()=>validateNegotiationSubmission({...base,visibility}),/Público u Off-market/);
 assert.throws(()=>validateNegotiationSubmission({...base,price_method:'dual'}),/valor de referencia/);
 assert.doesNotThrow(()=>validateNegotiationSubmission({...base,price_method:'dual',amount_usd:'250.50'}));
 assert.doesNotThrow(()=>validateNegotiationSubmission({...base,value_status:'pending',amount:''}));
});
test('el resumen de un borrador sin visibilidad no lo presenta como Público',()=>{
 const html=publicationPreviewHTML({value_status:'pending'},{privateSummary:''});assert.match(html,/Visibilidad pendiente/);assert.doesNotMatch(html,/Público · Vista previa/);
});
test('un proyecto que deja de buscar lote no valida ni envía sus antiguos criterios ocultos',()=>{
 const searching={need:'Terreno',land_status:'searching',desired_min:'10000',desired_max:'5000',desired_zone:'Zona de prueba'};
 assert.throws(()=>validateProjectAreaRange(searching),/máxima/);
 for(const land_status of ['owned','negotiating']){const draft={...searching,land_status};assert.doesNotThrow(()=>validateProjectAreaRange(draft));const sent=normalizeProjectForm(draft);assert.equal(sent.desired_min,undefined);assert.equal(sent.desired_max,undefined);assert.equal(sent.desired_zone,undefined);assert.equal(sent.need,'Lote');assert.equal(draft.need,'Terreno');assert.equal(draft.desired_min,'10000');}
});
test('la migración cambia solo la opción antigua y conserva la identidad y los textos del usuario',()=>{
 const draft={client_id:crypto.randomUUID(),need:'Terreno',title:'Mi terreno original',visibility:'off-market'};const migrated=migratePublicationForm(draft);assert.equal(migrated.need,'Lote');assert.equal(migrated.title,draft.title);assert.equal(migrated.client_id,draft.client_id);assert.equal(migrated.visibility,'off-market');assert.equal(draft.need,'Terreno');
});
test('la notación científica se expande sin perder el área ni los decimales al publicarla',()=>{
 for(const [value,expected] of [['1e5','100000'],['5.20075e3','5200.75'],['520075e-2','5200.75'],['0005200.7500','5200.75']]){assert.equal(canonicalDeclaredArea(value),expected);const form={area:value,cadastral_address:'Prueba'};assert.doesNotThrow(()=>validateTerrainDetails(form));assert.equal(publicSummary({kind:'terreno',form}).area,expected);assert.equal(form.area,value);}
 for(const value of ['1e9999','-1e5','0x10','NaN'])assert.equal(canonicalDeclaredArea(value),null);
});
test('los adjuntos vencidos se distinguen de los vigentes y los ejemplos sin vencimiento',()=>{
 const now=Date.now(),expired={id:'expired',name:'<Plano>.pdf',expiresAt:new Date(now-1).toISOString()},live={id:'live',name:'Vigente.pdf',expiresAt:new Date(now+86400000).toISOString()},demo={origin:'demo',name:'Ejemplo.pdf'};
 const files=[expired,live,demo];assert.deepEqual(expiredSubmissionFiles(files,now),[expired]);const html=expiredAttachmentsHTML(files);assert.match(html,/Quitar referencias vencidas/);assert.match(html,/&lt;Plano&gt;.pdf/);assert.doesNotMatch(html,/Vigente.pdf/);assert.deepEqual(files,[expired,live,demo]);assert.equal(expiredAttachmentsHTML([live,demo]),'');
});
test('el aviso de moneda explica que el importe no se convierte automáticamente',()=>{assert.match(currencyChangeNotice,/no convierte ni recalcula/);});
