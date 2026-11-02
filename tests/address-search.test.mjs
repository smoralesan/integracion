import test from 'node:test';import assert from 'node:assert/strict';
import {geocodeLocation} from '../web/mapbox-map.js';import {readFile} from 'node:fs/promises';
// The build serves lib/parcel.js as parcel-core.js; resolve that alias for Node tests.
const editorSource=(await readFile(new URL('../web/parcel-editor.js',import.meta.url),'utf8')).replace(/from '([^']+)'/g,(_,path)=>"from '"+new URL(path==='./parcel-core.js'?'../lib/parcel.js':'../web/'+path.slice(2),import.meta.url).href+"'");
const {ParcelEditor}=await import('data:text/javascript;base64,'+Buffer.from(editorSource).toString('base64'));
test('parcel address searches request Colombian addresses without permanent storage',async t=>{
 let url;t.mock.method(globalThis,'fetch',async input=>{url=new URL(input);return {ok:true,json:async()=>({features:[{geometry:{coordinates:[-74.06,4.65]}}]})};});
 const rows=await geocodeLocation('Calle 72 #10-34, Bogotá',undefined,{addresses:true});assert.equal(url.searchParams.get('country'),'co');assert.ok(url.searchParams.get('types').split(',').includes('address'));assert.equal(url.searchParams.get('permanent'),'false');assert.equal(rows.length,1);
});
test('selecting an address places an unconfirmed pin and notifies the draft',async()=>{
 const editor=new ParcelEditor();let draft;editor.options={mode:'pin',onChange:value=>draft=value};editor.places=[{geometry:{coordinates:[-74.06,4.65]}}];await editor.action('place',{dataset:{index:'0'}});assert.deepEqual(draft.pin,[-74.06,4.65]);assert.equal(draft.pinConfirmed,false);assert.equal(editor.places.length,0);
});
test('address selection in polygon mode only centers the map and retains the boundary',async()=>{
 const editor=new ParcelEditor(),geometry={type:'Polygon',coordinates:[[[-74,4],[-73.9,4],[-73.9,4.1],[-74,4]]]};editor.options={mode:'polygon',geometry};const feature={geometry:{coordinates:[-74.06,4.65]}};editor.places=[feature];await editor.action('place',{dataset:{index:'0'}});assert.equal(editor.options.geometry,geometry);assert.equal(editor.place,feature);assert.equal(editor.options.pin,undefined);
});
