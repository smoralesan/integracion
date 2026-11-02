import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTerrainPhoto,localPhotoReference,isLocalPhoto,terrainPhotoSectionHTML} from '../web/terrain-photo-preview.js';
import {putDraft,chooseDraft} from '../web/registration-journey.js';
import {publicationPreviewHTML,terrainPresentation} from '../web/publication-ux.js';
test('fotos de prueba admiten solo JPG/PNG de hasta 10 MB y no guardan binarios en el borrador',()=>{
 const file={name:'Foto del lote.jpg',type:'image/jpeg',size:10_000_000},at=Date.now();
 assert.doesNotThrow(()=>validateTerrainPhoto(file));
 for(const value of [{...file,size:10_000_001},{...file,size:0},{...file,name:'foto.svg'},{...file,type:'text/html'}])assert.throws(()=>validateTerrainPhoto(value));
 const ref=localPhotoReference(file,'foto-id',at);assert.equal(isLocalPhoto(ref),true);assert.equal(ref.expiresAt,new Date(at+60*86400000).toISOString());assert.equal(ref.blob,undefined);assert.equal(ref.url,undefined);
 const store={};const id=crypto.randomUUID();putDraft(store,{kind:'terreno',step:4,form:{client_id:id},files:[ref]});
 const recovered=chooseDraft(JSON.parse(JSON.stringify(store)),'terreno',id);assert.deepEqual(recovered.files,[ref]);
 assert.equal(isLocalPhoto({origin:'file',name:'Foto.jpg'}),false);
});
test('el selector de fotos de maqueta está habilitado y advierte sobre privacidad y marcas',()=>{
 const html=terrainPhotoSectionHTML(true);assert.match(html,/type="file"/);assert.doesNotMatch(html,/disabled/);assert.match(html,/NO SE PUBLICAN IMÁGENES QUE TENGAN DATOS DE CONTACTO O MARCAS/);assert.match(html,/solo en este navegador/);assert.match(html,/data-photo-grid/);
 assert.match(terrainPhotoSectionHTML(false),/originales quedan privados/);
});
test('el resumen final hace visible la dirección privada sin incluirla en el resumen público',()=>{
 for(const visibility of ['public','off-market']){
 const form={title:'Predio ficticio',area:'6400.5',cadastral_address:'<Dirección privada>',location_pin:[-74,4],location_pin_confirmed:true,visibility,negotiation:'sale',value_status:'pending'};
 const html=publicationPreviewHTML(form,{privateSummary:'',preview:true,files:[{localPhoto:true}]});
 assert.match(html,/Dirección catastral/);assert.match(html,/&lt;Dirección privada&gt;/);assert.match(html,/6400,5|6.400,5/);assert.match(html,/Pin aproximado confirmado/);assert.match(html,/Fotos de prueba:<\/strong> 1/);
 assert.equal(terrainPresentation(form).cadastral_address,undefined);
 assert.match(html,visibility==='off-market'?/Off-market · Presentación selectiva/:/Público · Vista previa/);
 }
});

test('la portada y el orden sobreviven a recargar sin mover documentos ni alterar otras fotos',async()=>{
 const {reorderTerrainPhotos,terrainPhotoTilesHTML}=await import('../web/terrain-photo-preview.js');
 const a={id:'a',name:'A.jpg',origin:'demo',localPhoto:true},b={id:'b',name:'B.jpg',origin:'demo',localPhoto:true},c={id:'c',name:'C.jpg',origin:'demo',localPhoto:true},doc={id:'doc',name:'Plano.pdf',origin:'demo'};
 const original=[doc,a,b,c];const ordered=reorderTerrainPhotos(original,'c','cover');assert.deepEqual(ordered,[doc,c,a,b]);assert.deepEqual(original,[doc,a,b,c]);
 assert.deepEqual(reorderTerrainPhotos(ordered,'c','next'),[doc,a,c,b]);assert.deepEqual(reorderTerrainPhotos(ordered,'a','previous'),[doc,a,c,b]);
 assert.equal(reorderTerrainPhotos(ordered,'c','previous'),ordered);assert.equal(reorderTerrainPhotos(ordered,'missing','cover'),ordered);
 const id=crypto.randomUUID(),store={};putDraft(store,{kind:'terreno',step:4,form:{client_id:id},files:ordered});const recovered=chooseDraft(JSON.parse(JSON.stringify(store)),'terreno',id);assert.deepEqual(recovered.files,ordered);
 const removed=recovered.files.filter(file=>file.id!=='c');assert.equal(removed.filter(isLocalPhoto)[0].id,'a');
 const html=terrainPhotoTilesHTML(ordered.filter(isLocalPhoto));assert.match(html,/Portada de prueba/);assert.match(html,/data-enlarge-photo="c"/);assert.match(html,/Mover A.jpg antes/);
});
