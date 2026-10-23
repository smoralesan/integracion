import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleApi} from '../worker/api.js';
import {MemoryBucket} from './support/memory-bucket.mjs';
import {normalizeProfessional} from '../web/professional-model.js';
import {specialistDefaults,specialists} from '../web/specialist-landings.js';
import {allyCategories,technicalSpecialties} from '../web/ally-categories.js';
const model=extra=>normalizeProfessional(extra,'Técnicos','Topógrafos');
const profile=(extra={})=>({kind:'person',name:'Especialista de prueba',category:'Técnicos',specialty:'Topógrafos',shareInProjects:false,revision:0,...extra});
function harness(){const bucket=new MemoryBucket(),env={BUCKET:bucket,II_TEAM_ROLES:JSON.stringify({'staff@example.test':'reviewer'})};const request=(path,body,{user='alice',method=body?'POST':'GET',origin='https://portal.test'}={})=>handleApi(new Request('https://portal.test/api/'+path,{method,headers:{origin,'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);return {bucket,request};}
test('all technical specialties have a landing and support primary plus additional specialties',()=>{
 assert.equal(technicalSpecialties.length,11);for(const specialty of technicalSpecialties)assert.ok(specialists.some(s=>s.specialty===specialty),specialty);
 assert.deepEqual(model({specialties:['Interventores','Topógrafos','Interventores']}).specialties,['Topógrafos','Interventores']);
});
test('professional fields validate coverage, availability and safe portfolio links',()=>{
 const data=model({coverage:[{departmentCode:'05',municipalityCode:'05001'}],portfolio:[{title:'Trabajo',url:'https://example.test/portfolio',description:'Mi participación'}],experienceYears:'8',services:'Levantamientos',availability:'limited'});assert.equal(data.coverage[0].municipalityCode,'05001');assert.equal(data.experienceYears,8);
 for(const invalid of [{coverage:[{departmentCode:'13',municipalityCode:'05001'}]},{availability:'automatic'},{portfolio:[{title:'Trabajo',url:'javascript:alert(1)'}]},{portfolio:[{title:'Trabajo',url:'https://u:p@example.test'}]},{experienceYears:'-1'},{specialties:['Inventada']},{shareWithTeam:'true'},{shareWithTeam:true}])assert.throws(()=>model(invalid));
});
test('team matching requires explicit sharing, honors revocation and preserves legacy PUT fields',async()=>{
 const h=harness(),put=(body,user='alice')=>h.request('profile',body,{user,method:'PUT'});
 let response=await put(profile({services:'Topografía',contactEmail:'contact@example.test',specialties:['Interventores'],coverage:[{departmentCode:'05',municipalityCode:'05001'}]}));assert.equal(response.status,200);
 let p=(await response.json()).profile;assert.equal((await h.request('team/ally-profiles')).status,403);assert.equal((await(await h.request('team/ally-profiles',null,{user:'staff'})).json()).profiles.length,0);
 response=await put(profile({revision:p.revision,shareWithTeam:true}));assert.equal(response.status,200);p=(await response.json()).profile;assert.equal(p.services,'Topografía');assert.ok(p.specialties.includes('Interventores'));assert.equal(p.coverage[0].municipalityCode,'05001');
 const list=await(await h.request('team/ally-profiles',null,{user:'staff'})).json();assert.equal(list.profiles.length,1);assert.equal(list.profiles[0].contactEmail,'contact@example.test');assert.equal(list.profiles[0].profileKey,undefined);
 await put(profile({revision:p.revision,shareWithTeam:false}));assert.equal((await(await h.request('team/ally-profiles',null,{user:'staff'})).json()).profiles.length,0);
 assert.equal((await(await h.request('profile',null,{user:'bob'})).json()).profile,null);
});
const service=()=>({id:crypto.randomUUID(),specialistSlug:'topografos',name:'Promotor de prueba',description:'Necesito un levantamiento para evaluar el terreno.',contactEmail:'promotor@example.test',departmentCode:'13',municipalityCode:'13001',contactConsent:true});
test('service requests persist, deduplicate, isolate owners and require consent and real locations',async()=>{
 const h=harness(),body=service();assert.equal((await h.request('service-requests',{...body,contactConsent:false})).status,400);assert.equal((await h.request('service-requests',{...body,municipalityCode:'05001'})).status,400);
 const response=await h.request('service-requests',body);assert.equal(response.status,201);const r=await response.json();assert.equal(r.status,'received');assert.equal(r.owner,undefined);assert.equal((await h.request('service-requests',body)).status,200);
 assert.equal((await h.request('service-requests/'+r.id,null,{user:'bob'})).status,404);assert.equal((await h.request('service-requests',body,{user:'bob'})).status,409);assert.equal((await h.request('team/service-requests')).status,403);assert.equal((await h.request('service-requests',service(),{origin:'https://evil.test'})).status,403);
 assert.equal((await(await h.request('service-requests')).json()).requests.length,1);
});
test('team follow-up validates transitions and revisions while keeping internal notes private',async()=>{
 const h=harness(),r=await(await h.request('service-requests',service())).json(),path='team/service-requests/'+r.id;
 const patch=body=>h.request(path,body,{user:'staff',method:'PATCH'});
 assert.equal((await patch({revision:0,status:'connected',message:'No se puede saltar'})).status,400);
 let update=await patch({revision:0,status:'in_review',assignee:'Equipo técnico',internalNote:'NOTA PRIVADA'});assert.equal(update.status,200);
 assert.equal((await patch({revision:0,status:'needs_information',message:'Datos'})).status,409);
 assert.equal((await patch({revision:1,status:'needs_information'})).status,400);
 update=await patch({revision:1,status:'needs_information',message:'Confirma el alcance.'});assert.equal(update.status,200);
 const own=await(await h.request('service-requests/'+r.id)).json();assert.equal(own.internalNotes,undefined);assert.equal(own.assignee,'Equipo técnico');assert.equal(JSON.stringify(own).includes('NOTA PRIVADA'),false);
 const reply=await h.request('service-requests/'+r.id+'/reply',{revision:2,message:'Alcance aclarado.'});assert.equal(reply.status,200);assert.equal((await reply.json()).status,'in_review');
 assert.equal((await(await h.request('team/service-requests',null,{user:'staff'})).json()).requests.length,1);
});

test('Legal specialists lead the network and support private profiles and service requests',async()=>{
 assert.equal(allyCategories[0],'Abogados (legales)');
 const legal=specialists[0];assert.equal(legal.slug,'abogados');assert.deepEqual(specialistDefaults(legal),{category:'Abogados (legales)',specialty:''});
 const h=harness(),response=await h.request('profile',profile({category:'Abogados (legales)',specialty:'',services:'Estudio de títulos y revisión de contratos'}),{method:'PUT'});
 assert.equal(response.status,200);const p=(await response.json()).profile;assert.equal(p.category,'Abogados (legales)');assert.equal(p.specialty,'');
 const request=await h.request('service-requests',{...service(),specialistSlug:'abogados',description:'Solicito definir el alcance de una revisión documental.'});assert.equal(request.status,201);const saved=await request.json();assert.equal(saved.specialistSlug,'abogados');assert.equal(saved.category,'Abogados (legales)');
});
