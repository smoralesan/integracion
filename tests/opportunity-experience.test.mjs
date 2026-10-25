import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi} from '../worker/api.js';
import {MemoryBucket} from './support/memory-bucket.mjs';
import {publicSummary} from '../web/workflow-model.js';
import {normalizePresentation,publicExperience,possibleSameLand,comparableRecord} from '../web/opportunity-model.js';
import {readRescueAmount} from '../web/opportunity-experience.js';
import {queueNotice,deliverNotice,notifyMutation} from '../worker/notifications.js';
const geometry={type:'Polygon',coordinates:[[[-75.5,10.4],[-75.49,10.4],[-75.49,10.41],[-75.5,10.41],[-75.5,10.4]]]};
function harness(){const bucket=new MemoryBucket(),env={BUCKET:bucket,II_TEAM_ROLES:JSON.stringify({'admin@example.test':'admin'})};const call=async(path,body,user='alice',method=body?'POST':'GET')=>handleApi(new Request('https://portal.test/api/'+path,{method,headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test',origin:'https://portal.test','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);return {bucket,env,call};}
async function seed(h,user='alice'){const res=await h.call('records',{id:crypto.randomUUID(),kind:'terreno',form:{title:'Terreno de prueba',relationship:'owner',city:'Cartagena',region:'Bolívar',area:'5200',description:'PRIVATE-NOT-PUBLIC',project_land_confirmed:true},parcel:{geometry,confirmed:true},documentIds:[]},user);assert.equal(res.status,201);return res.json();}
test('La ficha ampliada exige autorización y nunca copia descripción privada ni geometría por defecto',async()=>{
 const h=harness(),r=await seed(h),base='records/'+r.id+'/presentation';
 assert.equal((await h.call(base,{revision:0,presentation:{description:'Intento'}})).status,400);
 assert.equal((await h.call(base,{revision:0,authorized:true,presentation:{}},'bob')).status,404);
 const updated=await(await h.call(base,{revision:0,authorized:true,presentation:{description:'Contenido público nuevo',shareGeometry:false,technical:{water:'Por confirmar'}}})).json();
 const view=publicSummary(updated);assert.equal(view.description,'Contenido público nuevo');assert.equal(view.geometry,null);assert.ok(!JSON.stringify(view).includes('PRIVATE-NOT-PUBLIC'));assert.equal(updated.publicationConsent.version,'detail-v2');
 assert.equal((await h.call(base,{revision:0,authorized:true,presentation:{}})).status,409);
 const legacy=publicSummary({...updated,publicationConsent:{authorized:true,version:'summary-v1'}});assert.equal(legacy.description,undefined);assert.equal(legacy.geometry,undefined);assert.equal(legacy.photos,undefined);
});
test('Fotos públicas requieren imagen propia vinculada, vigencia y consentimiento actual; revocar corta acceso',async()=>{
 const h=harness(),r=await seed(h),key=[...h.bucket.objects.keys()].find(k=>k.endsWith('/records/'+r.id+'.json')),owner=key.split('records/')[0],id=crypto.randomUUID(),expiresAt=new Date(Date.now()+86400000).toISOString();
 const stored=await(await h.bucket.get(key)).json();stored.files=[{id,name:'obra.png',origin:'file',expiresAt}];await h.bucket.put(key,JSON.stringify(stored));await h.bucket.put(owner+'documents/'+id+'/meta.json',JSON.stringify({id,origin:'file',extension:'png',expiresAt}));await h.bucket.put(owner+'documents/'+id+'/content',new Uint8Array([137,80,78,71]));
 assert.equal((await h.call('records/'+r.id+'/presentation',{revision:0,authorized:true,presentation:{photoIds:[crypto.randomUUID()]}})).status,400);
 let current=await(await h.call('records/'+r.id+'/presentation',{revision:0,authorized:true,presentation:{photoIds:[id],shareGeometry:true,evidence:{technical:[id]}}})).json();assert.deepEqual(publicSummary(current).geometry,geometry);
 const raw=await(await h.bucket.get(key)).json();raw.status='published';await h.bucket.put(key,JSON.stringify(raw));await h.bucket.put('catalog/'+raw.publicationId+'.json',JSON.stringify({id:raw.publicationId,recordKey:key}));
 const leadSource=await(await h.call('purchase-leads/source/publication/'+raw.publicationId,null,'bob')).json();assert.equal(leadSource.source.snapshot.geometry,undefined);assert.equal(leadSource.source.snapshot.photos,undefined);
 const photo='catalog/'+raw.publicationId+'/photos/'+id;assert.equal((await h.call(photo,null,'bob')).status,200);
 assert.equal((await h.call('team/records/'+owner.split('/')[1]+':'+r.id+'/quality',{revision:current.revision,group:'technical',state:'reviewed',note:'Se revisó la fotografía; sin certificación.'},'bob')).status,403);
 assert.equal(publicExperience(current,Date.now()+2*86400000).photos.length,0);
 await h.call('records/'+r.id+'/publication-consent',{revision:current.revision,authorized:false});assert.equal((await h.call(photo,null,'bob')).status,404);
});
test('Disponibilidad no se puede cambiar por terceros; retirado bloquea nuevos intereses',async()=>{
 const h=harness(),r=await seed(h);assert.equal((await h.call('records/'+r.id+'/availability',{revision:0,availability:'withdrawn'},'bob')).status,404);
 const changed=await(await h.call('records/'+r.id+'/availability',{revision:0,availability:'withdrawn'})).json();assert.equal(changed.availability,'withdrawn');assert.ok(changed.availabilityConfirmedAt);
 const key=[...h.bucket.objects.keys()].find(k=>k.endsWith('/records/'+r.id+'.json')),raw=await(await h.bucket.get(key)).json();raw.status='published';raw.publicationConsent={authorized:true,version:'summary-v1'};await h.bucket.put(key,JSON.stringify(raw));await h.bucket.put('catalog/'+raw.publicationId+'.json',JSON.stringify({id:raw.publicationId,recordKey:key}));
 assert.equal((await h.call('purchase-leads/source/publication/'+raw.publicationId,null,'bob')).status,409);
});
test('La coincidencia propone revisar y no concede acceso; vincular requiere administrador y confirmación',async()=>{
 const h=harness(),a=await seed(h),b=await seed(h,'bob'),queue=await(await h.call('team/records',null,'admin')).json(),ka=queue.records.find(x=>x.id===a.id).teamKey,kb=queue.records.find(x=>x.id===b.id).teamKey;
 assert.equal((await h.call('team/records/'+ka+'/duplicates')).status,403);
 const candidates=await(await h.call('team/records/'+ka+'/duplicates',null,'admin')).json();assert.equal(candidates.candidates.length,1);assert.equal(candidates.candidates[0].linked,false);
 assert.equal((await h.call('team/records/'+ka+'/link-asset',{revision:0,target:kb,confirm:false,note:'Mismo perímetro identificado.'},'admin')).status,400);
 const linked=await(await h.call('team/records/'+ka+'/link-asset',{revision:0,target:kb,confirm:true,note:'Mismo perímetro identificado con los soportes.'},'admin')).json();assert.equal(linked.assetId,b.id);assert.equal(linked.files.length,0);assert.ok(possibleSameLand({...a,parcel:{geometry}}, {...b,parcel:{geometry}}));
});
test('Comparación no mezcla moneda ni convierte componentes mixtos; normalización rechaza cifras incompatibles',()=>{
 const usd=comparableRecord({id:crypto.randomUUID(),kind:'terreno',area:'1000',amount:'250000',price_method:'usd'});assert.equal(usd.currency,'USD');assert.equal(usd.amount,250000);assert.equal(usd.area,1000);
 assert.throws(()=>normalizePresentation({rescue:{constructionProgress:101}}));assert.throws(()=>normalizePresentation({rescue:{projectedSales:100,effectiveSales:150}}));assert.throws(()=>normalizePresentation({rescue:{suspendedAt:'2026-02-30'}}));
});
test('Avisos son privados, preferencias usan solo correo de cuenta y Brevo no envía sin configuración',async()=>{
 const h=harness();let settings=await(await h.call('notification-settings',{enabled:true,email:'victim@example.test'})).json();assert.equal(settings.enabled,true);
 const pref=[...h.bucket.objects.keys()].find(k=>k.endsWith('notification-settings.json')),stored=await(await h.bucket.get(pref)).json();assert.equal(stored.email,'alice@example.test');
 const prefix=pref.split('notification-settings.json')[0],key=await queueNotice(h.bucket,prefix,{eventId:'one',reference:'TER-TEST',href:'#/mi-espacio',kind:'record'});await queueNotice(h.bucket,prefix,{eventId:'one',reference:'TER-TEST',href:'#/mi-espacio',kind:'record'});
 let calls=0;await deliverNotice(h.bucket,key,{},async()=>{calls++;});assert.equal(calls,0);assert.equal((await(await h.bucket.get(key)).json()).emailStatus,'pending_configuration');
 assert.equal((await(await h.call('notifications',null,'bob')).json()).notifications.length,0);assert.equal((await(await h.call('notifications')).json()).notifications.length,1);
 const env={II_EMAIL_ENABLED:'true',BREVO_API_KEY:'test-key',BREVO_SENDER_EMAIL:'portal@example.test'};
 await deliverNotice(h.bucket,key,env,async(url,opt)=>{calls++;assert.equal(url,'https://api.brevo.com/v3/smtp/email');const data=JSON.parse(opt.body);assert.equal(data.to[0].email,'alice@example.test');assert.ok(!data.textContent.includes('PRIVATE'));return Response.json({messageId:'ok'}, {status:201});});await deliverNotice(h.bucket,key,env,async()=>{calls++;});assert.equal(calls,1);
 const uncertain=await queueNotice(h.bucket,prefix,{eventId:'two',reference:'TER-TEST',href:'#/mi-espacio',kind:'record'});await deliverNotice(h.bucket,uncertain,env,async()=>{calls++;throw Error('timeout');});await deliverNotice(h.bucket,uncertain,env,async()=>{calls++;});assert.equal(calls,2);assert.equal((await(await h.bucket.get(uncertain)).json()).emailStatus,'unknown');
});

test('La captura monetaria de reactivación conserva centavos y valores desconocidos',()=>{assert.equal(readRescueAmount('1.234.567,89'),'1234567.89');assert.equal(readRescueAmount(''),'');assert.equal(readRescueAmount('0,00'),'0.00');assert.throws(()=>readRescueAmount('ABC'));});

test('Los avisos al equipo solo usan una cuenta autenticada suscrita y con rol configurado',async()=>{const h=harness(),r=await seed(h);await h.call('notification-settings',{enabled:true},'admin');const request=new Request('https://portal.test/api/records',{method:'POST',headers:{'oai-authenticated-user-id':'alice'}});await notifyMutation(request,Response.json(r,{status:201}),{...h.env,BREVO_TEAM_EMAIL:'admin@example.test'});assert.equal((await(await h.call('notifications',null,'admin')).json()).notifications.length,1);assert.equal((await(await h.call('notifications',null,'bob')).json()).notifications.length,0);});

test('Expanded presentations share neighborhoods only with the matching authorization',()=>{
 const record={kind:'terreno',form:{neighborhood:'  El Prado  '},publicationConsent:{authorized:true,version:'detail-v2'}};
 assert.equal(publicSummary(record).neighborhood,undefined);
 assert.equal(publicSummary({...record,publicationConsent:{...record.publicationConsent,includesNeighborhood:true}}).neighborhood,'El Prado');
 assert.equal(publicSummary({...record,publicationConsent:{...record.publicationConsent,authorized:false,includesNeighborhood:true}}).neighborhood,undefined);
 assert.equal(publicSummary({...record,form:{neighborhood:'  '},publicationConsent:{...record.publicationConsent,includesNeighborhood:true}}).neighborhood,undefined);
});
