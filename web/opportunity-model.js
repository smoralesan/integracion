export const availabilityLabels={available:'Disponible',negotiating:'En negociación',withdrawn:'Retirado',unknown:'Por confirmar'};
export const technicalLabels={use:'Uso propuesto',planning:'Información urbanística',topography:'Topografía',access:'Accesos',water:'Agua y saneamiento',energy:'Energía',obligations:'Obligaciones del inmueble'};
export const evidenceLabels={legal:'Titularidad y representación',obligations:'Obligaciones',planning:'Norma y uso',technical:'Información técnica'};
export const evidenceStates={declared:'Declarado',provided:'Soporte aportado',reviewed:'Revisado por el equipo'};
const txt=(v,n=300)=>typeof v==='string'?v.trim().slice(0,n):'';
export function normalizePresentation(v={}){
 const p={description:txt(v.description,3000),technical:{},shareGeometry:v.shareGeometry===true,photoIds:Array.isArray(v.photoIds)?[...new Set(v.photoIds.filter(x=>typeof x==='string'))].slice(0,8):[],evidence:{},reactivation:v.reactivation===true,rescue:{}};
 for(const key of Object.keys(technicalLabels))p.technical[key]=txt(v.technical?.[key],500);
 for(const key of Object.keys(evidenceLabels))p.evidence[key]=Array.isArray(v.evidence?.[key])?[...new Set(v.evidence[key].filter(x=>typeof x==='string'))].slice(0,8):[];
 for(const key of ['reason','suspendedAt','licenseStatus','conditions'])p.rescue[key]=txt(v.rescue?.[key],key==='suspendedAt'?10:1000);
 if(p.rescue.suspendedAt&&(!/^\d{4}-\d{2}-\d{2}$/.test(p.rescue.suspendedAt)||!Number.isFinite(Date.parse(p.rescue.suspendedAt))||new Date(p.rescue.suspendedAt).toISOString().slice(0,10)!==p.rescue.suspendedAt))throw Error('Revisa la fecha de suspensión.');
 for(const key of ['projectedSales','effectiveSales','collectedSales','totalDebt','requiredFunds','pendingBudget','constructionProgress']){
  const raw=v.rescue?.[key];if(raw===''||raw==null){p.rescue[key]=null;continue;}
  if(!/^(?:\d{1,15})(?:\.\d{1,2})?$/.test(String(raw))||!Number.isFinite(Number(raw)))throw Error('Revisa los valores del diagnóstico de reactivación.');
  p.rescue[key]=Number(raw);
 }
 if(p.rescue.constructionProgress>100)throw Error('El avance no puede superar 100 %.');
 if(p.rescue.projectedSales!==null&&p.rescue.effectiveSales>p.rescue.projectedSales)throw Error('Las ventas efectivas no pueden superar las proyectadas.');
 if(p.rescue.effectiveSales!==null&&p.rescue.collectedSales>p.rescue.effectiveSales)throw Error('El recaudo no puede superar las ventas efectivas.');
 return p;
}
export function publicExperience(record,now=Date.now()){
 const base={availability:record.availability||'unknown',availabilityConfirmedAt:record.availabilityConfirmedAt||null,updatedAt:record.updatedAt||record.createdAt};
 if(record.publicationConsent?.version!=='detail-v2')return base;
 const p=normalizePresentation(record.publicPresentation),active=(record.files||[]).filter(f=>Date.parse(f.expiresAt)>now),ids=new Set(active.map(f=>f.id));
 const evidence={};for(const key of Object.keys(evidenceLabels)){const count=p.evidence[key].filter(id=>ids.has(id)).length;const reviewed=count>0&&record.evidenceReview?.[key]?.state==='reviewed';evidence[key]={state:reviewed?'reviewed':count?'provided':'declared',count,reviewedAt:reviewed?record.evidenceReview[key].at:null};}
 return {...base,detailVersion:'detail-v2',description:p.description,technical:p.technical,evidence,reactivation:p.reactivation,rescue:p.reactivation?p.rescue:null,geometry:p.shareGeometry?record.parcel?.geometry||null:null,photos:p.photoIds.filter(id=>ids.has(id)).map(id=>'/api/catalog/'+record.publicationId+'/photos/'+id),assetReference:record.assetId||record.id,representation:record.form?.relationship||'',exclusivity:record.form?.broker_exclusivity||null};
}
export function comparableRecord(r){const real=!!r.kind,method=r.price_method||'cop';return {...r,compareKey:(real?'publication:':'demo:')+r.id,area:Number(r.area)||null,type:r.kind||r.type,mode:r.mode||({sale:'Venta',contribution:'Aporte',open:'Venta o aporte'})[r.negotiation]||'Por acordar',amount:r.price??(r.amount?Number(r.amount):null),amountUSD:r.amount_usd?Number(r.amount_usd):null,currency:method==='usd'?'USD':'COP',priceMethod:method,href:real?'#/publicacion/'+r.id:'#/oportunidad/'+r.id,isDemo:!real};}
export function possibleSameLand(a,b){
 if(a.kind!=='terreno'||b.kind!=='terreno'||!a.parcel?.geometry||!b.parcel?.geometry)return false;
 const rings=g=>g.type==='Polygon'?g.coordinates:g.type==='MultiPolygon'?g.coordinates.flat():[];
 const center=g=>{const p=rings(g).flat();return p.length?[p.reduce((n,c)=>n+c[0],0)/p.length,p.reduce((n,c)=>n+c[1],0)/p.length]:null;};
 const x=center(a.parcel.geometry),y=center(b.parcel.geometry),areaA=a.parcel.areaM2||Number(a.form.area),areaB=b.parcel.areaM2||Number(b.form.area);
 return !!x&&!!y&&areaA>0&&areaB>0&&Math.abs(areaA-areaB)/Math.max(areaA,areaB)<.08&&Math.hypot((x[0]-y[0])*111000*Math.cos(x[1]*Math.PI/180),(x[1]-y[1])*111000)<75;
}
