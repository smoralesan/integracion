import {specialistPhotos} from '../web/specialist-photos.js';
import {specialists} from '../web/specialist-landings.js';
import worker from '../dist/server/index.js';
import assert from 'node:assert/strict';
const context={waitUntil:()=>{}};
for(const path of ['/','/public-ally-profiles.js','/assets/allies/suarez-y-gomez-abogados.svg','/lawyer-carousel.js','/lawyer-carousel.css','/terrain-project.js','/terrain-project.css','/project-needs-data.js','/project-needs-model.js','/project-needs-ui.js','/project-needs.css','/app.js','/styles.css','/parcel-editor.js','/parcel-core.js','/review-ui.js','/workflow-model.js','/home-options.js','/home-options.css','/header-nav.js','/header-nav.css','/footer-directory.js','/footer-directory.css','/home-hero.js','/home-hero.css','/home-sections.js','/home-sections.css','/featured-opportunities.js','/featured-opportunities.css','/opportunity-filters.js','/hero-intent.js','/opportunity-examples.js','/sales-model.js','/sales-ui.js','/sales.css','/ux-flow.js','/ux-flow.css','/professional-model.js','/professional-fields.js','/professional-network.css','/service-request-model.js','/service-requests-ui.js','/broker-exclusivity.js','/land-situation-model.js','/land-situation.js','/land-situation.css','/specialist-landings.js','/specialist-photos.js','/specialist-landings.css','/land-scope.js','/ally-categories.js','/avatars.js','/avatars.css','/profile-editor.js','/colombia-locations.js','/colombia-divipola-data.js','/assets/logo-mmscapital-integracion.svg']){
  const response=await worker.fetch(new Request('https://artifact.test'+path),{},context);
  assert.equal(response.status,200,path);assert.ok((await response.text()).length>20,path);
}
assert.equal((await worker.fetch(new Request('https://artifact.test/api/session'),{},context)).status,401);
assert.equal((await worker.fetch(new Request('https://artifact.test/no-existe'),{},context)).status,404);
console.log('Artefacto Worker: recursos, módulo geográfico y API verificados.');

for(const s of specialists){const photo=specialistPhotos[s.slug];assert.ok(photo,s.slug+' photo mapping');const response=await worker.fetch(new Request('https://artifact.test/'+photo.src.replace(/^\.\//,'')),{},context);assert.equal(response.status,200,s.slug+' photo');assert.match(response.headers.get('content-type'),/^image\/jpeg/,s.slug);const bytes=new Uint8Array(await response.arrayBuffer());assert.equal(bytes[0],255,s.slug);assert.equal(bytes[1],216,s.slug);assert.ok(bytes.length<500000,s.slug+' hero size');}
console.log('Imágenes locales de las '+specialists.length+' landings verificadas.');
