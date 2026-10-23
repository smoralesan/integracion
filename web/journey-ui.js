const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function catalogGroupsHTML(state){
 const active=state.reactivationFilter==='only'?'reactivacion':state.type==='terreno'?(state.landContent||'terreno'):state.type==='proyecto'?'proyecto':'todos';
 return `<nav class="jr-categories" aria-label="Qué quieres explorar">${[['land-only','Solo terreno','terreno&contenido=solo-terreno'],['land-project','Terreno con proyecto','terreno&contenido=con-proyecto'],['terreno','Todos los terrenos','terreno'],['proyecto','Proyectos','proyecto'],['reactivacion','Para reactivación','proyecto&estado=reactivacion'],['todos','Todo','todos']].map(([key,label,query])=>`<a href="#/oportunidades?tipo=${query}" ${key===active?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
}
export function informationLegendHTML(){return `<details class="jr-information-legend"><summary>¿Qué significa el estado de la información?</summary><dl><div><dt>Declarado por el titular</dt><dd>Información suministrada; aún requiere contraste con sus soportes.</dd></div><div><dt>Soporte aportado</dt><dd>Existe documentación vigente asociada. El acceso continúa siendo privado.</dd></div><div><dt>Revisado por el equipo</dt><dd>Se registró una revisión de ese grupo. No certifica titularidad ni viabilidad.</dd></div></dl></details>`;}
export function detailTabsHTML(id,tabs){
 const prefix='jr-'+String(id).replace(/[^a-zA-Z0-9-]/g,'');
 return `<div data-jr-tabs><nav class="jr-detail-tabs" role="tablist" aria-label="Información de la oportunidad">${tabs.map(([key,label],i)=>`<button type="button" role="tab" id="${prefix}-tab-${key}" aria-controls="${prefix}-panel-${key}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-jr-tab="${key}">${e(label)}</button>`).join('')}</nav>${tabs.map(([key,,body],i)=>`<section class="jr-detail-panel" role="tabpanel" id="${prefix}-panel-${key}" aria-labelledby="${prefix}-tab-${key}" tabindex="0" ${i?'hidden':''}>${body}</section>`).join('')}</div>`;
}
export function consultationHTML(base){
 if(!/^#\/interes\/publicacion\/[0-9a-f-]{36}$/i.test(base))return '';
 return `<div class="tu-consult-dialog"><span class="eyebrow">Un siguiente paso claro</span><h2 id="dialog-title">¿Qué te gustaría evaluar?</h2><p>Elige una opción. Podrás revisar tu solicitud antes de enviarla.</p><div>${[['informacion','Recibir información','Características y soportes disponibles.'],['visita','Consultar una visita','Acceso, disponibilidad y coordinación.'],['negociacion','Conversar sobre compra o aporte','Precio, modalidad y condiciones.']].map(([key,label,copy])=>`<a href="${e(base)}?consulta=${key}"><div><strong>${label}</strong><small>${copy}</small></div><span aria-hidden="true">→</span></a>`).join('')}</div><small>Elegir una opción no envía información, reserva el terreno ni confirma una visita.</small></div>`;
}
export function mountJourney(root,{modal}={}){
 if(!root)return;
 for(const host of root.querySelectorAll('[data-jr-tabs]')){
  const tabs=[...host.querySelectorAll('[role=tab]')],panels=[...host.querySelectorAll('[role=tabpanel]')];
  const select=t=>{tabs.forEach(b=>{b.setAttribute('aria-selected',String(b===t));b.tabIndex=b===t?0:-1;});panels.forEach(p=>p.hidden=p.id!==t.getAttribute('aria-controls'));t.focus({preventScroll:true});};
  tabs.forEach(t=>t.addEventListener('click',()=>select(t)));
  host.querySelector('[role=tablist]').addEventListener('keydown',ev=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(ev.key))return;const i=tabs.indexOf(ev.target);if(i<0)return;ev.preventDefault();select(tabs[ev.key==='Home'?0:ev.key==='End'?tabs.length-1:(i+(ev.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length]);});
 }
 for(const b of root.querySelectorAll('[data-jr-consult]'))b.addEventListener('click',()=>{const content=consultationHTML(b.dataset.jrConsult);if(content)modal?.(content);});
 for(const host of root.querySelectorAll('[data-jr-media]'))for(const b of host.querySelectorAll('[data-jr-media-select]'))b.addEventListener('click',()=>{host.querySelectorAll('[data-jr-media-select]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));host.querySelectorAll('[data-jr-media-panel]').forEach(p=>p.hidden=p.dataset.jrMediaPanel!==b.dataset.jrMediaSelect);});
}
let filterTrigger;
export function toggleSearchFilters(trigger){
 const panel=document.querySelector('#extra-search-filters');if(!panel)return;
 const open=panel.hidden;panel.hidden=!open;
 document.querySelectorAll('[aria-controls="extra-search-filters"]').forEach(b=>b.setAttribute('aria-expanded',String(open)));
 if(open){filterTrigger=trigger;panel.querySelector('select,input,button')?.focus();if(!panel.dataset.jrKeyboard){panel.dataset.jrKeyboard='true';panel.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();toggleSearchFilters();return;}if(ev.key==='Tab'&&matchMedia('(max-width:760px)').matches){const items=[...panel.querySelectorAll('button,input,select')].filter(x=>!x.disabled&&x.getClientRects().length);const first=items[0],last=items.at(-1);if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last?.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first?.focus();}}});}}else filterTrigger?.focus();
}
