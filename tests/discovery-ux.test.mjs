import test from 'node:test';
import assert from 'node:assert/strict';
import {specialists} from '../web/specialist-landings.js';
import {allyNetworkHTML} from '../web/ally-network.js';
import {publicAllyProfiles} from '../web/public-ally-profiles.js';
import {marketplaceResultsHTML} from '../web/ally-marketplace.js';
import {marketplaceState} from '../web/ally-marketplace-model.js';
import {specialistMatches,discoveryFiltersHTML,specialistDirectoryHTML,publicAllyMatches} from '../web/discovery-ux.js';
test('Specialty discovery keeps legal first, exposes technical specialties by search and honors service groups',()=>{
 const initial=specialists.filter(s=>specialistMatches(s,''));assert.equal(initial[0].slug,'abogados');assert.equal(initial.length,10);
 assert.ok(specialists.filter(s=>specialistMatches(s,'hidraulico')).some(s=>s.slug==='disenadores-hidraulicos'));
 const technical=specialists.filter(s=>specialistMatches(s,'','tecnicos'));assert.equal(technical.length,11);assert.ok(technical.every(s=>s.specialty));
 assert.deepEqual(specialists.filter(s=>specialistMatches(s,'','legal')).map(s=>s.slug),['abogados']);
});
test('Directory offers separate service and registration routes without fabricating public profiles',()=>{
 const html=specialistDirectoryHTML({icon:()=>'',specialists});assert.match(html,/Buscador de aliados/);assert.ok(!html.includes('data-du-intent'));assert.ok(!html.includes('data-du-provider-copy'));assert.match(marketplaceResultsHTML({...marketplaceState(new URLSearchParams(),specialists),view:'especialidades'},specialists),/#\/solicitar-servicio\/abogados/);assert.match(html,/#\/perfil-aliado\/suarez-y-gomez-abogados/);assert.ok(!html.includes('verificado'));
});
test('Unified search has one query and associates advanced controls with its form',()=>{
 const html=discoveryFiltersHTML({state:{query:'<script>',type:'terreno'},icon:()=>'',priceLimits:[],filterChipsHTML:()=>''});assert.equal((html.match(/name="query"/g)||[]).length,1);assert.match(html,/&lt;script&gt;/);assert.match(html,/name="type" form="opportunity-filters"/);assert.match(html,/name="type" form="opportunity-filters" value="terreno"/);assert.match(html,/name="landContent" form="opportunity-filters"/);
});

test('La presentación de aliados muestra solo perfiles públicos y lleva a un buscador independiente',()=>{
 const html=allyNetworkHTML({icon:()=>'',specialists});
 assert.ok(!html.includes('data-du-query'));assert.ok(!html.includes('data-specialist-directory'));
 assert.match(html,/#\/aliados\/buscar/);assert.match(html,/#\/registro\/aliado/);
 assert.match(html,/#\/perfil-aliado\/suarez-y-gomez-abogados/);
 assert.ok(html.indexOf('#/aliados/abogados')<html.indexOf('#/aliados/estructuradores'));
 assert.ok(!html.includes('verificado'));
});
test('Buscar firmas incluye nombres y áreas de negocio, respeta grupos y no genera perfiles',()=>{
 const p=publicAllyProfiles[0];
 for(const q of ['Suárez y Gómez','fiducia','aporte de terrenos','auditoría'])assert.ok(publicAllyMatches(p,q,'all',specialists),q);
 assert.ok(publicAllyMatches(p,'fiduciario','legal',specialists));
 assert.equal(publicAllyMatches(p,'fiduciario','tecnicos',specialists),false);
 assert.equal(publicAllyMatches(p,'no existente','all',specialists),false);
});
