import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainPreviewURL,terrainPreviewHTML} from '../web/terrain-previews.js';
import {demoTerrainGeometry} from '../web/terrain-parcels.js';
import {properties} from '../web/opportunity-examples.js';
test('Las vistas previas públicas encuadran el mismo polígono de ejemplo que la ficha y conservan atribución',()=>{
 for(const p of properties){
  const preview=terrainPreviewURL(p);
  if(p.type!=='terreno'){assert.equal(preview,null);continue;}
  const url=new URL(preview);assert.equal(url.origin,'https://api.mapbox.com');
  assert.ok(url.pathname.includes('satellite-streets-v12/static/geojson('));
  assert.ok(url.pathname.includes('/auto/640x360@2x'));
  const encoded=url.pathname.split('geojson(')[1].split(')/auto/')[0];
  assert.deepEqual(JSON.parse(decodeURIComponent(encoded)).geometry,demoTerrainGeometry(p.id));
  assert.equal(url.searchParams.get('attribution'),'true');assert.equal(url.searchParams.get('logo'),'true');
  assert.match(terrainPreviewHTML(p),/loading="lazy"/);
 }
});
test('No se inventan perímetros para otros registros ni se usan geometrías privadas',()=>{
 assert.equal(terrainPreviewURL({type:'terreno',id:'privado',parcel:{geometry:demoTerrainGeometry('TER-DEMO-001')}}),null);
 assert.equal(terrainPreviewHTML({type:'proyecto',id:'TER-DEMO-001'}),'');
 assert.equal(terrainPreviewURL(null),null);
});
