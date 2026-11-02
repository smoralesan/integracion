import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogGroupsHTML} from '../web/journey-ui.js';
import {normalizePresentation,publicExperience} from '../web/opportunity-model.js';
import {ownerExperienceHTML,reactivationContextHTML} from '../web/opportunity-experience.js';
import {rescueFinanceSnapshot} from '../web/reactivation-finance.js';
import {matchesOpportunityFilters} from '../web/opportunity-filters.js';
test('la navegación y el formulario de lotes no ofrecen reactivación, pero los proyectos sí',()=>{
 assert.doesNotMatch(catalogGroupsHTML({type:'terreno'}),/reactivaci/);assert.match(catalogGroupsHTML({type:'proyecto'}),/Proyectos para reactivación/);
 const record={id:crypto.randomUUID(),kind:'terreno',form:{},files:[],revision:0,publicPresentation:{reactivation:true}};
 assert.doesNotMatch(ownerExperienceHTML(record),/rescue_|name="reactivation"|Diagnóstico de reactivación/);
 assert.match(ownerExperienceHTML({...record,kind:'proyecto'}),/Diagnóstico de reactivación del proyecto/);
});
test('las presentaciones antiguas de lotes no publican diagnóstico ni cifras de reactivación',()=>{
 const input={reactivation:true,rescue:{requiredFunds:'1000000',reason:'Obra en pausa'}};
 assert.equal(normalizePresentation(input,{kind:'terreno'}).reactivation,false);assert.equal(normalizePresentation(input,{kind:'proyecto'}).reactivation,true);assert.equal(input.reactivation,true);
 const projection=publicExperience({kind:'terreno',files:[],publicPresentation:input,publicationConsent:{version:'detail-v2'}});assert.equal(projection.reactivation,false);assert.equal(projection.rescue,null);
 assert.equal(reactivationContextHTML({kind:'terreno',reactivation:true}),'');assert.equal(rescueFinanceSnapshot({type:'terreno',reactivation:true}),null);
});
test('el catálogo de reactivación solo acepta proyectos incluso ante una marca antigua en lotes',()=>{
 const land={type:'terreno',reactivation:true},project={type:'proyecto',reactivation:true};
 assert.equal(matchesOpportunityFilters(land,{reactivationFilter:'only'}),false);assert.equal(matchesOpportunityFilters(project,{reactivationFilter:'only'}),true);
});
