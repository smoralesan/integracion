export const proposalModes={sale:'Compra del terreno',contribution:'Aporte al desarrollo',mixed:'Compra y aporte'};
export const proposalConditions={titles:'Revisión de títulos y obligaciones',technical:'Estudios y norma urbanística',finance:'Disponibilidad de financiación',visit:'Visita y revisión del terreno'};
export const proposalStatuses={draft:'Borrador',open:'Pendiente de respuesta',base:'Base para continuar',closed:'Conversación cerrada'};
export const proposalRoles={buyer:'Comprador de ejemplo',seller:'Propietario de ejemplo'};
const text=(v,n=1000)=>typeof v==='string'?v.trim().slice(0,n):'';
const amount=v=>/^\d{1,15}(?:\.\d{1,2})?$/.test(String(v??''))?String(v):'';
const own=(map,key,fallback)=>Object.hasOwn(map,key)?key:fallback;
export function normalizeProposalDraft(v={}){
 if(!v||typeof v!=='object'||Array.isArray(v))v={};
 const d={mode:own(proposalModes,v.mode,'sale'),currency:['COP','USD','COP+USD'].includes(v.currency)?v.currency:'COP',usdMethod:v.usdMethod==='conversion'?'conversion':'fixed',amountCop:amount(v.amountCop),amountUsd:amount(v.amountUsd),rate:amount(v.rate),valuationPending:v.valuationPending===true,compensation:['cash','units','mixed'].includes(v.compensation)?v.compensation:'mixed',paymentNotes:text(v.paymentNotes,800),conditions:Array.isArray(v.conditions)?[...new Set(v.conditions.filter(k=>Object.hasOwn(proposalConditions,k)))]:[],message:text(v.message,1200),validity:['7','15','30'].includes(String(v.validity))?String(v.validity):'15'};
 if(d.mode==='sale')d.valuationPending=false;
 if(d.currency==='COP'){d.amountUsd='';d.rate='';d.usdMethod='fixed';}
 if(d.currency==='USD'&&d.usdMethod==='fixed'){d.amountCop='';d.rate='';}
 if(d.currency==='USD'&&d.usdMethod==='conversion')d.amountUsd='';
 if(d.currency==='COP+USD'){d.rate='';d.usdMethod='fixed';}
 if(d.valuationPending){d.amountCop='';d.amountUsd='';d.rate='';}
 return d;
}
export function proposalErrors(raw,step=3){
 const d=normalizeProposalDraft(raw),errors=[];
 if(!d.valuationPending){
  if((d.currency.includes('COP')||d.usdMethod==='conversion')&&!(Number(d.amountCop)>0))errors.push(['amountCop','Indica un valor en COP mayor que cero.']);
  if(d.currency.includes('USD')&&d.usdMethod==='fixed'&&!(Number(d.amountUsd)>0))errors.push(['amountUsd','Indica un valor en USD mayor que cero.']);
  if(d.currency==='USD'&&d.usdMethod==='conversion'&&!(Number(d.rate)>0))errors.push(['rate','Indica la tasa propuesta en COP por USD.']);
 }
 if(step>=2&&!d.paymentNotes)errors.push(['paymentNotes','Describe los pagos o entregas que quieres proponer.']);
 return errors;
}
export function submitDemoVersion(record,draft,role,at=new Date().toISOString()){
 if(!['buyer','seller'].includes(role))throw Error('Elige una vista válida.');
 const d=normalizeProposalDraft(draft);if(proposalErrors(d).length)throw Error('Completa el valor y la forma de pago antes de presentar la simulación.');
 const current=record?.versions||[];
 if(current.length&&(record.status!=='open'||current.at(-1).author===role))throw Error('La otra parte debe responder antes de tu siguiente propuesta.');
 if(!current.length&&role!=='buyer')throw Error('La primera propuesta se prepara desde la vista del comprador.');
 if(current.length>=20)throw Error('Esta demostración permite hasta 20 versiones.');
 return {...record,status:'open',draft:null,counterDraft:null,updatedAt:at,versions:[...current,{number:current.length+1,author:role,at,draft:d}],events:[...(record?.events||[]),{type:current.length?'counter':'submitted',role,at,version:current.length+1}]};
}
export function respondDemo(record,action,role,at=new Date().toISOString()){
 if(!['buyer','seller'].includes(role)||record?.status!=='open'||!record.versions?.length||record.versions.at(-1).author===role)throw Error('Responde desde la vista de la otra parte.');
 if(!['base','closed'].includes(action))throw Error('Elige una respuesta válida.');
 return {...record,status:action,updatedAt:at,events:[...(record.events||[]),{type:action,role,at}]};
}
export function readDemoProposals(storage,ids){
 try{const raw=JSON.parse(storage?.getItem('ii-proposals-demo-v1')||'{}'),result={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
 for(const id of ids.slice(0,20)){const r=raw[id];if(!r||typeof r!=='object')continue;const versions=Array.isArray(r.versions)?r.versions.slice(0,20).filter(v=>['buyer','seller'].includes(v.author)).map((v,i)=>({number:i+1,author:v.author,at:text(v.at,40),draft:normalizeProposalDraft(v.draft)})):[];result[id]={propertyId:id,status:Object.hasOwn(proposalStatuses,r.status)?r.status:versions.length?'open':'draft',updatedAt:text(r.updatedAt,40),versions,draft:r.draft?normalizeProposalDraft(r.draft):null,counterDraft:r.counterDraft&&['buyer','seller'].includes(r.counterDraft.author)?{author:r.counterDraft.author,draft:normalizeProposalDraft(r.counterDraft.draft)}:null,events:Array.isArray(r.events)?r.events.slice(-40).filter(x=>['buyer','seller'].includes(x.role)&&['submitted','counter','base','closed','message'].includes(x.type)).map(x=>({type:x.type,role:x.role,at:text(x.at,40),version:Number(x.version)||0,message:text(x.message,1000)})):[]};}return result;
 }catch{return {};}
}
