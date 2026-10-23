import {MAPBOX_TOKEN} from './mapbox-config.js';
import {demoTerrainGeometry} from './terrain-parcels.js';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Solo usa los perímetros de demostración publicados; nunca recibe geometrías privadas.
export function terrainPreviewURL(p){
 if(p?.type!=='terreno')return null;
 const geometry=demoTerrainGeometry(p.id);if(!geometry)return null;
 const feature={type:'Feature',properties:{stroke:'#1265e9','stroke-width':3,fill:'#1265e9','fill-opacity':0.22},geometry};
 const overlay=encodeURIComponent(JSON.stringify(feature));
 const url=new URL(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/geojson(${overlay})/auto/640x360@2x`);
 url.searchParams.set('access_token',MAPBOX_TOKEN);url.searchParams.set('padding','70,70,50,70');url.searchParams.set('logo','true');url.searchParams.set('attribution','true');return url.href;
}
export function terrainPreviewHTML(p){
 const url=terrainPreviewURL(p);if(!url)return '';
 return `<span class="terrain-preview" data-terrain-preview><img src="${e(url)}" alt="Mapa satelital con polígono ilustrativo del terreno en ${e(p.city)}" loading="lazy" decoding="async" data-parcel-preview-image><span class="terrain-preview-fallback" hidden><strong>Vista previa no disponible</strong><small>Abre la ficha para explorar el mapa</small></span><span class="terrain-preview-caption">Polígono de ejemplo · No predial</span></span>`;
}
export function mountTerrainPreviews(host){
 if(!host)return;
 for(const img of host.querySelectorAll('[data-parcel-preview-image]')){
  const failed=()=>{img.hidden=true;img.parentElement.querySelector('.terrain-preview-fallback').hidden=false;};
  img.addEventListener('error',failed,{once:true});if(img.complete&&!img.naturalWidth)failed();
 }
}
