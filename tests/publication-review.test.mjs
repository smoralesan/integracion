import test from 'node:test';
import assert from 'node:assert/strict';
import {publicationReviewIssues,publicationReviewChecksHTML,completedSubmissionProgressHTML} from '../web/publication-review.js';
import {publicationProgressModel} from '../web/publication-progress.js';
import {publicationSharingHTML,registrationStatusGuideHTML} from '../web/publication-ux.js';
import {obligations} from '../web/land-situation-model.js';
import {terrainPhotoSectionHTML} from '../web/terrain-photo-preview.js';
const ready=()=>({title:'Lote de prueba',department_code:'13',municipality_code:'13001',land_type:'Urbano',relationship:'Propietario',land_content:'land-only',project_land_confirmed:true,cadastral_address:'Dirección ficticia',area:'5200.75',location_mode:'pin',location_pin:[-75,10],location_pin_confirmed:true,negotiation:'sale',value_status:'pending',visibility:'off-market',land_situation:{version:1,obligations:Object.fromEntries(obligations.map(([key])=>[key,{status:'unknown'}])),facts:{owners:'unknown'}}});
test('el paso final nunca afirma 100% antes del guardado y la confirmación distingue demo y envío',()=>{
 assert.equal(publicationProgressModel({step:4}).percent,75);assert.ok([1,2,3,4].every(step=>publicationProgressModel({step}).percent<100));
 const demo=completedSubmissionProgressHTML(true),real=completedSubmissionProgressHTML(false);assert.match(demo,/value="100"/);assert.match(demo,/No se envió ni se publicó/);assert.match(real,/revisión y publicación son pasos posteriores/);
});
test('la revisión final distingue pendientes opcionales de errores y enlaza con el paso correcto',()=>{
 const form=ready();assert.deepEqual(publicationReviewIssues(form),[]);
 const issues=publicationReviewIssues({...form,cadastral_address:'',area:'',visibility:'',location_pin_confirmed:false});
 for(const field of ['cadastral_address','area','visibility','location'])assert.ok(issues.some(issue=>issue.field===field));
 assert.equal(issues.find(issue=>issue.field==='visibility').step,2);assert.match(publicationReviewChecksHTML(issues),/data-action="review-correction"/);assert.match(publicationReviewChecksHTML(issues),/Puedes completar después/);
 assert.ok(!issues.some(issue=>issue.field==='perimeter'));assert.ok(!issues.some(issue=>issue.field==='supports'));
});
test('los adjuntos vencidos y las fotos locales en el acceso real requieren atención antes del envío',()=>{
 const old={id:'old',name:'Plano.pdf',expiresAt:'2000-01-01T00:00:00Z'};assert.ok(publicationReviewIssues(ready(),[old]).some(issue=>issue.field==='files'&&issue.step===4));
 const photo={id:'local',localPhoto:true,origin:'demo'};assert.ok(publicationReviewIssues(ready(),[photo],{preview:false}).some(issue=>issue.field==='files'));assert.ok(!publicationReviewIssues(ready(),[photo],{preview:true}).some(issue=>issue.field==='files'));
});
test('el resumen diferencia contenido autorizado de información privada y explica Off-market',()=>{
 const publicHTML=publicationSharingHTML({visibility:'public'}),off=publicationSharingHTML({visibility:'off-market'}),pending=publicationSharingHTML({});
 assert.match(publicHTML,/Dirección catastral, datos de contacto y documentos originales/);assert.match(publicHTML,/cuando autorices ese contenido/);assert.match(off,/no aparece en búsquedas ni mapas públicos/);assert.match(pending,/Todavía no has elegido/);
 assert.match(registrationStatusGuideHTML({visibility:'off-market'},{preview:true}),/Gestión Off-market/);assert.match(registrationStatusGuideHTML({visibility:'public'}),/Requiere ajustes/);
 for(const label of ['Acceso:','Frente:','Interior:','Entorno:'])assert.ok(terrainPhotoSectionHTML(true).includes(label));
});
