import test from 'node:test';
import assert from 'node:assert/strict';
import {allowsPublicListing,normalizeLandVisibility,visibilityFieldsHTML} from '../web/land-visibility.js';
import {permittedTransitions} from '../web/workflow-model.js';
import {ownerWorkflowHTML} from '../web/review-ui.js';
import {ownerExperienceHTML} from '../web/opportunity-experience.js';
import {localConfirmationHTML,completeLocalRegistration} from '../web/registration-journey.js';
test('La visibilidad conserva compatibilidad y los valores desconocidos no se vuelven públicos',()=>{
 assert.equal(allowsPublicListing({kind:'terreno',form:{}}),true);
 assert.equal(allowsPublicListing({kind:'terreno',form:{visibility:'off-market'}}),false);
 assert.equal(allowsPublicListing({kind:'terreno',form:{visibility:'invalid'}}),false);
 assert.throws(()=>normalizeLandVisibility('invalid'));
 assert.ok(!visibilityFieldsHTML().includes('checked'));
 assert.ok(visibilityFieldsHTML('off-market').includes('value="off-market" checked'));
});
test('El titular de un terreno Off-market no recibe controles para autorizar una ficha pública',()=>{
 const r={kind:'terreno',status:'approved',form:{visibility:'off-market'},files:[],history:[],publicationConsent:{authorized:true},revision:0};
 assert.ok(!permittedTransitions(r,'admin').includes('published'));
 const followup=ownerWorkflowHTML(r),experience=ownerExperienceHTML(r);
 assert.ok(followup.includes('data-form="land-visibility"'));
 assert.ok(!followup.includes('data-form="publication-consent"'));
 assert.ok(experience.includes('data-exp-owner="availability"'));
 assert.ok(!experience.includes('data-exp-owner="presentation"'));
});
test('El registro local conserva Off-market y muestra gestión privada en su confirmación',()=>{
 const store={submissions:[],drafts:[]},draft={kind:'terreno',form:{client_id:'4be55c58-ddde-491e-bde4-12e5097a7e1b',title:'Lote reservado',visibility:'off-market'},files:[]};
 const saved=completeLocalRegistration(store,draft);assert.equal(saved.form.visibility,'off-market');
 const confirmation=localConfirmationHTML(saved);
 assert.ok(confirmation.includes('Visibilidad</dt><dd>Off-market'));
 assert.ok(confirmation.includes('Gestión Off-market'));
 assert.ok(!confirmation.includes('<strong>Publicado</strong>'));
});
