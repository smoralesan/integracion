import test from 'node:test';
import assert from 'node:assert/strict';
import {localConfirmationHTML,confirmationTerrainValue,putDraft,chooseDraft,completeLocalRegistration} from '../web/registration-journey.js';
import {submissionConnectionCopy} from '../web/ux-flow.js';
test('la confirmación conserva los datos declarados y distingue próximos pasos Públicos y Off-market',()=>{
 for(const visibility of ['public','off-market']){
 const store={submissions:[]},form={client_id:crypto.randomUUID(),title:'Predio de prueba',cadastral_address:'Dirección <privada>',area:'6400.5',location_pin:[-74,4],location_pin_confirmed:true,visibility,negotiation:'contribution',compensation:'units',value_status:'pending'};
 putDraft(store,{kind:'terreno',step:4,form,files:[{id:'foto',name:'Portada.jpg',localPhoto:true,origin:'demo'}]});
 const record=completeLocalRegistration(store,chooseDraft(JSON.parse(JSON.stringify(store)),'terreno',form.client_id));
 const html=localConfirmationHTML(record);assert.match(html,/Tu demostración quedó guardada/);assert.match(html,/Dirección &lt;privada&gt;/);assert.match(html,/6.400,5 m²/);assert.match(html,/Por definir/);assert.match(html,/Portada.jpg/);assert.match(html,/no envió el registro al equipo/);
 assert.match(html,visibility==='off-market'?/Gestión Off-market/:/Autorización del resumen/);
 }
});
test('valores en ambas monedas y aporte se muestran según las preferencias activas',()=>{
 assert.equal(confirmationTerrainValue({value_status:'known',price_method:'dual',amount:'900000000',amount_usd:'250000'}),'COP $900.000.000 / USD $250.000');
 assert.equal(confirmationTerrainValue({value_status:'advice',amount:'900'}),'Por definir · Necesita orientación');
});
test('sin conexión distingue la prueba local del envío real y no promete sincronización automática',()=>{
 assert.match(submissionConnectionCopy(false,true),/fotos de prueba/);assert.match(submissionConnectionCopy(false,false),/envío al equipo necesitan Internet/);assert.match(submissionConnectionCopy(true,true),/no se envió automáticamente/);
});
