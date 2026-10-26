import {allowsPublicListing} from './land-visibility.js';
import {publicExperience} from './opportunity-model.js';
export const STATUS_LABELS={received:'Recibido',in_review:'En revisión',needs_information:'Información pendiente',approved:'Aprobado',published:'Publicado'};
export const statusOf=record=>record.status==='pending_review'?'received':record.status||'received';
export const TRANSITIONS={received:['in_review'],in_review:['needs_information','approved'],needs_information:['in_review'],approved:['in_review','published'],published:['approved']};
export const statusLabel=record=>STATUS_LABELS[typeof record==='string'?record:statusOf(record)]||'Recibido';
export function permittedTransitions(record,role){return (TRANSITIONS[statusOf(record)]||[]).filter(s=>(s!=='published'||allowsPublicListing(record))&&(role==='admin'||!['approved','published'].includes(s)&&statusOf(record)!=='published'));}
export function publicSummary(record,{previewNeighborhood=false}={}){
  const f=record.form||{},summary={id:record.publicationId,reference:record.reference,kind:record.kind};
  for(const key of ['title','city','region','land_type','intended_use','department_code','municipality_code','negotiation','price_method'])if(typeof f[key]==='string')summary[key]=f[key].slice(0,160);
  for(const key of ['area','amount','amount_usd'])if(typeof f[key]==='string'&&/^\d{1,15}(?:\.\d{1,2})?$/.test(f[key]))summary[key]=f[key];
  if(record.kind==='terreno'&&['land-only','land-project'].includes(f.land_content))summary.land_content=f.land_content;
  if((previewNeighborhood||record.publicationConsent?.authorized&&record.publicationConsent?.includesNeighborhood===true)&&typeof f.neighborhood==='string'&&f.neighborhood.trim())summary.neighborhood=f.neighborhood.trim().slice(0,120);
  return {...summary,...publicExperience(record)};
}
