import test from 'node:test';
import assert from 'node:assert/strict';
import {demoRescueFinance,rescueFinanceSnapshot,rescueFinanceHTML,rescueMetricsHTML} from '../web/reactivation-finance.js';
import {properties} from '../web/opportunity-examples.js';
import {needProjects} from '../web/project-needs-data.js';
test('Los ejemplos de reactivación concilian desgloses y tienen cifras propias',()=>{
 const examples=properties.filter(p=>p.reactivation);
 assert.equal(examples.length,4);
 assert.equal(new Set(examples.map(p=>p.id)).size,4);
 assert.equal(new Set(examples.map(p=>p.rescueFinance.requiredFunds)).size,4);
 for(const p of examples){
  const f=rescueFinanceSnapshot(p);
  assert.ok(f.illustrative);assert.ok(f.debtReconciled);assert.ok(f.fundingReconciled);
  assert.ok(f.collectedSales<=f.effectiveSales);assert.ok(f.effectiveSales<=f.projectedSales);
  assert.ok(f.contractedUnits<=f.totalUnits);assert.equal(p.workGallery.items.length,3);
 }
});
test('Los dos recorridos de rescate comparten cifras coherentes y separan ventas del recaudo',()=>{
 const opportunity=properties.find(p=>p.reactivation),need=needProjects.find(p=>p.reactivation);
 assert.deepEqual(rescueFinanceSnapshot(opportunity),rescueFinanceSnapshot(need));
 const f=rescueFinanceSnapshot(opportunity);
 assert.equal(f.salesProgress,57.5);assert.ok(f.debtReconciled);assert.ok(f.fundingReconciled);
 assert.notEqual(f.effectiveSales,f.collectedSales);assert.equal(f.requiredFunds,7500000000);
 const html=rescueFinanceHTML(opportunity);assert.match(html,/Ventas efectivas/);assert.match(html,/Recaudo recibido/);assert.match(html,/Cifras simuladas/);assert.match(html,/21\/10\/2026/);
 assert.match(rescueMetricsHTML(opportunity),/Millones de COP/);
 for(const p of properties.filter(p=>!p.reactivation)){assert.equal(rescueMetricsHTML(p),'');assert.equal(rescueFinanceHTML(p),'');}
});
test('Valores desconocidos no se convierten en cero ni en porcentajes engañosos',()=>{
 const p={id:'unknown',reactivation:true,rescueFinance:{projectedSales:0,effectiveSales:12,totalDebt:-1,requiredFunds:'100',collectedSales:NaN,constructionProgress:120,asOf:'2026-02-30'}};
 const f=rescueFinanceSnapshot(p);assert.equal(f.projectedSales,0);assert.equal(f.totalDebt,null);assert.equal(f.requiredFunds,null);assert.equal(f.collectedSales,null);assert.equal(f.salesProgress,null);assert.equal(f.constructionProgress,null);assert.equal(f.asOf,null);
 const html=rescueFinanceHTML(p);assert.match(html,/Por informar/);assert.ok(!html.includes('NaN'));assert.ok(!html.includes('Infinity'));assert.ok(!html.includes('<progress'));
 assert.equal(rescueFinanceSnapshot({reactivation:false,rescueFinance:demoRescueFinance}),null);
});
test('Los desgloses incongruentes se marcan para conciliar y se escapa su contenido',()=>{
 const p={reactivation:true,rescueFinance:{totalDebt:100,requiredFunds:100,fundingPlan:[],debtBreakdown:[{label:'<script>bad</script>',amount:40}]}};
 const f=rescueFinanceSnapshot(p);assert.equal(f.debtReconciled,false);assert.equal(f.fundingReconciled,false);
 const html=rescueFinanceHTML(p);assert.match(html,/pendiente de conciliar/);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script>'));
});
