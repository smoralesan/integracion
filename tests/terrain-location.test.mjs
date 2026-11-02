import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLocationPin,terrainLocationMode,locationSummary,captureLocationConfirmation} from '../web/terrain-location.js';
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
