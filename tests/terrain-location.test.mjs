import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLocationPin,terrainLocationMode,locationSummary,captureLocationConfirmation,validateTerrainDetails} from '../web/terrain-location.js';
import {putDraft,chooseDraft,completeLocalRegistration} from '../web/registration-journey.js';
test('new terrain starts with a pin; legacy polygon drafts retain the selected perimeter',()=>{
 assert.equal(terrainLocationMode({}),'pin');assert.equal(terrainLocationMode({parcel_geometry:{type:'Polygon'}}),'polygon');
 assert.equal(terrainLocationMode({parcel_geometry:{},location_mode:'pin'}),'pin');
 assert.throws(()=>normalizeLocationPin({confirmed:false,coordinates:[-74,4]}));
 assert.match(locationSummary({}),/pendiente/);
 assert.match(locationSummary({location_pin:[-74,4],location_pin_confirmed:true}),/Perímetro pendiente/);
 assert.match(locationSummary({parcel_geometry:{type:'Polygon'},parcel_confirmed:false}),/confirmar/);
});
test('pin, selected mode and confirmation survive retaking a draft and local completion independently of other properties',()=>{
 const store={submissions:[]},id=crypto.randomUUID(),form={client_id:id,title:'Terreno de ejemplo',location_mode:'pin',location_pin:[-74,4],location_pin_confirmed:true};
 putDraft(store,{kind:'terreno',step:4,form,files:[]});form.location_pin[0]=0;
 const draft=chooseDraft(store,'terreno',id);assert.deepEqual(draft.form.location_pin,[-74,4]);
 const registration=completeLocalRegistration(store,draft);assert.equal(registration.form.location_mode,'pin');assert.match(locationSummary(registration.form),/Pin aproximado confirmado/);
 assert.equal(registration.form.parcel_geometry,undefined);
});

test('continuar lee la confirmación visible aunque el estado anterior no haya recibido el evento del editor',()=>{
 const form={location_pin:[-74,4],location_pin_confirmed:false};
 let checked=true;const controls={querySelector:selector=>selector==='[data-pin-confirm]'?{checked}:null};
 captureLocationConfirmation(form,controls);
 assert.doesNotThrow(()=>normalizeLocationPin({coordinates:form.location_pin,confirmed:form.location_pin_confirmed}));
 checked=false;captureLocationConfirmation(form,controls);assert.equal(form.location_pin_confirmed,false);
 assert.throws(()=>normalizeLocationPin({coordinates:form.location_pin,confirmed:form.location_pin_confirmed}));
 captureLocationConfirmation(form,{querySelector:()=>null});assert.equal(form.location_pin_confirmed,false);
});

test('los datos esenciales exigen dirección catastral y área declarada incluso con polígono',()=>{
 const form={cadastral_address:'Predio ficticio',area:'6400.5',parcel_geometry:{type:'Polygon'}};
 assert.doesNotThrow(()=>validateTerrainDetails(form));
 for(const area of ['',undefined,'NaN','Infinity','0','-1'])assert.throws(()=>validateTerrainDetails({...form,area}),/área declarada/);
 assert.throws(()=>validateTerrainDetails({...form,cadastral_address:'   '}),/dirección catastral/);
});

test('el recorrido guarda y recupera dirección, área, pin, negociación y referencias de fotos sin alterar el área',()=>{
 const id=crypto.randomUUID(),store={submissions:[]};
 const form={client_id:id,title:'Prueba de recorrido',cadastral_address:'Predio ficticio de pruebas',area:'6400.5',location_mode:'pin',location_pin:[-74,4],location_pin_confirmed:true,negotiation:'sale',value_status:'known',amount:'900000000',price_method:'cop',visibility:'off-market'};
 for(let step=1;step<=4;step++){putDraft(store,{kind:'terreno',step,form,files:[{origin:'demo',name:'Foto ficticia.jpg'}]});const recovered=chooseDraft(store,'terreno',id);assert.equal(recovered.step,step);validateTerrainDetails(recovered.form);assert.equal(recovered.form.location_pin_confirmed,true);assert.equal(recovered.form.area,'6400.5');}
 const completed=completeLocalRegistration(store,chooseDraft(store,'terreno',id));
 assert.equal(completed.form.cadastral_address,form.cadastral_address);assert.equal(completed.form.amount,form.amount);assert.equal(completed.files[0].name,'Foto ficticia.jpg');assert.equal(chooseDraft(store,'terreno',id),null);
});
