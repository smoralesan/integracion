// Drafts retain entered values; only the active preferences enter the submitted record.
export const valueStatusOptions=[['known','Sí, tengo un valor de referencia'],['pending','Aún no lo sé'],['advice','Necesito orientación']];
export const valueStatus=form=>form.value_status??(form.amount||form.amount_usd?'known':'pending');
export const hasCashPreferences=form=>form.negotiation!=='contribution'||['cash','mixed'].includes(form.compensation);
export const negotiationValueLabel=form=>form.negotiation==='contribution'?'Valor estimado del aporte':'Valor de referencia del terreno';
export function normalizeNegotiationForm(input){
 const form=structuredClone(input),status=valueStatus(form);
 if(!valueStatusOptions.some(([key])=>key===status))throw Error('Indica si tienes un valor de referencia o necesitas orientación.');
 form.value_status=status;
 if(status!=='known')for(const key of ['amount','amount_usd','exchange_rate'])delete form[key];
 if(!hasCashPreferences(form))for(const key of ['receive_currencies','exchange_rate','rate_method','negotiable'])delete form[key];
 return form;
}
export function referenceValueSummary(form){
 const status=valueStatus(form);
 return status==='advice'?'Por definir · Necesita orientación':status==='pending'?'Por definir':null;
}
