// A pin locates a terrain approximately. It never supplies a perimeter or area.
export function normalizeLocationPin(value) {
 if(value?.confirmed!==true)throw Error('Marca y confirma la ubicación aproximada del lote.');
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
 const municipality=[...new Set([clean(location.city),clean(location.region)].filter(Boolean))].join(', ');
 return [clean(location.neighborhood,120),municipality].filter(Boolean).join(' · ');
}

// Read the visible confirmation at save/continue time, even if an editor event was missed.
export function captureLocationConfirmation(form, controls) {
 for(const [selector,key] of [['[data-pin-confirm]','location_pin_confirmed'],['[data-parcel-confirm]','parcel_confirmed']]) {
  const control=controls.querySelector(selector);
  if(control)form[key]=control.checked===true;
 }
 return form;
}

export function validateTerrainDetails(form){
 if(!String(form.cadastral_address||'').trim())throw Error('Indica la dirección catastral del lote para continuar.');
 const area=Number(form.area);
 if(!Number.isFinite(area)||area<1)throw Error('Indica un área declarada válida de al menos 1 m². El polígono es solo de referencia.');
}
