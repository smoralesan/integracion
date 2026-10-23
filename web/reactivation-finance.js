const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const amount=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const cutoff=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v?v:null;
const number=v=>new Intl.NumberFormat('es-CO',{maximumFractionDigits:1}).format(v);
const money=v=>v===null?'Por informar':'$'+number(v/1_000_000)+' M';
const metrics=[['projectedSales','Ventas proyectadas'],['effectiveSales','Ventas efectivas'],['totalDebt','Deudas reportadas'],['requiredFunds','Recursos requeridos']];
// Cifras inventadas únicamente para mostrar el resumen financiero de la maqueta.
export const demoRescueFinance={illustrative:true,asOf:'2026-10-21',projectedSales:32_000_000_000,effectiveSales:18_400_000_000,collectedSales:6_900_000_000,totalDebt:9_200_000_000,requiredFunds:7_500_000_000,constructionProgress:42,totalUnits:96,contractedUnits:55,
 debtBreakdown:[{label:'Entidades financieras',amount:4_800_000_000},{label:'Contratistas y proveedores',amount:2_700_000_000},{label:'Impuestos y obligaciones',amount:900_000_000},{label:'Otras obligaciones',amount:800_000_000}],
 fundingPlan:[{label:'Continuidad de obra',amount:5_200_000_000},{label:'Estudios y gestión técnica y jurídica',amount:600_000_000},{label:'Pagos previstos a acreedores',amount:1_700_000_000}]
};
export function rescueFinanceSnapshot(p){
 if(p?.reactivation!==true)return null;
 const f=p.rescueFinance||{},result={illustrative:f.illustrative===true,asOf:cutoff(f.asOf)};
 for(const key of [...metrics.map(([k])=>k),'collectedSales','constructionProgress','totalUnits','contractedUnits'])result[key]=amount(f[key]);
 for(const key of ['totalUnits','contractedUnits'])if(!Number.isInteger(result[key]))result[key]=null;
 if(result.constructionProgress>100)result.constructionProgress=null;
 result.salesProgress=result.projectedSales>0&&result.effectiveSales!==null&&result.effectiveSales<=result.projectedSales?100*result.effectiveSales/result.projectedSales:null;
 for(const key of ['debtBreakdown','fundingPlan'])result[key]=Array.isArray(f[key])?f[key].slice(0,12).map(row=>({label:String(row?.label||''),amount:amount(row?.amount)})):[];
 const sum=rows=>rows.length&&rows.every(row=>row.amount!==null)?rows.reduce((total,row)=>total+row.amount,0):null;
 result.debtReconciled=result.totalDebt!==null&&sum(result.debtBreakdown)===result.totalDebt;
 result.fundingReconciled=result.requiredFunds!==null&&sum(result.fundingPlan)===result.requiredFunds;
 return result;
}
export function rescueMetricsHTML(p){
 const f=rescueFinanceSnapshot(p);if(!f)return '';
 return `<div class="rf-card-summary"><div class="rf-card-label"><span>Reactivación · Resumen financiero</span><small>${f.illustrative?'Ejemplo · ':''}Millones de COP</small></div><dl class="rf-card-metrics">${metrics.map(([key,label])=>`<div class="${key==='requiredFunds'?'rf-required':''}"><dt>${label}</dt><dd>${money(f[key])}</dd></div>`).join('')}</dl><p>Ventas efectivas: contratos vigentes. Recaudo por separado en la ficha.</p></div>`;
}
export function rescueFinanceHTML(p){
 const f=rescueFinanceSnapshot(p);if(!f)return '';
 const breakdown=(rows,total,reconciled,title)=>`<details class="rf-disclosure"><summary>${title}</summary><div><dl>${rows.length?rows.map(row=>`<div><dt>${e(row.label)}</dt><dd>${money(row.amount)}</dd></div>`).join(''):'<p>Desglose por aportar.</p>'}<div class="rf-breakdown-total"><dt>Total declarado</dt><dd>${money(total)}</dd></div></dl>${!reconciled?'<p>Desglose pendiente de conciliar con el total declarado.</p>':''}</div></details>`;
 return `<section class="rf-detail" aria-label="Resumen financiero de reactivación"><header><div><span class="eyebrow">Proyecto por rescatar</span><h2>Las cifras para evaluar la reactivación</h2></div><span class="rf-status">${f.illustrative?'Ejemplo ilustrativo':'Datos declarados · Por validar'}</span></header><p class="rf-currency">Valores en millones de pesos colombianos (COP).${f.asOf?' Corte '+e(f.asOf.split('-').reverse().join('/'))+'.':''}</p><dl class="rf-detail-metrics">${metrics.map(([key,label])=>`<div class="${key==='requiredFunds'?'rf-required':''}"><dt>${label}</dt><dd>${money(f[key])}</dd></div>`).join('')}</dl><div class="rf-supporting"><dl><div><dt>Recaudo recibido</dt><dd>${money(f.collectedSales)}</dd></div><div><dt>Avance de obra estimado</dt><dd>${f.constructionProgress===null?'Por informar':number(f.constructionProgress)+'%'}</dd></div><div><dt>Unidades con contrato / total</dt><dd>${f.contractedUnits!==null&&f.totalUnits!==null&&f.contractedUnits<=f.totalUnits?number(f.contractedUnits)+' / '+number(f.totalUnits):'Por informar'}</dd></div></dl>${f.salesProgress!==null?`<div class="rf-sales-progress"><label for="rf-sales-${e(p.id)}">Ventas efectivas sobre ventas proyectadas <strong>${number(f.salesProgress)}%</strong></label><progress id="rf-sales-${e(p.id)}" max="100" value="${f.salesProgress}">${number(f.salesProgress)}%</progress></div>`:''}</div><details class="rf-disclosure"><summary>Qué significa cada cifra</summary><div><dl class="rf-definitions"><div><dt>Ventas proyectadas</dt><dd>Valor comercial estimado de todas las unidades del proyecto.</dd></div><div><dt>Ventas efectivas</dt><dd>Valor de contratos vigentes del ejemplo, excluyendo reservas y cancelaciones. El recaudo recibido se presenta por separado.</dd></div><div><dt>Deudas reportadas</dt><dd>Saldo declarado de obligaciones a la fecha de corte; requiere conciliar capital, intereses y demás conceptos con sus soportes.</dd></div><div><dt>Recursos requeridos</dt><dd>Caja nueva estimada para el plan de reactivación. Su alcance debe precisar obras, gestión y pagos previstos a acreedores.</dd></div></dl></div></details>${breakdown(f.debtBreakdown,f.totalDebt,f.debtReconciled,'Desglose de deudas reportadas')}${breakdown(f.fundingPlan,f.requiredFunds,f.fundingReconciled,'Destino de los recursos requeridos')}<p class="rf-scope">${f.illustrative?'Cifras simuladas, sin soportes financieros aportados. El plan debe precisar los pagos a acreedores y los acuerdos sobre el saldo de la deuda.':'La información debe revisarse con sus soportes y el alcance del plan de reactivación.'} Presupuesto, acuerdos y viabilidad por validar con los especialistas.</p></section>`;
}
