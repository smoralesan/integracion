// Consultation preferences only. Selecting one never submits or authorizes a contact.
export const terrainConsultReasons={
 compra:{label:'Quiero comprar',intent:'Comprar',message:'Quiero evaluar la compra de este lote y conocer el valor, la forma de pago y las condiciones para presentar una propuesta.',copy:'Valor, forma de pago y condiciones de venta.'},
 aporte:{label:'Evaluar un aporte',intent:'Evaluar aporte',message:'Quiero evaluar el aporte de este lote a un desarrollo y conocer las condiciones, los hitos y las alternativas de retribución.',copy:'Condiciones, hitos y alternativas de retribución.'},
 informacion:{label:'Solicitar información',intent:'Solicitar información',message:'Quiero conocer la información disponible y los documentos que puedo revisar de este lote.',copy:'Características, soportes y próximos pasos.'},
 visita:{label:'Consultar una visita',intent:'Solicitar información',message:'Me gustaría evaluar una visita al lote. Quiero conocer las condiciones de acceso y la disponibilidad para coordinarla.',copy:'Acceso, disponibilidad y coordinación.'},
 negociacion:{label:'Conversar sobre la negociación',intent:'Solicitar información',message:'Quiero conversar sobre el valor del lote, la modalidad de negociación y las condiciones para presentar una propuesta.',copy:'Modalidad, valor y condiciones por acordar.'}
};
export const terrainConsultPreset=key=>Object.hasOwn(terrainConsultReasons,key)?terrainConsultReasons[key]:null;
export function terrainConsultOptions(offer={}, {secondary=true}={}){
 const project=(offer.kind||offer.type)==='proyecto',mode=String(offer.mode||''),negotiation=offer.negotiation;
 const sale=!project&&(negotiation==='sale'||negotiation==='open'||/venta/i.test(mode));
 const contribution=!project&&(negotiation==='contribution'||negotiation==='open'||/aporte/i.test(mode));
 return [...(sale?['compra']:[]),...(contribution?['aporte']:[]),'informacion',...(secondary?['visita','negociacion']:[])].map(key=>[key,terrainConsultReasons[key]]);
}
export const consultationKey=(key,offer)=>terrainConsultOptions(offer).some(([k])=>k===key)?key:'informacion';
export function consultationDraft(current,key,offer){
 const selected=consultationKey(key,offer),preset=terrainConsultPreset(selected),automatic=!String(current.message||'').trim()||Object.values(terrainConsultReasons).some(r=>r.message===current.message);
 return {key:selected,intent:preset.intent,message:automatic?preset.message:current.message,automatic};
}
export function terrainLocationStatus({geometry=null,pin=null,demo=false}={}){
 if(geometry)return {label:demo?'Polígono ilustrativo':'Perímetro declarado',detail:demo?'Forma y ubicación de ejemplo; no corresponden a un predio ofrecido.':'Límite compartido por el titular. Requiere contraste con sus soportes.'};
 if(pin)return {label:demo?'Pin ilustrativo':'Pin aproximado',detail:'Señala un punto de referencia. No define los linderos ni permite calcular el área del lote.'};
 return {label:'Perímetro no compartido',detail:'La ficha muestra la ubicación general autorizada. Solicita el acceso a información adicional para evaluar el predio.'};
}
