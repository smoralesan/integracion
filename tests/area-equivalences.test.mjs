import test from 'node:test';
import assert from 'node:assert/strict';
import {areaEquivalences,areaEquivalencesHTML} from '../web/area-equivalences.js';
test('convierte el área declarada y limpia los resultados vacíos o inválidos',()=>{
 assert.deepEqual(areaEquivalences('6400'),{ha:'0,64',fanegadas:'1',cuadras:'1',pies2:'68.889,026667',varas2:'10.000'});
 assert.deepEqual(areaEquivalences('10000'),{ha:'1',fanegadas:'1,5625',cuadras:'1,5625',pies2:'107.639,104167',varas2:'15.625'});
 for(const value of ['',-1,0,'no',Infinity])assert.deepEqual(areaEquivalences(value),{ha:'',fanegadas:'',cuadras:'',pies2:'',varas2:''});
 const html=areaEquivalencesHTML(6400);assert.equal((html.match(/readonly/g)||[]).length,5);assert.doesNotMatch(html,/name=/);
});

test('pies y varas cuadradas usan sus factores de superficie y se actualizan sin modificar el área del formulario',async()=>{
 const {updateAreaEquivalences}=await import('../web/area-equivalences.js');
 assert.equal(areaEquivalences('0.09290304').pies2,'1');assert.equal(areaEquivalences('0.64').varas2,'1');
 const values=new Map();const root={querySelector:selector=>{if(!values.has(selector))values.set(selector,{value:''});return values.get(selector);}};
 updateAreaEquivalences(root,'6400');assert.equal(values.get('[data-area-equivalent="pies2"]').value,'68.889,026667');assert.equal(values.get('[data-area-equivalent="varas2"]').value,'10.000');
 updateAreaEquivalences(root,'');for(const field of values.values())assert.equal(field.value,'');
});
