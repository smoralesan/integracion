import test from 'node:test';
import assert from 'node:assert/strict';
import {areaEquivalences,areaEquivalencesHTML} from '../web/area-equivalences.js';
test('convierte el área declarada y limpia los resultados vacíos o inválidos',()=>{
 assert.deepEqual(areaEquivalences('6400'),{ha:'0,64',fanegadas:'1',cuadras:'1'});
 assert.deepEqual(areaEquivalences('10000'),{ha:'1',fanegadas:'1,5625',cuadras:'1,5625'});
 for(const value of ['',-1,0,'no',Infinity])assert.deepEqual(areaEquivalences(value),{ha:'',fanegadas:'',cuadras:''});
 const html=areaEquivalencesHTML(6400);assert.equal((html.match(/readonly/g)||[]).length,3);assert.doesNotMatch(html,/name=/);
});
