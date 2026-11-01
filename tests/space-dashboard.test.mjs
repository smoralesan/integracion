import {actualEntryHash} from '../web/email-entry.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSpaceInventory,filterSpaceInventory,draftNextStep,inventoryCardsHTML,resolveSpaceTab} from '../web/space-dashboard.js';
import {requestNextStep,requestCardsHTML} from '../web/space-requests.js';
const id='4be55c58-ddde-491e-bde4-12e5097a7e1b';
const draft=(overrides={})=>({kind:'terreno',step:1,form:{client_id:id,title:'Terreno en Medellín'},updatedAt:'2026-11-01T10:00:00Z',...overrides});
const completed=()=>({id:'TER-DEMO-'+id,clientId:id,kind:'terreno',localRegistration:true,form:{title:'Versión anterior'},createdAt:'2026-10-31T10:00:00Z'});
test('draft and prior local demonstration occupy one row without losing the previous version',()=>{
 const saved={draft:draft(),drafts:[draft()],submissions:[completed()]},before=structuredClone(saved),rows=buildSpaceInventory(saved);
 assert.equal(rows.length,1);assert.equal(rows[0].status,'draft');assert.equal(rows[0].title,'Terreno en Medellín');assert.match(rows[0].action.href,/borrador=/);assert.match(rows[0].previous.href,/confirmacion/);assert.equal(rows[0].isDemo,true);assert.deepEqual(saved,before);
});
test('matching titles never merge different properties, nor a demonstration with an account record',()=>{
 const saved={draft:draft(),submissions:[completed()]},record={id,kind:'terreno',form:{title:'Terreno en Medellín',visibility:'off-market'},status:'approved',reference:'TER-REAL',updatedAt:'2026-11-01T12:00:00Z'};
 const rows=buildSpaceInventory(saved,[record]);assert.equal(rows.length,2);assert.equal(rows[0].source,'account');assert.equal(rows[0].isDemo,false);assert.equal(rows[1].source,'local');
});
test('Off-market can never acquire a public-fiche action, including inconsistent legacy states',()=>{
 const rows=buildSpaceInventory({},[{id,publicationId:id,kind:'terreno',form:{title:'Privado',visibility:'off-market'},status:'published'}]);assert.equal(rows[0].publication,null);assert.equal(rows[0].label,'Gestión Off-market');assert.equal(filterSpaceInventory(rows,{status:'published'}).length,0);assert.equal(filterSpaceInventory(rows,{status:'off-market'}).length,1);
});
test('inventory filters tolerate accents, preserve sources, and do not mutate records',()=>{
 const rows=buildSpaceInventory({draft:draft(),submissions:[]},[{id:'another',kind:'proyecto',form:{title:'Proyecto en Cali'},status:'needs_information'}]),before=structuredClone(rows);
 assert.equal(filterSpaceInventory(rows,{query:'medellin'}).length,1);assert.equal(filterSpaceInventory(rows,{status:'needs_information'}).length,1);assert.equal(filterSpaceInventory(rows,{status:'draft'}).length,1);assert.deepEqual(rows,before);
});
test('draft hints name pending fields without treating unknown obligations as a debt or a blocker',()=>{
 assert.match(draftNextStep(draft()),/departamento y municipio/);
 const text=draftNextStep(draft({step:3,form:{land_situation:{obligations:Object.fromEntries(['predial','valorizacion','administracion','servicios','otras'].map(key=>[key,{status:'unknown'}]))}}}));assert.doesNotMatch(text,/Por completar/);assert.match(text,/situación del terreno/);
});
test('cards escape user content and display source, next step and last save instead of invented dates',()=>{
 const rows=buildSpaceInventory({draft:draft({form:{client_id:id,title:'<script>alert(1)</script>'},updatedAt:undefined}),submissions:[]}),html=inventoryCardsHTML(rows);
 assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/En este navegador/);assert.match(html,/Último guardado: Fecha no disponible/);
});
test('request stages keep registered interest, review and authorized contact distinct',()=>{
 assert.match(requestNextStep({status:'received'},'interest'),/registrado/);assert.match(requestNextStep({status:'in_review'},'interest'),/revisando/);assert.match(requestNextStep({status:'awaiting_authorization'},'interest'),/pendiente de autorización/);assert.match(requestNextStep({status:'contact_authorized'},'interest'),/contacto fue autorizado/);
 const html=requestCardsHTML([{id,title:'Ignored',source:{kind:'demo',snapshot:{title:'Ejemplo'}},status:'received'}],'interest');assert.match(html,/Seguimiento de ejemplo/);assert.match(html,/#\/mis-intereses\//);
});
test('only known workspace sections are routable and legacy interest tabs still resolve',()=>{
 assert.equal(resolveSpaceTab('favorites'),'favorites');assert.equal(resolveSpaceTab('interests'),'requests');assert.equal(resolveSpaceTab('__proto__'),'submissions');assert.equal(resolveSpaceTab(null,'drafts'),'drafts');assert.equal(resolveSpaceTab(null,'interests'),'requests');
});

test('switching to actual access preserves the selected draft or an explicit new registration',()=>{
 const d=draft();assert.equal(new URLSearchParams(actualEntryHash('terreno',d,'#/publicar/terreno?borrador='+id).split('?')[1]).get('borrador'),id);
 const fresh=actualEntryHash('terreno',d,'#/publicar/terreno?nuevo=1');assert.match(fresh,/nuevo=1/);assert.doesNotMatch(fresh,/borrador=/);
 assert.doesNotMatch(actualEntryHash('proyecto',{form:{client_id:'bad'}},''),/borrador=/);
});

test('repeated account pages do not duplicate the same record or merge different source scopes',()=>{
 const old={id,kind:'terreno',status:'received',form:{title:'Anterior'}},next={...old,status:'in_review',form:{title:'Actualizado'}};
 const rows=buildSpaceInventory({},[old,next]);assert.equal(rows.length,1);assert.equal(rows[0].title,'Actualizado');assert.equal(rows[0].label,'En revisión');
});
