import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateLand,simulateContribution,normalizeChecklist,readChecklist,checklistProgress,checklistText,negotiationChecklist} from '../web/land-tools-model.js';
import {specialistRouteRedirect} from '../worker/site-routes.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('Area conversion and every price basis describe the same terrain',()=>{
 for(const [basis,price]of [['total','1000000000'],['m2','40000'],['ha','400000000']]){
  const r=calculateLand({area:'2.5',unit:'ha',basis,price});
  assert.equal(r.areaM2,25000);assert.equal(r.areaHa,2.5);assert.equal(r.total,1000000000);assert.equal(r.perM2,40000);assert.equal(r.perHa,400000000);
 }
 const partial=calculateLand({area:'25000',unit:'m2'});assert.equal(partial.areaHa,2.5);assert.equal(partial.total,null);
 near(calculateLand({area:0.012345,unit:'ha',price:12.5,currency:'USD',basis:'m2'}).areaM2,123.45);
});
test('Invalid, infinite and out-of-range areas and prices cannot become zero-valued results',()=>{
 for(const area of ['',null,0,-1,'invalid',Infinity,1e13])assert.throws(()=>calculateLand({area}));
 for(const price of [0,-1,Infinity,'invalid',0.001,1e16])assert.throws(()=>calculateLand({area:1,price}));
 for(const extra of [{unit:'acre'},{basis:'unknown'},{currency:'EUR'}])assert.throws(()=>calculateLand({area:1,...extra}));
});
test('A mixed contribution separates the money, units and the relative proposed timeline',()=>{
 const r=simulateContribution({value:'2000000000',mode:'mixed',cashPercent:50,unitPrice:'250000000',milestone:'equilibrium',delayMonths:6,paymentCount:4,frequencyMonths:1,deliveryMonths:24});
 assert.equal(r.cashValue,1000000000);assert.equal(r.unitsValue,1000000000);assert.equal(r.fullUnits,4);assert.equal(r.unitRemainder,0);
 assert.deepEqual(r.payments.map(p=>p.amount),[250000000,250000000,250000000,250000000]);assert.deepEqual(r.payments.map(p=>p.month),[6,7,8,9]);assert.equal(r.deliveryMonths,24);
});
test('A partial unit remains a difference to negotiate and is never presented as a whole property',()=>{
 const r=simulateContribution({value:1000000000,mode:'units',unitPrice:300000000,currency:'USD'});
 assert.equal(r.fullUnits,3);assert.equal(r.unitRemainder,100000000);assert.equal(r.cashValue,0);assert.equal(r.unitPrice,300000000);assert.equal(r.payments.length,0);assert.equal(r.deliveryMonths,null);
});
test('Cash splits and installments preserve every cent, including rounding remainders',()=>{
 for(const value of [0.01,100.01,12345.67,2000000000.51])for(const percent of [0,1.23,33.33,50,99.99,100]){
  const r=simulateContribution({value,mode:'mixed',cashPercent:percent,unitPrice:3.33,paymentCount:value===0.01?1:7});
  assert.equal(Math.round(r.cashValue*100)+Math.round(r.unitsValue*100),Math.round(value*100));
  assert.equal(r.payments.reduce((sum,p)=>sum+Math.round(p.amount*100),0),Math.round(r.cashValue*100));
  assert.ok(r.payments.every(p=>p.month===null));
 }
});
test('Only active terms are evaluated; invalid percentages, counts and milestones are rejected',()=>{
 assert.doesNotThrow(()=>simulateContribution({value:100,mode:'cash',unitPrice:'invalid',cashPercent:'invalid',deliveryMonths:-1}));
 assert.doesNotThrow(()=>simulateContribution({value:100,mode:'units',unitPrice:25,paymentCount:'invalid',delayMonths:-1}));
 assert.doesNotThrow(()=>simulateContribution({value:100,mode:'mixed',cashPercent:100,unitPrice:''}));
 assert.throws(()=>simulateContribution({value:.01,mode:'cash',paymentCount:2}));
 for(const extra of [{mode:'mixed',cashPercent:-1},{mode:'mixed',cashPercent:100.01},{mode:'mixed',cashPercent:''},{mode:'mixed',cashPercent:33.333},{paymentCount:0},{paymentCount:121},{paymentCount:1.5},{delayMonths:-1},{delayMonths:1.5},{milestone:'toString'},{currency:'EUR'},{mode:'unknown'}])assert.throws(()=>simulateContribution({value:100,unitPrice:10,...extra}));
});
test('Checklist progress excludes only explicit non-applicable items and never implies complete verification',()=>{
 const state=normalizeChecklist({title:'Prueba',items:{title:'ready',registry:'na',forged:'ready',cadastral:'invalid'}}),count=negotiationChecklist.reduce((n,g)=>n+g.items.length,0);
 assert.deepEqual(checklistProgress(state),{ready:1,na:1,total:count-1,pending:count-2,percent:Math.round(100/(count-1))});
 assert.equal(state.items.cadastral,'pending');assert.ok(!('forged' in state.items));assert.match(checklistText(state),/no certifica propiedad/);
 const allNa=normalizeChecklist({items:Object.fromEntries(Object.keys(state.items).map(id=>[id,'na']))});assert.equal(checklistProgress(allNa).percent,0);assert.equal(checklistProgress(allNa).total,0);
});
test('A saved checklist round-trips only bounded known fields and tolerates corrupt browser storage',()=>{
 const source={title:'Terreno de ejemplo',notes:'Revisar el plano.',items:{boundary:'ready',title:'toString'}};
 const restored=readChecklist(JSON.stringify(source));assert.equal(restored.notes,source.notes);assert.equal(restored.items.boundary,'ready');assert.equal(restored.items.title,'pending');
 assert.deepEqual(readChecklist('{bad'),normalizeChecklist());assert.deepEqual(readChecklist('null'),normalizeChecklist());assert.deepEqual(readChecklist('x'.repeat(20001)),normalizeChecklist());
 assert.equal(normalizeChecklist({title:'x'.repeat(200),notes:'y'.repeat(2000)}).title.length,120);assert.equal(normalizeChecklist({notes:'y'.repeat(2000)}).notes.length,1000);
});
test('Every tool has a direct URL without admitting unrelated subpaths',()=>{
 for(const path of ['/herramientas','/calculadora-terreno','/checklist-negociacion','/simulador-aporte']){assert.equal(specialistRouteRedirect(new URL('https://portal.test'+path)),'https://portal.test/#'+path);assert.equal(specialistRouteRedirect(new URL('https://portal.test'+path+'/other')),null);}
});
