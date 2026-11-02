import test from 'node:test';import assert from 'node:assert/strict';
import {publicationProgressModel,publicationProgressHTML} from '../web/publication-progress.js';
test('progress follows the four terrain steps and clamps invalid step values',()=>{assert.deepEqual([1,2,3,4].map(step=>publicationProgressModel({step}).percent),[0,25,50,75]);assert.equal(publicationProgressModel({step:99}).step,4);assert.equal(publicationProgressModel({step:-1}).step,1);});
test('pin and polygon confirmation are mandatory alerts without treating optional supports as blockers',()=>{
 const pin=publicationProgressModel({step:1,form:{location_mode:'pin',location_pin:[-74,4],location_pin_confirmed:false},invalid:[{name:'title',label:'Título'},{name:'title',label:'Título'}]});assert.equal(pin.alerts.length,2);assert.ok(pin.alerts.some(x=>x.name==='location'));assert.ok(!pin.alerts.some(x=>x.name==='supports'));
 const confirmed=publicationProgressModel({step:1,form:{location_mode:'pin',location_pin:[-74,4],location_pin_confirmed:true}});assert.equal(confirmed.alerts.length,0);
 const polygon=publicationProgressModel({step:1,form:{location_mode:'polygon',parcel_geometry:{type:'Polygon'},parcel_confirmed:false}});assert.match(polygon.alerts[0].label,/Confirma/);
});
test('review keeps optional follow-ups separate and exposes accessible progress and escaped alert links',()=>{
 const model=publicationProgressModel({step:4,form:{location_mode:'pin',value_status:'pending'},error:'Error <privado>',invalid:[{name:'title',label:'Título <script>'}]});const html=publicationProgressHTML(model);assert.match(html,/aria-valuetext="Paso 4 de 4"/);assert.match(html,/Puedes completar después/);assert.match(html,/data-progress-field="title"/);assert.ok(!html.includes('<script>'));assert.match(html,/Error &lt;privado&gt;/);assert.match(html,/open/);
});
