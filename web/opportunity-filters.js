import {terrainSearchKind} from './terrain-search.js';
import {terrainContentLabel} from './terrain-project.js';
export const areaBands=[['small','Hasta 5.000 m²','','5000'],['medium','5.000 – 10.000 m²','5000','10000'],['large','Más de 10.000 m²','10001','']];
export const priceLimits=[['1000000000','Hasta $1.000 millones'],['2500000000','Hasta $2.500 millones'],['5000000000','Hasta $5.000 millones'],['10000000000','Hasta $10.000 millones']];
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function declaredCOPPrice(record){
 if(typeof record.price==='number'&&Number.isFinite(record.price)&&record.price>=0)return record.price;
 if(!['cop','dual'].includes(record.price_method))return null;
 if(!/^\d+(?:\.\d{1,2})?$/.test(String(record.amount||'')))return null;
 const amount=Number(record.amount);return Number.isFinite(amount)?amount:null;
}
export function matchesOpportunityFilters(record,filters){
 const type=record.kind||record.type;
 if(filters.type&&type!==filters.type)return false;
 if(filters.landContent&&terrainSearchKind(record)!==filters.landContent)return false;
 if(filters.reactivationFilter==='only'&&!record.reactivation)return false;
 if(filters.reactivationFilter==='exclude'&&record.reactivation)return false;
 if(filters.query&&!normalize([record.city,record.region,record.title,record.label,terrainContentLabel(record),record.developmentProject?.use].join(' ')).includes(normalize(filters.query)))return false;
 const area=Number(record.area);
 if(filters.min&&(!area||area<Number(filters.min)))return false;
 if(filters.max&&(!area||area>Number(filters.max)))return false;
 const mode=record.mode||({sale:'Venta',contribution:'Aporte',open:'Venta o aporte'})[record.negotiation]||'';
 if(filters.mode&&!mode.includes(filters.mode))return false;
 if(filters.maxPrice){const price=declaredCOPPrice(record);if(price===null||price>Number(filters.maxPrice))return false;}
 return true;
}
