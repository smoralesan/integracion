import test from 'node:test';
import assert from 'node:assert/strict';
import {properties} from '../web/opportunity-examples.js';
import {hasConstructionProject,terrainContentLabel,constructionProjectHTML} from '../web/terrain-project.js';
import {matchesOpportunityFilters} from '../web/opportunity-filters.js';
import {specialistBySlug} from '../web/specialist-landings.js';
const lots=properties.filter(p=>p.type==='terreno');
test('Terrain examples explicitly distinguish bare land, associated development and standalone projects',()=>{
 assert.equal(lots.length,4);assert.equal(lots.filter(p=>p.landContent==='land-only').length,2);assert.equal(lots.filter(hasConstructionProject).length,2);
 assert.equal(terrainContentLabel({type:'terreno'}),'');
 for(const p of properties.filter(p=>p.type==='proyecto')){assert.equal(terrainContentLabel(p),'');assert.equal(hasConstructionProject(p),false);}
});
test('Construction projects belong to the same lot and preserve independent land area and program metrics',()=>{
 const references=new Set();for(const p of lots.filter(hasConstructionProject)){const d=p.developmentProject;assert.equal(d.landReference,p.id);assert.ok(!references.has(d.id));references.add(d.id);for(const value of [p.area,d.builtArea,d.units,d.buildings,d.floors,d.parking,d.durationMonths])assert.ok(Number.isInteger(value)&&value>0);assert.ok(d.documents.length);assert.equal(d.specialists[0],'abogados');for(const slug of d.specialists)assert.ok(specialistBySlug(slug));assert.ok(d.priceScope);assert.ok(d.license);}
});
test('Missing or unrelated project metadata cannot create a construction section',()=>{
 const withProject=lots.find(hasConstructionProject);assert.equal(constructionProjectHTML(lots[0]),'');assert.equal(constructionProjectHTML({...withProject,developmentProject:{...withProject.developmentProject,landReference:'OTHER'}}),'');
 const html=constructionProjectHTML(withProject);assert.match(html,/Área del terreno/);assert.match(html,/Área construida propuesta/);assert.match(html,/archivo no aportado/);assert.ok(!html.includes('download='));
});
test('Keyword searches distinguish both terrain formats without reclassifying either as a standalone project',()=>{
 const match=q=>properties.filter(p=>matchesOpportunityFilters(p,{type:'terreno',query:q})).map(p=>p.id);
 assert.deepEqual(match('solo terreno'),['TER-DEMO-001','TER-DEMO-004']);assert.deepEqual(match('terreno con proyecto'),['TER-DEMO-002','TER-DEMO-003']);
 assert.equal(matchesOpportunityFilters(lots.find(hasConstructionProject),{type:'proyecto'}),false);
});
