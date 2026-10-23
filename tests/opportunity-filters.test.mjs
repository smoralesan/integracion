import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesOpportunityFilters,declaredCOPPrice,areaBands} from '../web/opportunity-filters.js';
const lot={type:'terreno',city:'Bogotá',region:'Bogotá D.C.',title:'Lote para desarrollar',label:'Terreno urbano',area:3100,price:2790000000,mode:'Venta'};
test('keyword matching ignores accents and includes classification',()=>{
 assert.equal(matchesOpportunityFilters(lot,{query:'bogota',type:'terreno'}),true);
 assert.equal(matchesOpportunityFilters(lot,{query:'urbano'}),true);
 assert.equal(matchesOpportunityFilters(lot,{query:'Medellín'}),false);
 assert.equal(matchesOpportunityFilters(lot,{type:'proyecto'}),false);
});
test('area and price filters combine and respect inclusive limits',()=>{
 assert.equal(matchesOpportunityFilters(lot,{min:'3000',max:'3100',maxPrice:'2790000000'}),true);
 assert.equal(matchesOpportunityFilters(lot,{min:'3000',max:'3100',maxPrice:'2500000000'}),false);
 assert.equal(matchesOpportunityFilters({...lot,area:null},{min:'1'}),false);
 assert.ok(areaBands.every(([, ,min,max])=>!min||!max||Number(min)<=Number(max)));
});
test('COP filters exclude unknown prices, USD and mixed payment amounts',()=>{
 const summary={kind:'terreno',price_method:'cop',amount:'2080000000',area:'5200',negotiation:'sale'};
 assert.equal(declaredCOPPrice(summary),2080000000);
 assert.equal(matchesOpportunityFilters(summary,{maxPrice:'2500000000',mode:'Venta'}),true);
 for(const method of ['usd','mixed'])assert.equal(matchesOpportunityFilters({...summary,price_method:method},{maxPrice:'10000000000'}),false);
 assert.equal(matchesOpportunityFilters({kind:'terreno',amount:''},{maxPrice:'10000000000'}),false);
 assert.equal(matchesOpportunityFilters({kind:'terreno',amount:''},{}),true);
});
test('public summaries match text, opportunity type and area together',()=>{
 assert.equal(matchesOpportunityFilters({kind:'proyecto',city:'Bogotá',title:'Proyecto residencial',area:'12000'},{type:'proyecto',query:'residencial',min:'10000'}),true);
 assert.equal(matchesOpportunityFilters({kind:'proyecto',city:'Bogotá',title:'Proyecto residencial',area:''},{min:'10000'}),false);
});
