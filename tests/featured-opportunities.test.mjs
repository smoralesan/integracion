import test from 'node:test';
import assert from 'node:assert/strict';
import {featuredOpportunities} from '../web/featured-opportunities.js';
import {properties} from '../web/opportunity-examples.js';
const html=()=>featuredOpportunities({items:properties,state:{query:'',type:'',min:'',max:''},favorites:[],icon:()=>'',money:n=>String(n),escape:s=>String(s??'')});
test('El home separa terrenos y proyectos sin confundir terrenos con programas asociados',()=>{
 const result=html();const [land,projectSections]=result.split('<section class="featured-opportunities featured-project-section"');
 const [projects,reactivations]=projectSections.split('<section class="featured-opportunities featured-reactivation-section"');
 assert.match(land,/id="featured-terrain-title"/);assert.match(projects,/id="featured-project-title"/);
 assert.ok(!land.includes('PRO-DEMO-001'));assert.ok(!land.includes('PRO-DEMO-002'));
 assert.ok(!projects.includes('PRO-DEMO-001'));assert.ok(projects.includes('PRO-DEMO-002'));
 for(const p of properties.filter(p=>p.type==='proyecto')){
  assert.equal(projects.includes(p.id),!Boolean(p.reactivation));
  assert.equal(reactivations.includes(p.id),Boolean(p.reactivation));
 }
 assert.equal((projects.match(/<article /g)||[]).length,4);
 assert.equal((reactivations.match(/<article /g)||[]).length,4);
 assert.ok(!projects.includes('rf-card-metrics'));assert.match(reactivations,/rf-card-metrics/);
 assert.match(reactivations,/#\/proyectos-siniestrados/);
 assert.ok(!projects.includes('TER-DEMO-'));assert.ok(land.includes('TER-DEMO-002'));
 assert.equal((result.match(/data-form="featured-filters"/g)||[]).length,2);
 assert.match(land,/name="type" value="terreno"/);assert.match(projects,/name="type" value="proyecto"/);
 assert.ok(!projects.includes('name="areaBand"'));assert.ok(!projects.includes('name="maxPrice"'));
 assert.match(land,/tipo=terreno/);assert.match(projects,/tipo=proyecto/);
});
test('Las tarjetas de terreno muestran el perímetro; las de proyectos conservan sus imágenes',()=>{
 const result=html();const [land,projects]=result.split('<section class="featured-opportunities featured-project-section"');
 assert.equal((land.match(/data-parcel-preview-image/g)||[]).length,3);
 assert.ok(!projects.includes('data-parcel-preview-image'));
 assert.match(land,/Polígono de ejemplo · No predial/);
});
