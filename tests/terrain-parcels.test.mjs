import test from 'node:test';
import assert from 'node:assert/strict';
import {demoTerrainGeometry,terrainDefaultMapStyle} from '../web/terrain-parcels.js';
import {validRing,pointInRing} from '../web/geo.js';
import {properties} from '../web/opportunity-examples.js';

test('Solo los terrenos de ejemplo tienen polígonos ilustrativos válidos e irregulares',()=>{
 for(const p of properties){
  const geometry=demoTerrainGeometry(p.id);
  if(p.type!=='terreno'){assert.equal(geometry,null);continue;}
  assert.equal(geometry.type,'Polygon');
  const ring=geometry.coordinates[0];
  assert.deepEqual(ring[0],ring.at(-1));assert.ok(ring.length>5);
  assert.ok(validRing(ring.slice(0,-1)));assert.ok(pointInRing(p.coordinates,ring.slice(0,-1)));
  geometry.coordinates[0][0][0]=0;
  assert.notEqual(demoTerrainGeometry(p.id).coordinates[0][0][0],0);
 }
 for(const id of ['unknown','constructor','__proto__'])assert.equal(demoTerrainGeometry(id),null);
});

test('Las fichas urbanas predefinen satélite; las rurales y los proyectos conservan mapa',()=>{
 for(const p of properties)assert.equal(terrainDefaultMapStyle(p),p.type==='terreno'&&p.land_type==='Urbano'?'satellite':'map');
 assert.equal(terrainDefaultMapStyle(null),'map');
});
