export const isBrokerRelationship=value=>['intermediario','intermediario / broker','broker'].includes(String(value||'').trim().toLowerCase());
export function normalizeBrokerExclusivity(relationship,value){
 if(!isBrokerRelationship(relationship))return undefined;
 if(!['yes','no'].includes(value))throw Error('Indica si tienes la exclusividad de este inmueble.');
 return value;
}
export function brokerExclusivityFields(form){
 const active=isBrokerRelationship(form.relationship),value=form.broker_exclusivity;
 return `<div class="full" data-broker-exclusivity ${active?'':'hidden'}><label class="form-field">¿Tienes la exclusividad de este inmueble?<span class="ux-required">Obligatorio</span><select aria-label="¿Tienes la exclusividad de este inmueble?" name="broker_exclusivity" ${active?'required':'disabled'}><option value="">Seleccionar</option><option value="yes" ${value==='yes'?'selected':''}>Sí, tengo exclusividad</option><option value="no" ${value==='no'?'selected':''}>No tengo exclusividad</option></select></label><div class="info-box" data-broker-notice ${value==='no'?'':'hidden'} style="margin-top:12px;margin-bottom:0"><span>Si no tienes exclusividad, otros brokers podrían publicar este mismo inmueble.</span></div><p class="land-situation-help" style="margin-bottom:0">Esta respuesta es una declaración y queda pendiente de revisión por el equipo.</p></div>`;
}
export function syncBrokerExclusivity(form){
 const field=form.querySelector('[data-broker-exclusivity]');if(!field)return;
 const active=isBrokerRelationship(form.elements.namedItem('relationship')?.value),select=field.querySelector('select');
 field.hidden=!active;select.disabled=!active;select.required=active;
 if(!active)select.value='';
 field.querySelector('[data-broker-notice]').hidden=!active||select.value!=='no';
}
export const brokerExclusivityLabel=value=>value==='yes'?'Declara tener exclusividad':value==='no'?'Sin exclusividad; otros brokers podrían publicar el mismo inmueble':'No informado en este expediente';
export function brokerExclusivitySummary(form){return isBrokerRelationship(form.relationship)?`<dl class="summary-list"><div><dt>Exclusividad declarada por el intermediario / broker</dt><dd>${brokerExclusivityLabel(form.broker_exclusivity)}</dd></div></dl>`:'';}
