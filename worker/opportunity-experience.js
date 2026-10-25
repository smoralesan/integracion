import {normalizePresentation,availabilityLabels,evidenceLabels,possibleSameLand} from '../web/opportunity-model.js';
import {ownerRecord} from './review.js';
import {statusOf} from '../web/workflow-model.js';
export async function opportunityApi(request,env,c){
 const {bucket,prefix,json,error,bodyBytes,text,uuid,role,notify=async()=>{}}=c,path=new URL(request.url).pathname,metadata={httpMetadata:{contentType:'application/json'}};
 const own=path.match(/^\/api\/records\/([\w-]+)\/(presentation|availability)$/),team=path.match(/^\/api\/team\/records\/([^/]+)\/(quality|duplicates|link-asset)$/),publicMatch=path.match(/^\/api\/catalog\/([\w-]+)\/(report|photos)(?:\/([\w-]+))?$/);
 if(!own&&!team&&!publicMatch&&path!=='/api/team/reports')return null;
 const read=async key=>{const o=await bucket.get(key);return o?{record:await o.json(),etag:o.etag}:null;};
 const body=async()=>JSON.parse(new TextDecoder().decode(await bodyBytes(request,30000)));
 const save=async(s,key,data,message)=>{if(data.revision!==(s.record.revision||0))error(409,'El expediente cambió. Actualiza antes de guardar.');s.record.revision=(s.record.revision||0)+1;s.record.updatedAt=new Date().toISOString();s.record.history=[...(s.record.history||[]),{id:crypto.randomUUID(),at:s.record.updatedAt,status:statusOf(s.record),type:'information',message}];if(await bucket.put(key,JSON.stringify(s.record),{...metadata,onlyIf:{etagMatches:s.etag}})===null)error(409,'Otra sesión actualizó el expediente.');await notify({prefix:key.split('records/')[0],kind:'record',reference:s.record.reference,href:'#/mi-expediente/'+s.record.id,eventId:s.record.id+':'+s.record.revision});return s.record;};
 if(own){
  if(request.method!=='POST')error(405,'Método no permitido.');if(!uuid.test(own[1]))error(404,'Expediente no encontrado.');const key=prefix+'records/'+own[1]+'.json',s=await read(key);if(!s)error(404,'Expediente no encontrado.');const data=await body();
  if(own[2]==='availability'){
   if(!['available','negotiating','withdrawn'].includes(data.availability))error(400,'Selecciona una disponibilidad válida.');
   s.record.availability=data.availability;s.record.availabilityConfirmedAt=new Date().toISOString();
   return json(ownerRecord(await save(s,key,data,'El titular confirmó disponibilidad: '+availabilityLabels[data.availability]+'.')));
  }
  if(data.authorized!==true)error(400,'Autoriza expresamente el contenido de esta ficha pública.');
  let p;try{p=normalizePresentation(data.presentation);}catch(e){error(400,e.message);}
  const attached=new Set((s.record.files||[]).map(f=>f.id));
  for(const id of new Set([...p.photoIds,...Object.values(p.evidence).flat()])){
   if(!attached.has(id))error(400,'Selecciona soportes vinculados a este expediente.');
   const meta=(await read(prefix+'documents/'+id+'/meta.json'))?.record;if(!meta||Date.parse(meta.expiresAt)<=Date.now())error(400,'Un soporte seleccionado venció o no está disponible.');
   if(p.photoIds.includes(id)&&(meta.origin!=='file'||!['jpg','jpeg','png'].includes(meta.extension)))error(400,'La galería pública solo admite fotos JPG o PNG vigentes del expediente.');
  }
  if(p.shareGeometry&&!s.record.parcel?.geometry)error(400,'No hay un perímetro confirmado para compartir.');
  s.record.publicPresentation=p;s.record.publicationConsent={authorized:true,version:'detail-v2',at:new Date().toISOString(),includesNeighborhood:data.includeNeighborhood===true};s.record.evidenceReview={};
  if(['approved','published'].includes(statusOf(s.record)))s.record.status='in_review';
  return json(ownerRecord(await save(s,key,data,'El titular autorizó una ficha ampliada. Su publicación queda sujeta a revisión del equipo.')));
 }
 if(team){
  if(!role)error(403,'Solo el equipo autorizado puede gestionar estos datos.');const decoded=decodeURIComponent(team[1]),m=decoded.match(/^([0-9a-f]{64}):([0-9a-f-]{36})$/);if(!m||!uuid.test(m[2]))error(404,'Expediente no encontrado.');const key='users/'+m[1]+'/records/'+m[2]+'.json',s=await read(key);if(!s)error(404,'Expediente no encontrado.');
  if(team[2]==='quality'&&request.method==='POST'){
   const data=await body();if(!Object.hasOwn(evidenceLabels,data.group)||!['declared','reviewed'].includes(data.state))error(400,'Selecciona un grupo y estado válidos.');
   const ids=s.record.publicPresentation?.evidence?.[data.group]||[],active=(s.record.files||[]).filter(f=>ids.includes(f.id)&&Date.parse(f.expiresAt)>Date.now());
   if(data.state==='reviewed'&&!active.length)error(400,'Para registrar una revisión debe existir un soporte vigente en ese grupo.');
   if(data.state==='reviewed'&&text(data.note,1000).length<10)error(400,'Describe qué se revisó y qué queda pendiente.');
   s.record.evidenceReview={...s.record.evidenceReview,[data.group]:{state:data.state,at:new Date().toISOString(),note:text(data.note,1000)}};
   return json(ownerRecord(await save(s,key,data,'El equipo actualizó la revisión de '+evidenceLabels[data.group]+'. No constituye certificación.')));
  }
  if(team[2]==='duplicates'&&request.method==='GET'){
   let cursor,results=[],pages=0;do{const batch=await bucket.list({prefix:'users/',limit:100,...(cursor?{cursor}:{})});cursor=batch.truncated?batch.cursor:null;for(const o of batch.objects){if(!/^users\/[0-9a-f]{64}\/records\/[0-9a-f-]{36}\.json$/.test(o.key)||o.key===key)continue;const other=(await read(o.key))?.record;if(other&&(possibleSameLand(s.record,other)||(s.record.assetId||s.record.id)===(other.assetId||other.id)))results.push({teamKey:o.key.split('/')[1]+':'+other.id,reference:other.reference,title:other.form.title,relationship:other.form.relationship,exclusive:other.form.broker_exclusivity||'unknown',linked:(s.record.assetId||s.record.id)===(other.assetId||other.id)});}pages++;}while(cursor&&pages<3);
   return json({candidates:results,partial:!!cursor});
  }
  if(team[2]==='link-asset'&&request.method==='POST'){
   if(role!=='admin')error(403,'La vinculación requiere administración.');const data=await body(),target=String(data.target||'').match(/^([0-9a-f]{64}):([0-9a-f-]{36})$/);if(!target||!uuid.test(target[2])||data.target===decoded||data.confirm!==true||text(data.note,1000).length<10)error(400,'Selecciona otro expediente y explica la vinculación confirmada.');
   const other=(await read('users/'+target[1]+'/records/'+target[2]+'.json'))?.record;if(!other||other.kind!=='terreno'||s.record.kind!=='terreno')error(400,'Solo se vinculan expedientes de terreno.');
   s.record.assetId=other.assetId||other.id;s.record.assetLinkNote=text(data.note,1000);return json(ownerRecord(await save(s,key,data,'Administración vinculó este expediente al mismo inmueble de '+other.reference+'. La representación y exclusividad se conservan por expediente.')));
  }
  error(405,'Método no permitido.');
 }
 if(path==='/api/team/reports'){
  if(!role)error(403,'Solo el equipo autorizado puede ver reportes.');if(request.method!=='GET')error(405,'Método no permitido.');const page=await bucket.list({prefix:'publication-reports/',limit:30});return json({reports:await Promise.all(page.objects.map(async o=>(await read(o.key)).record)),partial:page.truncated});
 }
 if(!uuid.test(publicMatch[1]))error(404,'Publicación no encontrada.');const locator=(await read('catalog/'+publicMatch[1]+'.json'))?.record;
 if(!locator||!/^users\/[0-9a-f]{64}\/records\/[0-9a-f-]{36}\.json$/.test(locator.recordKey))error(404,'Publicación no encontrada.');
 const r=(await read(locator.recordKey))?.record;if(!r||statusOf(r)!=='published'||!r.publicationConsent?.authorized||r.publicationId!==publicMatch[1])error(404,'Publicación no disponible.');
 if(publicMatch[2]==='report'&&request.method==='POST'){
  const data=await body();if(!uuid.test(data.id)||!['outdated','duplicate','representation','other'].includes(data.reason)||text(data.message,1000).length<10)error(400,'Elige un motivo y describe la inconsistencia.');
  const key='publication-reports/'+data.id+'.json',old=await read(key);if(old&&old.record.reporterPrefix!==prefix)error(409,'Referencia de reporte ya usada.');
  await bucket.put(key,JSON.stringify({id:data.id,publicationId:r.publicationId,reference:r.reference,reason:data.reason,message:text(data.message,1000),reporterPrefix:prefix,createdAt:new Date().toISOString()}),{...metadata,onlyIf:{etagDoesNotMatch:'*'}});return json({received:true,id:data.id},201);
 }
 if(publicMatch[2]==='photos'&&request.method==='GET'){
  const id=publicMatch[3];if(!uuid.test(id||'')||r.publicationConsent.version!=='detail-v2'||!r.publicPresentation?.photoIds?.includes(id)||!r.files.some(f=>f.id===id))error(404,'Foto no disponible.');
  const owner=locator.recordKey.split('records/')[0],meta=(await read(owner+'documents/'+id+'/meta.json'))?.record;
  if(!meta||meta.origin!=='file'||!['jpg','jpeg','png'].includes(meta.extension)||Date.parse(meta.expiresAt)<=Date.now())error(404,'Foto no disponible.');const obj=await bucket.get(owner+'documents/'+id+'/content');if(!obj)error(404,'Foto no disponible.');return new Response(obj.body,{headers:{'content-type':meta.extension==='png'?'image/png':'image/jpeg','cache-control':'no-store','x-content-type-options':'nosniff'}});
 }
 error(405,'Método no permitido.');
}
