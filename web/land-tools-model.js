const positive=(value,label)=>{const n=Number(value);if(value===''||value==null||!Number.isFinite(n)||n<=0)throw Error('Ingresa '+label+' mayor que cero.');return n;};
const moneyCents=(value,label)=>{const n=positive(value,label),cents=Math.round(n*100);if(cents<1||!Number.isSafeInteger(cents))throw Error('El valor está fuera del rango de cálculo.');return cents;};
const optionalMonth=(value,label)=>{if(value===''||value==null)return null;const n=Number(value);if(!Number.isInteger(n)||n<0||n>600)throw Error(label+': usa un número entero entre 0 y 600.');return n;};
export function calculateLand({area,unit='m2',price='',basis='total',currency='COP'}={}){
 if(!['m2','ha'].includes(unit)||!['total','m2','ha'].includes(basis)||!['COP','USD'].includes(currency))throw Error('Selecciona unidades y moneda válidas.');
 const inputArea=positive(area,'un área'),areaM2=inputArea*(unit==='ha'?10000:1),areaHa=areaM2/10000;
 if(!Number.isFinite(areaM2)||areaM2>1e12)throw Error('Revisa el área ingresada.');
 if(price===''||price==null)return {areaM2,areaHa,currency,total:null,perM2:null,perHa:null};
 const p=moneyCents(price,'un precio')/100,total=p*(basis==='m2'?areaM2:basis==='ha'?areaHa:1);
 if(!Number.isSafeInteger(Math.round(total*100)))throw Error('El valor total está fuera del rango de cálculo.');
 return {areaM2,areaHa,currency,total,perM2:total/areaM2,perHa:total/areaHa};
}
export const contributionMilestones={equilibrium:'Punto de equilibrio',signature:'Firma del acuerdo',agreed:'Hito por acordar'};
export function simulateContribution(input={}){
 const {mode='cash',currency='COP',milestone='agreed'}=input;
 if(!['cash','units','mixed'].includes(mode)||!['COP','USD'].includes(currency)||!Object.hasOwn(contributionMilestones,milestone))throw Error('Selecciona una modalidad, moneda e hito válidos.');
 const cents=moneyCents(input.value,'un valor del aporte'),percent=mode==='cash'?100:mode==='units'?0:Number(input.cashPercent);
 if(mode==='mixed'&&(input.cashPercent===''||input.cashPercent==null)||!Number.isFinite(percent)||percent<0||percent>100||Math.abs(percent*100-Math.round(percent*100))>1e-7)throw Error('El porcentaje en dinero debe estar entre 0 y 100, con máximo dos decimales.');
 const cashCents=Number((BigInt(cents)*BigInt(Math.round(percent*100))+5000n)/10000n),unitsCents=cents-cashCents;
 let fullUnits=0,unitRemainder=0,unitEquivalent=0,unitPrice=null;
 if(unitsCents){const unitCents=moneyCents(input.unitPrice,'un valor por inmueble de referencia');unitPrice=unitCents/100;fullUnits=Number(BigInt(unitsCents)/BigInt(unitCents));unitRemainder=Number(BigInt(unitsCents)%BigInt(unitCents))/100;unitEquivalent=unitsCents/unitCents;}
 let payments=[],delayMonths=null,frequencyMonths=null;
 if(cashCents){const count=Number(input.paymentCount??1);if(!Number.isInteger(count)||count<1||count>120)throw Error('El número de pagos debe ser un entero entre 1 y 120.');if(count>cashCents)throw Error('Reduce el número de pagos para que cada uno tenga al menos 0,01.');delayMonths=optionalMonth(input.delayMonths,'Meses hasta el primer pago');frequencyMonths=count===1?0:Number(input.frequencyMonths??1);if(count>1&&![1,3,6,12].includes(frequencyMonths))throw Error('Selecciona una frecuencia de pago válida.');const base=Math.floor(cashCents/count),extra=cashCents%count;payments=Array.from({length:count},(_,i)=>({amount:(base+(i<extra?1:0))/100,month:delayMonths===null?null:delayMonths+i*frequencyMonths}));}
 const deliveryMonths=unitsCents?optionalMonth(input.deliveryMonths,'Meses hasta la entrega'):null;
 return {mode,currency,milestone,value:cents/100,cashPercent:percent,cashValue:cashCents/100,unitsValue:unitsCents/100,unitPrice,fullUnits,unitRemainder,unitEquivalent,payments,delayMonths,frequencyMonths,deliveryMonths};
}
export const negotiationChecklist=[
 {id:'documents',title:'Documentos del terreno',items:[['title','Ubicar la escritura o el título de adquisición.'],['registry','Reunir el certificado de tradición y libertad para su revisión.'],['cadastral','Identificar la matrícula inmobiliaria y la referencia catastral.'],['boundary','Reunir el plano, polígono o información disponible de área y linderos.']]},
 {id:'ownership',title:'Titularidad y representación',items:[['owners','Identificar a los propietarios y quiénes deben participar en la negociación.'],['authority','Preparar los poderes o autorizaciones que correspondan.'],['broker','Si interviene un broker, aclarar su autorización, exclusividad y comisión.']]},
 {id:'obligations',title:'Obligaciones y situación actual',items:[['tax','Consultar el estado del impuesto predial y la valorización.'],['balances','Identificar saldos de administración, servicios u otras obligaciones aplicables.'],['legal','Relacionar hipotecas, procesos, servidumbres u otras situaciones conocidas para revisión.'],['occupation','Aclarar ocupación, contratos vigentes y condiciones de entrega.']]},
 {id:'conditions',title:'Condiciones y pendientes',items:[['format','Definir si se ofrece solo terreno o terreno con proyecto y reunir sus soportes.'],['negotiation','Definir venta, aporte o alternativas y un valor de referencia, si se conoce.'],['visibility','Elegir Público u Off-market y qué información se autoriza compartir.'],['next','Identificar revisiones pendientes y los especialistas que se necesitan.']]}
];
const checklistIds=negotiationChecklist.flatMap(group=>group.items.map(([id])=>id));
export const checklistStatuses={pending:'Por revisar',ready:'Preparado',na:'No aplica'};
export function normalizeChecklist(value){const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};return {version:1,title:typeof input.title==='string'?input.title.slice(0,120):'',notes:typeof input.notes==='string'?input.notes.slice(0,1000):'',items:Object.fromEntries(checklistIds.map(id=>[id,Object.hasOwn(checklistStatuses,input.items?.[id])?input.items[id]:'pending']))};}
export function checklistProgress(value){const state=normalizeChecklist(value),statuses=Object.values(state.items),ready=statuses.filter(s=>s==='ready').length,na=statuses.filter(s=>s==='na').length,total=statuses.length-na;return {ready,na,total,pending:total-ready,percent:total?Math.round(ready/total*100):0};}
export function readChecklist(text){try{return normalizeChecklist(typeof text==='string'&&text.length<20000?JSON.parse(text):null);}catch{return normalizeChecklist(null);}}
export function checklistText(value){const state=normalizeChecklist(value),p=checklistProgress(state);return ['CHECKLIST PARA NEGOCIAR UN TERRENO',state.title||'Sin identificador',`${p.ready} de ${p.total} puntos aplicables preparados. ${p.na} no aplican.`,'Preparación declarada; no certifica propiedad ni revisión jurídica.',...negotiationChecklist.flatMap(g=>['',''+g.title.toUpperCase(),...g.items.map(([id,label])=>`[${checklistStatuses[state.items[id]]}] ${label}`)]),'','PENDIENTES Y NOTAS',state.notes||'Sin notas.'].join('\n');}
