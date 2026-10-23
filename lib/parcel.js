import area from '@turf/area';
import valid from '@turf/boolean-valid';
import kinks from '@turf/kinks';
import rewind from '@turf/rewind';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { Unzip, UnzipInflate } from 'fflate';

export const MAX_FILE_BYTES = 10_000_000;
export const MAX_GEOMETRY_BYTES = 2_000_000;
const MAX_VERTICES = 500;
const fail = message => { throw new Error(message); };
const equal = (a,b) => a[0] === b[0] && a[1] === b[1];
function inside(point, ring) {
  let result=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>point[1])!==(b[1]>point[1]) && point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])result=!result;
  }
  return result;
}
function ring(value) {
  if (!Array.isArray(value) || value.length < 3 || value.length > MAX_VERTICES+1) fail('Cada anillo debe tener entre 3 y 500 vértices.');
  const points = value.map(p => {
    if (!Array.isArray(p) || p.length < 2 || !p.slice(0,2).every(Number.isFinite)) fail('Coordenadas inválidas. Usa longitud, latitud en WGS84.');
    const [x,y] = p;
    if (x < -82.5 || x > -66 || y < -4.5 || y > 14.5) fail('Las coordenadas no corresponden al ámbito de Colombia. Revisa el orden longitud/latitud y el sistema WGS84.');
    return [x,y];
  });
  if (equal(points[0],points.at(-1))) points.pop();
  if (new Set(points.map(p=>p.join(','))).size !== points.length) fail('El perímetro contiene vértices repetidos.');
  return [...points, [...points[0]]];
}
export function normalizeGeometry(input) {
  if (input?.type === 'Feature') input = input.geometry;
  if (!input || !['Polygon','MultiPolygon'].includes(input.type)) fail('El archivo debe contener Polygon o MultiPolygon.');
  const polygons = input.type === 'Polygon' ? [input.coordinates] : input.coordinates;
  if (!Array.isArray(polygons) || !polygons.length || polygons.length > 20) fail('El perímetro debe contener entre 1 y 20 polígonos.');
  let count=0;
  const coords = polygons.map(p => {
    if (!Array.isArray(p) || !p.length || p.length>20) fail('Anillos del polígono inválidos.');
    return p.map(r => { count+=r?.length || 0; if(count>4000) fail('El perímetro supera 4.000 coordenadas.'); return ring(r); });
  });
  const geometry = {type: input.type, coordinates: input.type==='Polygon' ? coords[0] : coords};
  if (!valid(geometry) || kinks(geometry).features.length) fail('El perímetro tiene cruces o anillos inválidos. Corrígelo antes de confirmarlo.');
  for(const polygon of coords){
    for(let i=1;i<polygon.length;i++){
      if(!inside(polygon[i][0],polygon[0])) fail('Los vacíos deben estar dentro del perímetro exterior.');
      for(let j=1;j<i;j++)if(inside(polygon[i][0],polygon[j])||inside(polygon[j][0],polygon[i]))fail('Los vacíos del polígono no pueden superponerse.');
    }
  }
  for(let i=0;i<coords.length;i++)for(let j=0;j<i;j++){
    const inPolygon=(point,polygon)=>inside(point,polygon[0])&&!polygon.slice(1).some(r=>inside(point,r));
    if(inPolygon(coords[i][0][0],coords[j])||inPolygon(coords[j][0][0],coords[i]))fail('Los componentes del perímetro no pueden superponerse.');
  }
  const squareMeters=area(geometry);
  if (!Number.isFinite(squareMeters) || squareMeters<1) fail('El perímetro debe encerrar al menos 1 m².');
  return rewind(geometry, {reverse:false, mutate:false});
}
export function describeGeometry(value) {
  const geometry=normalizeGeometry(value), polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  const points=polygons.flat(2);
  const bbox=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
  return {geometry, areaM2:area(geometry), bbox, vertices:polygons.reduce((a,p)=>a+p.reduce((n,r)=>n+r.length-1,0),0), coordinateSystem:'EPSG:4326'};
}
function decode(bytes) {
  if(bytes.byteLength>MAX_GEOMETRY_BYTES) fail('El archivo supera 2 MB de lectura geográfica. Puedes adjuntarlo para revisión del equipo.');
  const encoding=bytes[0]===255&&bytes[1]===254?'utf-16le':bytes[0]===254&&bytes[1]===255?'utf-16be':'utf-8';
  return new TextDecoder(encoding,{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');
}
function kmlFeatures(text) {
  if(/<!DOCTYPE|<!ENTITY|<\s*(?:\w+:)?NetworkLink\b/i.test(text)) fail('El KML contiene entidades o enlaces externos no admitidos. Exporta un perímetro autónomo.');
  if(XMLValidator.validate(text)!==true) fail('No se pudo leer el XML del KML.');
  const doc=new XMLParser({ignoreAttributes:true,removeNSPrefix:true,parseTagValue:false,processEntities:false}).parse(text), features=[];
  const list=v=>Array.isArray(v)?v:[v];
  const coordinates=value=> {
    if(typeof value!=='string') fail('Faltan coordenadas en el KML.');
    return value.trim().split(/\s+/).map(v=>v.split(',').slice(0,2).map(Number));
  };
  function visit(node,name='Perímetro',depth=0) {
    if(depth>35) fail('El KML tiene una estructura demasiado profunda.');
    if(!node || typeof node!=='object') return;
    if(Array.isArray(node)) {for(const n of node) visit(n,name,depth+1);return;}
    if(typeof node.name==='string') name=node.name.slice(0,100);
    for(const [key,value] of Object.entries(node)) {
      if(key==='Polygon') {
        for(const polygon of list(value)) {
          const outer=polygon?.outerBoundaryIs?.LinearRing?.coordinates;
          const holes=polygon?.innerBoundaryIs ? list(polygon.innerBoundaryIs).map(h=>coordinates(h?.LinearRing?.coordinates)):[];
          features.push({type:'Feature',properties:{name},geometry:{type:'Polygon',coordinates:[coordinates(outer),...holes]}});
          if(features.length>20) fail('Selecciona un archivo con un máximo de 20 perímetros.');
        }
      } else visit(value,name,depth+1);
    }
  }
  visit(doc);
  return features;
}
function unzipKml(bytes) {
  const files=[]; let entries=0,total=0;
  const unzip=new Unzip(file=>{
    entries++; if(entries>100) fail('El KMZ contiene demasiados archivos.');
    if(!/\.kml$/i.test(file.name)) return;
    if(file.name.includes('..') || file.name.startsWith('/') || file.name.includes('\\')) fail('Ruta de archivo KMZ inválida.');
    if(files.length>=5 || (file.originalSize||0)>MAX_GEOMETRY_BYTES) fail('El KMZ supera el límite de lectura geográfica.');
    const chunks=[], result={name:file.name,bytes:null}; files.push(result);
    file.ondata=(err,chunk,final)=>{
      if(err) throw Error('No se pudo descomprimir el KMZ.');
      total+=chunk.length; if(total>MAX_GEOMETRY_BYTES) {file.terminate();fail('El KMZ descomprimido supera 2 MB.');}
      chunks.push(chunk);
      if(final) {const data=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let at=0;for(const c of chunks){data.set(c,at);at+=c.length;}result.bytes=data;}
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  for(let i=0;i<bytes.length;i+=16384) unzip.push(bytes.subarray(i,i+16384),i+16384>=bytes.length);
  if(!files.length || files.some(f=>!f.bytes)) fail('El KMZ no contiene un KML legible.');
  return files.flatMap(f=>kmlFeatures(decode(f.bytes)));
}
export async function parseGeospatial(bytes,name) {
  if(!(bytes instanceof Uint8Array)) bytes=new Uint8Array(bytes);
  if(bytes.byteLength>MAX_FILE_BYTES) fail('El archivo supera 10 MB. Utiliza un enlace de descarga.');
  const extension=String(name).split('.').at(-1).toLowerCase(); let features=[];
  if(extension==='kml') features=kmlFeatures(decode(bytes));
  else if(extension==='kmz') features=unzipKml(bytes);
  else if(extension==='geojson' || extension==='json') {
    const object=JSON.parse(decode(bytes));
    if(object.crs && !/4326|CRS84/.test(JSON.stringify(object.crs))) fail('Exporta el archivo en WGS84 (EPSG:4326).');
    features=object.type==='FeatureCollection'?object.features:[object.type==='Feature'?object:{type:'Feature',geometry:object,properties:{}}];
  } else fail('Usa un archivo KML, KMZ o GeoJSON para interpretar el perímetro.');
  if(!Array.isArray(features) || features.length>100) fail('El archivo contiene demasiados elementos.');
  const candidates=[], warnings=[];let vertices=0;
  for(const feature of features) {
    if(!['Polygon','MultiPolygon'].includes(feature?.geometry?.type)) {warnings.push('Se omitió un elemento que no es un polígono.');continue;}
    if(candidates.length>=20) fail('El archivo tiene más de 20 perímetros.');
    const info=describeGeometry(feature.geometry);vertices+=info.vertices;
    if(vertices>4000)fail('El archivo supera 4.000 vértices entre sus perímetros.');
    candidates.push({name:String(feature.properties?.name||feature.properties?.nombre||`Perímetro ${candidates.length+1}`).slice(0,100),...info});
  }
  if(!candidates.length) fail('No encontramos polígonos en el archivo. Los puntos y líneas no delimitan un lote.');
  return {candidates,warnings:[...new Set(warnings)]};
}
