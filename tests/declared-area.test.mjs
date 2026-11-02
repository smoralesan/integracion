import test from 'node:test';
import assert from 'node:assert/strict';
import {formatDeclaredArea} from '../web/declared-area.js';
import {terrainDetailHTML} from '../web/terrain-detail.js';
import {properties} from '../web/opportunity-examples.js';
import {publicSummary} from '../web/workflow-model.js';
import {OpportunityExperience} from '../web/opportunity-experience.js';
test('el área conserva los decimales y separa miles sin alterar el valor declarado',()=>{
 assert.equal(formatDeclaredArea(5200.75),'5.200,75');assert.equal(formatDeclaredArea('5200.7512345'),'5.200,7512345');assert.equal(formatDeclaredArea('5200.7500'),'5.200,75');assert.equal(formatDeclaredArea('5200'),'5.200');assert.equal(formatDeclaredArea('999999999999999.1234567'),'999.999.999.999.999,1234567');
});
test('el título y resumen de ficha no redondean la medida a metros enteros',()=>{
 const original=properties.find(p=>p.id==='TER-DEMO-001'),sample={...original,area:5200.75};const html=terrainDetailHTML(sample);assert.ok((html.match(/5\.200,75 m²/g)||[]).length>=2);assert.doesNotMatch(html,/5\.201 m²/);assert.equal(sample.area,5200.75);
});
test('la publicación preserva más de dos decimales de área sin relajar el formato del dinero',()=>{
 const result=publicSummary({kind:'terreno',form:{area:'5200.751234',amount:'100.123',amount_usd:'25.50'}});assert.equal(result.area,'5200.751234');assert.equal(result.amount,undefined);assert.equal(result.amount_usd,'25.50');
});
test('la tabla de comparación conserva los decimales de la superficie',()=>{
 const html=OpportunityExperience.prototype.comparisonHTML.call({},[{area:5200.7512,amount:null,title:'Prueba',href:'#/oportunidad/TER-DEMO-001',compareKey:'demo:TER-DEMO-001',isDemo:true}]);assert.match(html,/5\.200,7512 m²/);
});
