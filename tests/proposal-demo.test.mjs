import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProposalDraft,proposalErrors,submitDemoVersion,respondDemo,readDemoProposals} from '../web/proposal-demo-model.js';
const draft={mode:'sale',currency:'COP',amountCop:'1900000000',paymentNotes:'Saldo al formalizar, sujeto a revisión de títulos.',conditions:['titles'],validity:'15'};
test('Proposal currencies remain separate and conversion requires an explicit positive rate',()=>{
 const mixed=normalizeProposalDraft({...draft,currency:'COP+USD',amountUsd:'50000',rate:'4000'});
 assert.equal(mixed.amountCop,'1900000000');assert.equal(mixed.amountUsd,'50000');assert.equal(mixed.rate,'');
 const fixed=normalizeProposalDraft({...mixed,currency:'USD'});assert.equal(fixed.amountCop,'');assert.equal(fixed.amountUsd,'50000');
 const conversion={...draft,currency:'USD',usdMethod:'conversion',rate:'0'};
 assert.ok(proposalErrors(conversion).some(([key])=>key==='rate'));
 assert.deepEqual(proposalErrors({...conversion,rate:'4000'}),[]);
});
test('An unvalued contribution stays unpriced; a sale cannot bypass the amount requirement',()=>{
 const contribution=normalizeProposalDraft({...draft,mode:'contribution',valuationPending:true,amountUsd:'20',rate:'4000'});
 assert.equal(contribution.amountCop,'');assert.equal(contribution.amountUsd,'');assert.equal(contribution.rate,'');assert.deepEqual(proposalErrors(contribution),[]);
 assert.ok(proposalErrors({...contribution,mode:'sale'}).some(([key])=>key==='amountCop'));
 assert.ok(proposalErrors({...draft,paymentNotes:''},1).length===0);
 assert.ok(proposalErrors({...draft,paymentNotes:''},2).some(([key])=>key==='paymentNotes'));
});
test('Demo proposals alternate respondents, preserve prior versions and stop responses after selecting a base',()=>{
 const first=submitDemoVersion({propertyId:'TER-DEMO-001',versions:[],events:[]},draft,'buyer','2026-10-25T12:00:00Z');
 assert.equal(first.status,'open');assert.equal(first.versions[0].number,1);
 assert.throws(()=>submitDemoVersion(first,draft,'buyer'));
 assert.throws(()=>respondDemo(first,'base','buyer'));
 const second=submitDemoVersion(first,{...draft,amountCop:'2000000000'},'seller','2026-10-25T12:10:00Z');
 assert.equal(first.versions.length,1);assert.equal(second.versions[0].draft.amountCop,'1900000000');assert.equal(second.versions[1].draft.amountCop,'2000000000');
 const settled=respondDemo(second,'base','buyer');assert.equal(settled.status,'base');assert.equal(settled.versions.length,2);
 assert.throws(()=>submitDemoVersion(settled,draft,'seller'));assert.throws(()=>respondDemo(settled,'closed','seller'));
 assert.throws(()=>submitDemoVersion({versions:[],events:[]},draft,'seller'));
});
test('Only known demo terrains and safe enum values survive local draft restoration',()=>{
 const record=submitDemoVersion({propertyId:'TER-DEMO-001',versions:[],events:[]},draft,'buyer');
 const storage={getItem:()=>JSON.stringify({'TER-DEMO-001':record,'REAL-PRIVATE-001':record})};
 const restored=readDemoProposals(storage,['TER-DEMO-001']);assert.deepEqual(Object.keys(restored),['TER-DEMO-001']);
 assert.deepEqual(readDemoProposals({getItem:()=>'{bad'},['TER-DEMO-001']),{});
 assert.equal(normalizeProposalDraft({mode:'__proto__'}).mode,'sale');assert.equal(normalizeProposalDraft(null).currency,'COP');
 assert.deepEqual(normalizeProposalDraft({conditions:['titles','<script>','titles','finance']}).conditions,['titles','finance']);
});
