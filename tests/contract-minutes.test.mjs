import test from 'node:test';
import assert from 'node:assert/strict';
import {contractDraft,contractMinutes,contractMinutesPage} from '../web/contract-minutes.js';
test('Contract examples remain incomplete drafts, retain required decisions and do not invent financial terms',()=>{
 for(const t of contractMinutes){
  const draft=contractDraft(t.id);
  assert.match(draft,/BORRADOR ORIENTATIVO · INCOMPLETO/);
  assert.ok(!draft.includes('undefined'));assert.ok(!draft.includes('{{'));
  assert.match(draft,/\[NOMBRE O RAZÓN SOCIAL A\]/);assert.match(draft,/\[MUNICIPIO Y DEPARTAMENTO\]/);
  for(const clause of t.clauses)assert.ok(draft.includes(clause[0].toLocaleUpperCase('es')));
 }
 assert.equal(contractDraft('__proto__'),'');
 assert.match(contractMinutesPage('unknown'),/Minuta no encontrada/);
});
test('Compensation variants and broker exclusivity generate distinct, conditional language',()=>{
 const cash=contractDraft('aporte-terreno',{compensation:'cash'}),units=contractDraft('aporte-terreno',{compensation:'units'}),mixed=contractDraft('aporte-terreno',{compensation:'mixed'});
 assert.match(cash,/dinero posterior al hito/);assert.match(cash,/FECHA LÍMITE/);
 assert.match(units,/UNIDADES, ÁREAS Y PARQUEADEROS/);assert.match(mixed,/Retribución mixta/);
 assert.match(contractDraft('corretaje-inmobiliario',{exclusivity:'yes'}),/Se propone exclusividad/);
 assert.match(contractDraft('corretaje-inmobiliario',{exclusivity:'no'}),/No se pacta exclusividad/);
 assert.match(contractDraft('corretaje-inmobiliario',{exclusivity:'other'}),/No se pacta exclusividad/);
});
test('Free text cannot inject document clauses through newlines, and values never mutate the source templates',()=>{
 const before=JSON.stringify(contractMinutes);
 const text=contractDraft('promesa-compraventa',{partyA:'Nombre\nCLÁUSULA FALSA\r\nOtra línea',reference:'TER-001',city:'Pereira, Risaralda'});
 assert.ok(!text.includes('\nCLÁUSULA FALSA'));
 assert.match(text,/TER-001/);assert.match(text,/Pereira, Risaralda/);
 assert.equal(JSON.stringify(contractMinutes),before);
 assert.match(contractDraft('servicios-profesionales',{partyA:' '.repeat(5)}),/\[NOMBRE O RAZÓN SOCIAL A\]/);
});

test('Unknown compensation options use the mixed draft without exposing inherited object properties',()=>{for(const value of ['__proto__','constructor','toString'])assert.match(contractDraft('aporte-terreno',{compensation:value}),/Retribución mixta/);});
