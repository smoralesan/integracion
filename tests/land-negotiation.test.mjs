import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNegotiationForm,valueStatus,hasCashPreferences,negotiationValueLabel,referenceValueSummary} from '../web/land-negotiation.js';
import {completeLocalRegistration} from '../web/registration-journey.js';
test('Changing to pending or advice excludes former prices from the submitted record without erasing the draft',()=>{
 for(const status of ['pending','advice']){
  const draft={value_status:status,amount:'1200000',amount_usd:'300',exchange_rate:'4000',negotiation:'sale'};
  const sent=normalizeNegotiationForm(draft);
  for(const field of ['amount','amount_usd','exchange_rate'])assert.ok(!(field in sent));
  assert.equal(draft.amount,'1200000');assert.equal(draft.exchange_rate,'4000');
  assert.ok(referenceValueSummary(sent).startsWith('Por definir'));
 }
});
test('A contribution compensated only with units does not submit money reception preferences',()=>{
 const draft={value_status:'known',amount:'1200000',negotiation:'contribution',compensation:'units',receive_currencies:['USD'],rate_method:'fixed',exchange_rate:'4000',negotiable:'yes'};
 const sent=normalizeNegotiationForm(draft);
 assert.equal(sent.amount,'1200000');assert.equal(hasCashPreferences(sent),false);
 for(const field of ['receive_currencies','exchange_rate','rate_method','negotiable'])assert.ok(!(field in sent));
 assert.equal(negotiationValueLabel(sent),'Valor estimado del aporte');assert.deepEqual(draft.receive_currencies,['USD']);
 for(const compensation of ['cash','mixed'])assert.ok(hasCashPreferences({...draft,compensation}));
});
test('Existing drafts retain valid price and currency preferences; invalid knowledge values are rejected',()=>{
 const legacy={amount:'1200000',amount_usd:'300',price_method:'dual',negotiation:'sale',receive_currencies:['COP','USD']};
 assert.equal(valueStatus(legacy),'known');assert.deepEqual(normalizeNegotiationForm(legacy),{...legacy,value_status:'known'});
 assert.equal(valueStatus({}),'pending');assert.throws(()=>normalizeNegotiationForm({value_status:'unexpected'}));
});
test('The local completion uses the same active value projection as the real submission',()=>{
 const form={client_id:'4be55c58-ddde-491e-bde4-12e5097a7e1b',title:'Prueba',value_status:'advice',amount:'1500000',valuation_assistance:false};
 const record=completeLocalRegistration({submissions:[],drafts:[]},{kind:'terreno',form,files:[]});
 assert.equal(record.form.value_status,'advice');assert.ok(!('amount' in record.form));assert.equal(form.amount,'1500000');assert.equal(record.form.valuation_assistance,false);
});
