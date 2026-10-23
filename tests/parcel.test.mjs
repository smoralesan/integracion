import test from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import {describeGeometry,parseGeospatial} from '../lib/parcel.js';
const outer=[[-75.5,10.4],[-75.49,10.4],[-75.49,10.41],[-75.5,10.41],[-75.5,10.4]];
export const geometry={type:'Polygon',coordinates:[outer]};
export const kml=`<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Lote de prueba</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${outer.map(p=>p.join(',')+',0').join(' ')}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>`;
test('KML, compressed KMZ and GeoJSON preserve a selectable perimeter and compute the same area',async()=>{
  const variants=[[strToU8(kml),'lote.kml'],[zipSync({'doc.kml':strToU8(kml),'foto.jpg':new Uint8Array(100)}),'lote.kmz'],[strToU8(JSON.stringify({type:'Feature',properties:{name:'Lote de prueba'},geometry})),'lote.geojson']];
  for(const [bytes,name] of variants){const result=await parseGeospatial(bytes,name);assert.equal(result.candidates.length,1);const c=result.candidates[0];assert.equal(c.name,'Lote de prueba');assert.equal(c.vertices,4);assert.ok(c.areaM2>1_000_000&&c.areaM2<1_300_000);assert.deepEqual(c.geometry,describeGeometry(geometry).geometry);}
});
test('multiple polygons stay separate; points are skipped with an explanation',async()=>{
  const features=[{type:'Feature',geometry,properties:{name:'Uno'}},{type:'Feature',geometry,properties:{name:'Dos'}},{type:'Feature',geometry:{type:'Point',coordinates:outer[0]}}];
  const result=await parseGeospatial(strToU8(JSON.stringify({type:'FeatureCollection',features})),'lotes.json');assert.equal(result.candidates.length,2);assert.equal(result.warnings.length,1);
});
test('rings close and altitude is removed; holes reduce area',()=>{
  const base=describeGeometry({type:'Polygon',coordinates:[outer.slice(0,-1).map(p=>[...p,50])]});assert.equal(base.geometry.coordinates[0].length,5);
  const hole=[[-75.498,10.402],[-75.496,10.402],[-75.496,10.404],[-75.498,10.404],[-75.498,10.402]];
  assert.ok(describeGeometry({type:'Polygon',coordinates:[outer,hole]}).areaM2<base.areaM2);
  assert.throws(()=>describeGeometry({type:'Polygon',coordinates:[outer,hole.map(([x,y])=>[x+1,y])]}),/dentro/);
  assert.throws(()=>describeGeometry({type:'Polygon',coordinates:[outer,hole,hole.map(([x,y])=>[x+.0002,y+.0002])]}),/cruces|superponerse/);
});
test('rejects crossed, duplicate, projected, swapped and overlapping geometry',()=>{
  const bad=[{type:'Polygon',coordinates:[[outer[0],outer[2],outer[1],outer[3],outer[0]]]},{type:'Polygon',coordinates:[[outer[0],outer[1],outer[1],outer[2],outer[0]]]},{type:'Polygon',coordinates:[outer.map(([x,y])=>[y,x])]},{type:'Polygon',coordinates:[outer.map(()=>[500000,1000000])]},{type:'MultiPolygon',coordinates:[[outer],[outer.map(([x,y])=>[x+.002,y+.002])]]}];
  for(const g of bad)assert.throws(()=>describeGeometry(g));
});
test('rejects external XML, archive traversal, oversized reading and files over 10MB',async()=>{
  for(const text of ['<!DOCTYPE kml [<!ENTITY x SYSTEM "file:///etc/passwd">]>'+kml,kml.replace('<Document>','<Document><NetworkLink/>')])await assert.rejects(parseGeospatial(strToU8(text),'lote.kml'));
  await assert.rejects(parseGeospatial(zipSync({'../doc.kml':strToU8(kml)}),'lote.kmz'),/Ruta/);
  await assert.rejects(parseGeospatial(zipSync({'doc.kml':strToU8(' '.repeat(2_000_001))}),'lote.kmz'),/límite|2 MB/);
  await assert.rejects(parseGeospatial(new Uint8Array(10_000_001),'lote.kml'),/10 MB/);
  await assert.rejects(parseGeospatial(strToU8(JSON.stringify({type:'Point',coordinates:outer[0]})),'punto.json'),/polígonos/);
  await assert.rejects(parseGeospatial(strToU8(JSON.stringify({type:'Feature',geometry,crs:{name:'EPSG:3116'}})),'lote.json'),/WGS84/);
});
