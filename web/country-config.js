// Operating country is a deployment decision, never inferred from browser language.
// Upcoming markets cannot use Colombia's DIVIPOLA data or regional conversion factors.
const internationalUnits=[['ha','Hectáreas',10000],['pies2','Pies cuadrados (ft²)',0.09290304]];
export const countryProfiles={
 CO:{code:'CO',name:'Colombia',locale:'es-CO',timeZone:'America/Bogota',status:'active',currency:'COP',landTerm:'lote',landTermPlural:'lotes',territory:{region:'Departamento',municipality:'Municipio',neighborhood:'Barrio',source:'DIVIPOLA'},areaUnit:'m²',areaEquivalents:[internationalUnits[0],['fanegadas','Fanegadas',6400],['cuadras','Cuadras',6400],internationalUnits[1],['varas2','Varas cuadradas (v²)',0.64]],areaReference:'Referencia para Colombia: 1 ha = 10.000 m²; 1 fanegada = 1 cuadra = 6.400 m²; 1 pie² = 0,09290304 m². Para esta conversión usamos 1 vara = 0,80 m y 1 vara² = 0,64 m². Las medidas tradicionales pueden variar por región. El área declarada se conserva en m².'},
 PA:{code:'PA',name:'Panamá',locale:'es-PA',timeZone:'America/Panama',status:'upcoming',currency:'USD',landTerm:'lote',landTermPlural:'lotes',territory:{region:'Provincia o comarca',municipality:'Distrito',neighborhood:'Corregimiento',source:null},areaUnit:'m²',areaEquivalents:internationalUnits,areaReference:'Referencia: 1 ha = 10,000 m²; 1 pie² = 0.09290304 m². El área declarada se conserva en m².'}
};
function deepFreeze(value){Object.values(value).forEach(item=>{if(item&&typeof item==='object'&&!Object.isFrozen(item))deepFreeze(item);});return Object.freeze(value);}deepFreeze(countryProfiles);
export function countryProfile(code){const profile=countryProfiles[String(code).toUpperCase()];if(!profile)throw Error('El país necesita una configuración local antes de habilitarse.');return profile;}
export function operatingCountry(code){const profile=countryProfile(code);if(profile.status!=='active'||!profile.territory.source)throw Error('Este país todavía no está habilitado para operar.');return profile;}
export const activeMarket=operatingCountry('CO');
export function numberSeparators(market=activeMarket){const parts=new Intl.NumberFormat(market.locale).formatToParts(12345.6);return {decimal:parts.find(part=>part.type==='decimal').value,group:parts.find(part=>part.type==='group').value};}
