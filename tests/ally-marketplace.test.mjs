import test from 'node:test';
import assert from 'node:assert/strict';
import {specialists} from '../web/specialist-landings.js';
import {publicAllyProfiles} from '../web/public-ally-profiles.js';
import {marketplaceState,marketplaceHref,marketplaceResults,savedAllies,serviceHref} from '../web/ally-marketplace-model.js';
import {allyMarketplaceHTML,marketplaceResultsHTML} from '../web/ally-marketplace.js';
const state=p=>marketplaceState(new URLSearchParams(p),specialists);
test('marketplace filters survive links, reject unknown facets and preserve legacy role searches',()=>{
 const input=state('q=Suárez&grupo=legal&especialidad=abogados&departamento=11&tipo=company&vista=guardados&formato=lista&orden=nombre');
 assert.deepEqual(state(marketplaceHref(input).split('?')[1]),input);
 assert.equal(state('especialidad=made-up&grupo=no&tipo=bad&vista=bad&departamento=99').specialty,'');
 assert.equal(state('especialidad=made-up&grupo=no&tipo=bad&vista=bad&departamento=99').group,'all');
 assert.equal(state('rol=Constructores').query,'Constructores');
 assert.equal(state('q='+'x'.repeat(200)).query.length,160);
});
test('profile facets distinguish specialties and company type without inventing coverage or providers',()=>{
 assert.equal(marketplaceResults(state('especialidad=abogados&tipo=company'),publicAllyProfiles,specialists).firms.length,1);
 assert.equal(marketplaceResults(state('especialidad=constructores'),publicAllyProfiles,specialists).firms.length,0);
 assert.equal(marketplaceResults(state('tipo=person'),publicAllyProfiles,specialists).firms.length,0);
 assert.equal(marketplaceResults(state('q=Suárez y Gómez'),publicAllyProfiles,specialists).firms.length,1);
 assert.equal(marketplaceResults(state('departamento=05'),publicAllyProfiles,specialists).firms.length,1);
 assert.equal(serviceHref('constructores','05'),'#/solicitar-servicio/constructores?departamento=05');
});
test('saved selection never admits a private, missing or duplicate profile and can be filtered again',()=>{
 const slug=publicAllyProfiles[0].slug;
 assert.deepEqual(savedAllies(JSON.stringify([slug,slug,'private-profile']),publicAllyProfiles),[slug]);
 assert.deepEqual(savedAllies('bad json',publicAllyProfiles),[]);
 assert.equal(marketplaceResults(state('vista=guardados'),publicAllyProfiles,specialists,[]).firms.length,0);
 assert.equal(marketplaceResults(state('vista=guardados'),publicAllyProfiles,specialists,[slug]).firms.length,1);
 assert.equal(marketplaceResults(state('vista=guardados&grupo=tecnicos'),publicAllyProfiles,specialists,[slug]).firms.length,0);
});
test('technical and sector searches expose the right services and counts remain truthful',()=>{
 const technical=marketplaceResults(state('grupo=tecnicos&vista=especialidades'),publicAllyProfiles,specialists);
 assert.equal(technical.roles.length,11);assert.ok(technical.roles.every(s=>s.specialty));
 assert.deepEqual(marketplaceResults(state('especialidad=desarrolladores-logisticos&vista=especialidades'),publicAllyProfiles,specialists).roles.map(s=>s.slug),['desarrolladores-logisticos']);
 const html=marketplaceResultsHTML(state('especialidad=constructores'),specialists);
 assert.match(html,/Aún no hay perfiles públicos de constructores/);assert.match(html,/#\/solicitar-servicio\/constructores/);
 assert.ok(!html.includes('Suarez y Gomez'));
});
test('marketplace has accessible result tabs, native mobile filter dialog and escapes search text',()=>{
 const html=allyMarketplaceHTML({specialists,icon:()=>''});
 assert.equal((html.match(/role="tab" /g)||[]).length,3);assert.match(html,/<dialog/);assert.match(html,/aria-labelledby="am-tab-perfiles"/);
 assert.match(html,/Sede publicada/);assert.ok(!html.includes('verificado'));assert.ok(!html.includes('★'));
 const result=marketplaceResultsHTML(state('q=%3Cscript%3E'),specialists);
 assert.ok(!result.includes('<script>'));assert.match(result,/&lt;script&gt;/);
});

test('empty saved and service views explain the actual result without erasing an existing selection',()=>{
 const selected=publicAllyProfiles[0].slug;
 const filtered=marketplaceResultsHTML(state('vista=guardados&especialidad=constructores'),specialists,[selected]);
 assert.match(filtered,/Ningún guardado coincide/);assert.ok(!filtered.includes('Tu selección empieza aquí'));
 assert.match(marketplaceResultsHTML(state('vista=especialidades&q=inexistente'),specialists),/No encontramos especialidades/);
});

test('returning from a profile retains only an internal marketplace destination',async()=>{
 const {marketplaceReturnHref}=await import('../web/ally-marketplace-model.js');
 assert.equal(marketplaceReturnHref('#/aliados/buscar?q=fiducia&grupo=legal'),'#/aliados/buscar?q=fiducia&grupo=legal');
 for(const href of ['https://other.test','javascript:alert(1)','#/mi-espacio',null])assert.equal(marketplaceReturnHref(href),'#/aliados/buscar');
});
