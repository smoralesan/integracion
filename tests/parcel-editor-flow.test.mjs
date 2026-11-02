import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import {captureLocationConfirmation,normalizeLocationPin} from '../web/terrain-location.js';
const result=await build({entryPoints:['web/parcel-editor.js'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'parcel-core',setup(b){b.onResolve({filter:/^\.\/parcel-core\.js$/},()=>({path:resolve('lib/parcel.js')}));}}]});
const {ParcelEditor}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
test('volver de polígono a pin conserva la ubicación y el área declarada; mover pin exige confirmar de nuevo',async()=>{
 const editor=new ParcelEditor(),form={area:'6400.5'},geometry={type:'Polygon',coordinates:[[[-74,4],[-74.01,4],[-74,4.01],[-74,4]]]};
 editor.render=()=>{};editor.options={mode:'pin',pin:[-74,4],pinConfirmed:true,geometry,confirmed:true,onChange:value=>Object.assign(form,{location_mode:value.mode,location_pin:value.pin,location_pin_confirmed:value.pinConfirmed,parcel_geometry:value.geometry,parcel_confirmed:value.confirmed})};
 await editor.action('mode-polygon');assert.equal(form.location_mode,'polygon');assert.deepEqual(form.parcel_geometry,geometry);
 await editor.action('mode-pin');assert.equal(form.location_mode,'pin');assert.equal(form.location_pin_confirmed,true);assert.equal(form.area,'6400.5');
 editor.setPin([-74.02,4.02]);assert.equal(form.location_pin_confirmed,false);assert.equal(form.area,'6400.5');
 assert.throws(()=>normalizeLocationPin({coordinates:form.location_pin,confirmed:form.location_pin_confirmed}));
 captureLocationConfirmation(form,{querySelector:selector=>selector==='[data-pin-confirm]'?{checked:true}:null});assert.doesNotThrow(()=>normalizeLocationPin({coordinates:form.location_pin,confirmed:form.location_pin_confirmed}));
 await editor.action('clear-pin');assert.equal(form.location_pin,null);assert.equal(form.location_pin_confirmed,false);assert.equal(form.area,'6400.5');
});
