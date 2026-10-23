const storageKey='ii-search-journey-v1',ttl=24*60*60*1000;
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const isCatalogHash=hash=>typeof hash==='string'&&hash.length<=2048&&/^#\/(buscar|oportunidades|proyectos-siniestrados)(?:\?[^#]*)?$/.test(hash);
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
const text=v=>typeof v==='string'?v.slice(0,160):'';
export function normalizeSearchContext(value,now=Date.now()){
 if(!value||value.version!==1||!isCatalogHash(value.hash)||!Number.isFinite(value.at)||value.at>now+60000||now-value.at>ttl)return null;
 const f=value.filters||{},filters={};
 for(const key of ['query','min','max','maxPrice','mapSearchText','pendingLocationQuery'])filters[key]=text(f[key]);
 filters.type=['terreno','proyecto'].includes(f.type)?f.type:'';
 filters.reactivationFilter=['only','exclude'].includes(f.reactivationFilter)?f.reactivationFilter:'';
 filters.mode=['Venta','Aporte','Alianzas'].includes(f.mode)?f.mode:'';
 filters.view=f.view==='list'?'list':'both';filters.mapStyle=f.mapStyle==='satellite'?'satellite':'map';filters.searchTypeExplicit=true;
 filters.zone=Array.isArray(f.zone)&&f.zone.length<=501&&f.zone.every(point)?f.zone.map(p=>[...p]):[];
 filters.sectors=Array.isArray(f.sectors)?f.sectors.filter(x=>typeof x==='string').slice(0,20).map(text):[];
 filters.placeBounds=Array.isArray(f.placeBounds)&&f.placeBounds.length===4&&f.placeBounds.every(Number.isFinite)&&f.placeBounds[0]<f.placeBounds[2]&&f.placeBounds[1]<f.placeBounds[3]&&Math.abs(f.placeBounds[0])<=180&&Math.abs(f.placeBounds[2])<=180&&Math.abs(f.placeBounds[1])<=90&&Math.abs(f.placeBounds[3])<=90?[...f.placeBounds]:null;
 filters.directoryScope=f.directoryScope&&typeof f.directoryScope==='object'?Object.fromEntries(['city','department','landType'].map(k=>[k,text(f.directoryScope[k])])):null;
 const camera=value.camera&&point(value.camera.center)&&Number.isFinite(value.camera.zoom)&&value.camera.zoom>=0&&value.camera.zoom<=22?{center:[...value.camera.center],zoom:value.camera.zoom,bearing:Math.max(-180,Math.min(180,Number(value.camera.bearing)||0)),pitch:Math.max(0,Math.min(60,Number(value.camera.pitch)||0))}:null;
 return {version:1,hash:value.hash,at:value.at,filters,camera,scrollY:Math.max(0,Math.min(100000,Number(value.scrollY)||0)),anchor:/^#\/(?:oportunidad\/[\w-]+|publicacion\/[0-9a-f-]{36})$/i.test(value.anchor||'')?value.anchor:'',anchorOffset:Math.max(-1000,Math.min(1500,Number(value.anchorOffset)||0)),catalogLimit:Math.max(0,Math.min(300,Number(value.catalogLimit)||0))};
}
function browserStorage(){try{return typeof window==='undefined'?null:window.sessionStorage;}catch{return null;}}
export function readSearchContext(hash,storage=browserStorage()){
 try{const rows=JSON.parse(storage?.getItem(storageKey)||'[]');if(!Array.isArray(rows))return null;return rows.map(x=>normalizeSearchContext(x)).filter(Boolean).find(x=>!hash||x.hash===hash)||null;}catch{return null;}
}
export function writeSearchContext(value,storage=browserStorage()){
 const normalized=normalizeSearchContext(value);if(!normalized)return null;
 try{const rows=JSON.parse(storage?.getItem(storageKey)||'[]');storage?.setItem(storageKey,JSON.stringify([normalized,...(Array.isArray(rows)?rows:[]).filter(x=>normalizeSearchContext(x)&&x.hash!==normalized.hash)].slice(0,8)));}catch{}
 return normalized;
}
export function captureSearchContext(state,hash,anchor=''){
 if(!isCatalogHash(hash))return null;
 let card;
 if(anchor)card=[...document.querySelectorAll('a[href]')].find(a=>a.getAttribute('href')===anchor)?.closest('article');
 if(!card){card=[...document.querySelectorAll('.property-card,.published-grid>article')].find(x=>x.getBoundingClientRect().bottom>120);anchor=card?.querySelector('a[href^="#/oportunidad/"],a[href^="#/publicacion/"]')?.getAttribute('href')||'';}
 const snapshot=writeSearchContext({version:1,hash,at:Date.now(),filters:state,scrollY:window.scrollY,anchor,anchorOffset:card?.getBoundingClientRect().top||0,camera:state.searchCameraRevision===state.mapFitRevision?state.searchCamera:null,catalogLimit:state.catalogRecords?.length||0});
 if(snapshot)try{history.replaceState({...history.state,iiCatalogSearch:snapshot},'',location.href);}catch{}
 return snapshot;
}
export function restoreSearchScroll(snapshot){
 if(!snapshot||location.hash!==snapshot.hash)return;
 requestAnimationFrame(()=>{if(location.hash!==snapshot.hash)return;const link=snapshot.anchor?[...document.querySelectorAll('a[href]')].find(a=>a.getAttribute('href')===snapshot.anchor):null,card=link?.closest('article');const y=card?window.scrollY+card.getBoundingClientRect().top-snapshot.anchorOffset:snapshot.scrollY;window.scrollTo({top:Math.max(0,y),behavior:'instant'});});
}
export function returnSearchHTML(snapshot=readSearchContext()){
 return `<a class="px-return-search" href="${e(snapshot?.hash||'#/buscar')}" data-action="return-search">← Volver a resultados</a>`;
}
