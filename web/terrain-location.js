// A pin locates a terrain approximately. It never supplies a perimeter or area.
export function normalizeLocationPin(value) {
 if(value?.confirmed!==true)throw Error('Marca y confirma la ubicación aproximada del terreno.');
 const p=value.coordinates;
 if(!Array.isArray(p)||p.length!==2||p.some(n=>typeof n!=='number'||!Number.isFinite(n))||p[0]<-82||p[0]>-66||p[1]<-5||p[1]>16)throw Error('Usa coordenadas válidas dentro del ámbito de Colombia (longitud y latitud).');
 return {coordinates:p.map(n=>Number(n.toFixed(7))),confirmed:true,precision:'approximate'};
}
export const terrainLocationMode=f=>f.location_mode|| (f.parcel_geometry?'polygon':'pin');
export function locationSummary(f) {
 if(terrainLocationMode(f)==='polygon')return f.parcel_geometry&&f.parcel_confirmed?'Polígono declarado · Confirmado por quien registra':'Polígono pendiente de completar o confirmar';
 try{normalizeLocationPin({coordinates:f.location_pin,confirmed:f.location_pin_confirmed});return 'Pin aproximado confirmado · Perímetro pendiente';}catch{return 'Pin aproximado pendiente de marcar o confirmar';}
}

// Public location text: the optional neighborhood stays on the same compact line.
export function locationLabel(location={}) {
 const clean=(value,max=160)=>typeof value==='string'?value.trim().slice(0,max):'';
 const municipality=[clean(location.city),clean(location.region)].filter(Boolean).join(', ');
 return [clean(location.neighborhood,120),municipality].filter(Boolean).join(' · ');
}
