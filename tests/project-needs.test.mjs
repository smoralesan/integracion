import test from 'node:test';
import assert from 'node:assert/strict';
import {needProjects} from '../web/project-needs-data.js';
import {specialistBySlug} from '../web/specialist-landings.js';
import {normalizeNeedZone,addNeedZone,emptyNeedFilters,normalizeNeedFilters,matchesNeedProject,matchingProjectNeeds,readNeedFilters,needFilterQuery} from '../web/project-needs-model.js';
import {normalizeNeedProposal} from '../web/project-needs-ui.js';
const filters=v=>({...emptyNeedFilters(),...v});
const ids=v=>needProjects.filter(p=>matchesNeedProject(p,filters(v))).map(p=>p.id);
test('Projects have consistent DIVIPOLA locations, specialist references and distinct needs',()=>{
 assert.equal(needProjects.length,6);assert.equal(new Set(needProjects.map(p=>p.id)).size,6);assert.equal(needProjects.reduce((a,p)=>a+p.needs.length,0),20);
 for(const p of needProjects){for(const l of p.locations)assert.deepEqual(normalizeNeedZone(l),l);assert.equal(new Set(p.needs.map(n=>n.id)).size,p.needs.length);for(const n of p.needs){assert.ok(specialistBySlug(n.specialist));assert.ok(n.deliverables.length);}}
});
test('Multiple specialties and zones use OR within each group and AND across groups',()=>{
 assert.deepEqual(ids({roles:['abogados']}),['NEC-DEMO-001']);
 assert.deepEqual(ids({roles:['constructores','financiadores']}),['NEC-DEMO-001','NEC-DEMO-002']);
 assert.deepEqual(ids({roles:['constructores','financiadores'],zones:[{departmentCode:'13'}]}),['NEC-DEMO-002']);
 assert.deepEqual(ids({zones:[{departmentCode:'08',municipalityCode:'08001'},{departmentCode:'05',municipalityCode:'05615'}]}),['NEC-DEMO-001','NEC-DEMO-004','NEC-DEMO-006']);
 assert.deepEqual(ids({stages:['Planeación','Preventa']}),['NEC-DEMO-002','NEC-DEMO-003']);
 assert.deepEqual(ids({query:'logistica'}),['NEC-DEMO-005']);
 assert.deepEqual(ids({type:'Turístico',stages:['Planeación']}),[]);
});
test('Specialty and attention must match the same need',()=>{
 const p=needProjects[0];assert.equal(matchesNeedProject(p,filters({roles:['interventores'],workModes:['Remota']})),false);
 assert.equal(matchesNeedProject(p,filters({roles:['interventores'],workModes:['Presencial']})),true);
 assert.equal(matchingProjectNeeds(p,filters({roles:['tecnicos']})).length,1);
 assert.equal(matchesNeedProject(p,filters({roles:['tecnicos'],workModes:['Remota']})),false);
});
test('Zones deduplicate, whole department subsumes municipalities and inconsistent codes never broaden',()=>{
 const city={departmentCode:'05',municipalityCode:'05615'},dept={departmentCode:'05',municipalityCode:''};
 assert.equal(normalizeNeedZone({departmentCode:'05',municipalityCode:'08001'}),null);
 assert.equal(normalizeNeedZone({departmentCode:'05',municipalityCode:'invalid'}),null);
 assert.deepEqual(addNeedZone(addNeedZone([],city),city),[city]);
 assert.deepEqual(addNeedZone([city],dept),[dept]);assert.deepEqual(addNeedZone([dept],city),[dept]);
 assert.throws(()=>addNeedZone([],{departmentCode:'xx'}));
 assert.deepEqual(readNeedFilters('zona=05:08001').zones,[]);
});
test('URLs round-trip applied multi filters and default shows all projects',()=>{
 const f=normalizeNeedFilters({query:'diseño',roles:['tecnicos','constructores','tecnicos','bad'],zones:[{departmentCode:'05'},{departmentCode:'25',municipalityCode:'25175'}],stages:['Origen','Diseño'],workModes:['Mixta','Remota'],type:'Residencial'});
 assert.deepEqual(readNeedFilters(needFilterQuery(f)),f);assert.equal(ids({}).length,6);
});
const valid={projectId:'NEC-DEMO-001',needId:'INT',message:'Puedo realizar la inspección técnica y definir el alcance.',availability:'En 2 a 4 semanas',demoAcknowledged:true,portfolio:'https://example.com/portafolio'};
test('Demo proposal derives identity from trusted requirement and requires explicit acknowledgement',()=>{
 const p=normalizeNeedProposal({...valid,role:'falso',title:'falso'});assert.equal(p.role,'Interventores');assert.equal(p.reference,'NEC-DEMO-001:INT');assert.equal(p.kind,'need-proposal');
 assert.throws(()=>normalizeNeedProposal({...valid,demoAcknowledged:false}));assert.throws(()=>normalizeNeedProposal({...valid,needId:'UNKNOWN'}));assert.throws(()=>normalizeNeedProposal({...valid,message:'corto'}));assert.throws(()=>normalizeNeedProposal({...valid,availability:'mañana'}));
});
test('Portfolio links reject non-HTTPS, embedded credentials and malformed URLs',()=>{
 for(const portfolio of ['javascript:alert(1)','http://example.com','https://user:password@example.com','no-url'])assert.throws(()=>normalizeNeedProposal({...valid,portfolio}));
 assert.equal(normalizeNeedProposal({...valid,portfolio:''}).portfolio,'');
});
