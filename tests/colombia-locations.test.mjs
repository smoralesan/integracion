import test from 'node:test';
import assert from 'node:assert/strict';
import {departments,municipalities,municipalitiesFor,resolveLocation,normalizeLocationDraft} from '../web/colombia-locations.js';
import {matchesDirectory} from '../web/footer-directory.js';

test('supplied DIVIPOLA covers every unique source code including special territories',()=>{
  assert.equal(departments.length,33);
  assert.equal(municipalities.length,1122);
  assert.equal(new Set(municipalities.map(m=>m.code)).size,1122);
  assert.equal(municipalities.filter(m=>m.type==='Área no municipalizada').length,18);
  assert.equal(municipalities.filter(m=>m.type==='Isla').length,1);
  for(const m of municipalities){assert.match(m.code,/^\d{5}$/);assert.ok(departments.some(d=>d.code===m.departmentCode));}
  assert.equal(municipalitiesFor('11')[0].code,'11001');
  assert.ok(municipalitiesFor('05').every(m=>m.code.startsWith('05')));
  assert.deepEqual(municipalitiesFor(''),[]);
});
test('codes preserve zeros, canonicalize names and reject mismatched or partial selections',()=>{
  assert.deepEqual(resolveLocation({department_code:'05',municipality_code:'05001',region:'Wrong',city:'Wrong'}),{department_code:'05',municipality_code:'05001',region:'Antioquia',city:'Medellín'});
  assert.equal(resolveLocation({department_code:'05',municipality_code:'08001'}),null);
  assert.equal(resolveLocation({department_code:'5',municipality_code:'05001'}),null);
  assert.equal(resolveLocation({department_code:'13',city:'Cartagena',region:'Bolívar'}),null);
});
test('legacy drafts resolve known names and aliases without inventing unknown locations',()=>{
  assert.equal(resolveLocation({city:'Cartagena',region:'Bolívar'}).municipality_code,'13001');
  assert.equal(resolveLocation({city:'Bogotá',region:'Bogotá D.C.'}).municipality_code,'11001');
  const draft=normalizeLocationDraft({city:'Unknown',region:'Antioquia',title:'Draft',neighborhood:'Dato guardado'});
  assert.equal(draft.department_code,'05');assert.equal(draft.municipality_code,'');assert.equal(draft.city,'');assert.equal(draft.title,'Draft');assert.equal(draft.neighborhood,'Dato guardado');
  assert.ok(matchesDirectory({kind:'terreno',city:'Cartagena de Indias',region:'Bolívar'},{city:'Cartagena'}));
  assert.ok(matchesDirectory({kind:'terreno',city:'Bogotá, D. C.',region:'Bogotá, D. C.'},{city:'Bogotá'}));
});
