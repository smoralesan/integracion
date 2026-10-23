export const obligations=[['predial','Impuesto predial'],['valorizacion','Valorización'],['administracion','Administración'],['servicios','Servicios públicos'],['otras','Otras obligaciones']];
export const obligationStatuses=[['current','Al día'],['pending','Con saldo pendiente'],['agreement','Con acuerdo de pago'],['unknown','No conozco el estado'],['na','No aplica']];
export const factOptions={
 owners:[['one','Un propietario'],['multiple','Varios propietarios'],['unknown','No lo sé']],
 authorization:[['yes','Cuento con autorización para negociar'],['pending','Pendiente de obtener'],['na','No aplica: soy el único propietario'],['unknown','No lo sé']],
 occupation:[['vacant','Desocupado'],['owner','Ocupado por el propietario'],['rented','Arrendado'],['third_party','Ocupado por terceros'],['unknown','No lo sé']],
 mortgage:[['yes','Sí'],['no','No'],['unknown','No lo sé']],
 legal_issues:[['yes','Sí'],['no','No'],['unknown','No lo sé']],
};
export const hasBalance=status=>['pending','agreement'].includes(status);
const clean=(v,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
function enumValue(value,options,label,required=false){if(!value&&!required)return '';if(!options.some(([v])=>v===value))throw Error('Selecciona una respuesta válida para '+label+'.');return value;}
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
export function normalizeLandSituation(input,{documentIds=[],now=new Date().toISOString()}={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||input.version!==1)throw Error('La situación del terreno no es válida.');
 const rows={};
 for(const [key,label] of obligations){
  const raw=input.obligations?.[key]||{},status=enumValue(raw.status,obligationStatuses,label,true),row={status};
  if(status!=='na'){
   const asOf=clean(raw.asOf,10);if(asOf&&(!validDate(asOf)||asOf>now.slice(0,10)))throw Error('Revisa la fecha de consulta de '+label+'.');
   if(asOf)row.asOf=asOf;
   if(hasBalance(status)){
    const amount=clean(raw.amount,18);if(amount&&!/^\d{1,15}(?:\.\d{1,2})?$/.test(amount))throw Error('Revisa el saldo aproximado de '+label+'.');
    if(amount)row.amount=amount;row.currency='COP';row.creditor=clean(raw.creditor,120);row.resolution=clean(raw.resolution,500);
   }
   if(key==='otras')row.description=clean(raw.description,500);
   const supportId=clean(raw.supportId,36);if(supportId){if(!documentIds.includes(supportId))throw Error('El soporte de '+label+' debe pertenecer a este expediente.');row.supportId=supportId;}
  }
  rows[key]=row;
 }
 const facts={};for(const [key,options] of Object.entries(factOptions))facts[key]=enumValue(input.facts?.[key],options,key);
 if(facts.occupation&&facts.occupation!=='vacant')facts.delivery=clean(input.facts?.delivery,500);
 if(facts.mortgage==='yes'||facts.legal_issues==='yes')facts.legalDetails=clean(input.facts?.legalDetails,1000);
 return {version:1,declaredAt:now,obligations:rows,facts};
}
