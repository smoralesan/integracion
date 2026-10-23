import test from 'node:test';
import assert from 'node:assert/strict';
import {rescueGalleryItems,rescueGalleryHTML,rescueOverviewHTML,rescueGalleryZoomHTML} from '../web/rescue-gallery.js';
import {properties} from '../web/opportunity-examples.js';
import {needProjects} from '../web/project-needs-data.js';
test('La galería de obra es distinta de la imagen arquitectónica y acompaña las mismas cifras',()=>{
 const p=properties.find(p=>p.reactivation),need=needProjects.find(p=>p.reactivation);
 const work=rescueGalleryItems(p),render=rescueGalleryItems(p,'render');
 assert.equal(work.length,3);assert.equal(render.length,1);assert.ok(!work.some(i=>i.src===render[0].src));
 assert.ok(work.every(i=>i.illustrative));assert.equal(render[0].illustrative,true);
 assert.deepEqual(work,rescueGalleryItems(need));
 const html=rescueOverviewHTML(p);assert.equal((html.match(/class="rf-detail"/g)||[]).length,1);
 assert.ok(html.indexOf('class="rg-gallery"')<html.indexOf('class="rg-finance-column"'));
 assert.match(html,/fotografías del proyecto, sus fechas y observaciones están por aportar/);
 assert.match(html,/data-rg-view="work" aria-pressed="true"/);assert.match(html,/data-rg-enlarge/);
});
test('Sin fotos de obra no se presenta el render como un estado actual',()=>{
 const p={reactivation:true,image:'./assets/projects/edificio-mixto-referencia.jpg'};
 assert.deepEqual(rescueGalleryItems(p),[]);assert.equal(rescueGalleryItems(p,'render').length,1);
 const html=rescueGalleryHTML(p);assert.match(html,/Fotografías de obra pendientes/);assert.match(html,/data-rg-enlarge[^>]*hidden/);assert.ok(!html.includes('src=""'));
 for(const p of properties.filter(p=>!p.reactivation))assert.equal(rescueOverviewHTML(p),'');
});
test('No se muestran documentos privados ni URLs arbitrarias como fotos públicas',()=>{
 const p={reactivation:true,image:'javascript:alert(1)',workGallery:{items:[null,{src:'/api/records/private/photo'},{src:'https://outside.test/image.jpg'},{src:'./assets/proyecto-construccion.jpg',title:'<script>bad</script>'}]}};
 assert.equal(rescueGalleryItems(p).length,1);assert.deepEqual(rescueGalleryItems(p,'render'),[]);
 assert.ok(!rescueGalleryHTML(p).includes('<script>'));assert.ok(!rescueGalleryZoomHTML({title:'<script>',alt:'<img>',src:'./assets/proyecto-construccion.jpg'}).includes('<script>'));
});
