import {attachProfile,participantsView} from './profiles.js';
import {statusOf,permittedTransitions,publicSummary} from '../web/workflow-model.js';
const teamKeyPattern=/^([0-9a-f]{64}):([0-9a-f-]{36})$/;
export function teamRole(request,env){
  try{const email=request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();const role=JSON.parse(env.II_TEAM_ROLES||'{}')[email];return ['admin','reviewer'].includes(role)?role:null;}catch{return null;}
}
export function ownerRecord(record){
  const {internalNotes,owner,...safe}=record;
  return {...participantsView(safe,'/api/records/'+record.id),status:statusOf(record),revision:record.revision||0,history:(record.history||[]).map(({actor,...event})=>event)};
}
export function initialWorkflow(request){
  return {revision:0,publicationId:crypto.randomUUID(),owner:{email:request.headers.get('oai-authenticated-user-email')||null},history:[{id:crypto.randomUUID(),type:'received',status:'received',at:new Date().toISOString(),message:'Expediente recibido para revisión.'}],internalNotes:[]};
}
export async function reviewApi(request,env,context){
  const {bucket,prefix,json,error,bodyBytes,text,documentMeta,uuid}=context,url=new URL(request.url),path=url.pathname,role=teamRole(request,env);
  const now=()=>new Date().toISOString();
  const event=(record,type,message,extra={})=>{record.history=[...(record.history?.length?record.history:[{id:crypto.randomUUID(),at:record.createdAt,type:'received',status:'received',message:'Expediente recibido para revisión.'}]),{id:crypto.randomUUID(),at:now(),type,status:statusOf(record),message,actor:request.headers.get('oai-authenticated-user-email')||'Titular',...extra}];};
  async function read(key){const object=await bucket.get(key);if(!object)error(404,'Expediente no encontrado.');return {record:await object.json(),etag:object.etag};}
  async function write(key,record,etag,version){
    if(!Number.isInteger(version)||version!==(record.revision||0))error(409,'El expediente cambió. Actualiza la página antes de guardar.');
    record.revision=(record.revision||0)+1;record.updatedAt=now();
    const result=await bucket.put(key,JSON.stringify(record),{onlyIf:{etagMatches:etag},httpMetadata:{contentType:'application/json'}});
    if(result===null)error(409,'Otra persona actualizó el expediente. Recarga para ver sus cambios.');
    return record;
  }
  async function data(limit=16000){return JSON.parse(new TextDecoder().decode(await bodyBytes(request,limit)));}
  async function visibleRecord(locator){
    if(!locator||!uuid.test(locator.id||'')||!/^users\/[0-9a-f]{64}\/records\/[0-9a-f-]{36}\.json$/.test(locator.recordKey||''))return null;
    const object=await bucket.get(locator.recordKey);if(!object)return null;const r=await object.json();
    if(statusOf(r)!=='published'||!r.publicationConsent?.authorized||r.publicationId!==locator.id)return null;
    if(r.publicationConsent.version==='detail-v2'){const ownerPrefix=locator.recordKey.split('records/')[0];const files=await Promise.all((r.files||[]).map(async f=>{const meta=await bucket.get(ownerPrefix+'documents/'+f.id+'/meta.json');if(!meta)return null;const m=await meta.json();return Date.parse(m.expiresAt)>Date.now()?{...f,expiresAt:m.expiresAt}:null;}));r.files=files.filter(Boolean);}
    return {...publicSummary(r),publishedAt:r.publishedAt};
  }
  // The catalog contains only the explicit public projection, rechecked against live consent.
  if(path==='/api/catalog'&&request.method==='GET'){
    const cursor=url.searchParams.get('cursor');if(cursor?.length>2048)error(400,'Página inválida.');
    const page=await bucket.list({prefix:'catalog/',limit:30,...(cursor?{cursor}:{})});
    const records=await Promise.all(page.objects.map(async o=>{const obj=await bucket.get(o.key);return obj?visibleRecord(await obj.json()):null;}));
    return json({records:records.filter(Boolean),cursor:page.truncated?page.cursor:null});
  }
  const publicMatch=path.match(/^\/api\/catalog\/([\w-]+)$/);
  if(publicMatch&&request.method==='GET'){
    if(!uuid.test(publicMatch[1]))error(404,'Publicación no disponible.');
    const obj=await bucket.get('catalog/'+publicMatch[1]+'.json'),r=obj?await visibleRecord(await obj.json()):null;
    if(!r)error(404,'Publicación no disponible.');return json(r);
  }
  if(path.startsWith('/api/team/')){
    if(!role)error(403,'Esta bandeja está reservada al equipo autorizado.');
    if(path==='/api/team/records'&&request.method==='GET'){
      let cursor=url.searchParams.get('cursor'),records=[],pages=0;
      if(cursor?.length>2048)error(400,'Página inválida.');
      do{
        const page=await bucket.list({prefix:'users/',limit:100,...(cursor?{cursor}:{})});cursor=page.truncated?page.cursor:null;
        const rows=await Promise.all(page.objects.filter(o=>/^users\/[0-9a-f]{64}\/records\/[\w-]+\.json$/.test(o.key)).map(async o=>{
          const object=await bucket.get(o.key);if(!object)return null;const r=await object.json();return {teamKey:o.key.split('/')[1]+':'+r.id,id:r.id,reference:r.reference,kind:r.kind,title:r.form.title,city:r.form.city,region:r.form.region,status:statusOf(r),assignee:r.assignee||'',createdAt:r.createdAt,updatedAt:r.updatedAt||r.createdAt};
        }));records.push(...rows.filter(Boolean));pages++;
      }while(cursor&&pages<3&&records.length<30);
      return json({records,cursor,role});
    }
    const match=path.match(/^\/api\/team\/records\/([^/]+)(?:\/documents\/([\w-]+)(\/download)?)?$/);
    if(!match)return null;
    const parsed=decodeURIComponent(match[1]).match(teamKeyPattern);if(!parsed||!uuid.test(parsed[2]))error(404,'Expediente no encontrado.');
    const ownerPrefix='users/'+parsed[1]+'/',key=ownerPrefix+'records/'+parsed[2]+'.json';
    const {record,etag}=await read(key);record.status=statusOf(record);record.revision||=0;
    if(match[2]){
      if(request.method!=='GET')error(405,'Método no permitido.');
      if(!record.files.some(f=>f.id===match[2]))error(404,'Documento no vinculado al expediente.');
      const meta=await documentMeta(bucket,ownerPrefix,match[2],Date.now());
      if(match[3]&&meta.origin==='file'){
        const object=await bucket.get(ownerPrefix+'documents/'+meta.id+'/content');if(!object)error(404,'Archivo no disponible.');
        return new Response(object.body,{headers:{'content-type':'application/octet-stream','content-disposition':`attachment; filename*=UTF-8''${encodeURIComponent(meta.name)}`,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
      }
      return json(meta);
    }
    if(request.method==='GET')return json({...participantsView(record,'/api/team/records/'+encodeURIComponent(parsed[0])),teamKey:parsed[0],role});
    if(request.method!=='PATCH')error(405,'Método no permitido.');
    const body=await data(),target=body.status||record.status,message=text(body.message,2000),note=text(body.internalNote,2000),assignee=Object.hasOwn(body,'assignee')?text(body.assignee,100):record.assignee||'';
    if(target!==record.status&&!permittedTransitions(record,role).includes(target))error(403,'Tu rol o el estado actual no permiten este cambio.');
    if(target==='needs_information'&&!message)error(400,'Indica al propietario qué información necesita completar.');
    if(record.status==='published'&&target!==record.status&&!message)error(400,'Explica por qué retiras la publicación.');
    if(target==='published'&&(!record.publicationConsent?.authorized||!record.publicationId))error(400,'El propietario debe autorizar el resumen antes de publicar.');
    if(target===record.status&&!message&&!note&&assignee===(record.assignee||''))error(400,'No hay cambios para guardar.');
    const previous=record.status;record.status=target;record.assignee=assignee;
    if(note)record.internalNotes=[...(record.internalNotes||[]),{id:crypto.randomUUID(),at:now(),actor:request.headers.get('oai-authenticated-user-email')||'Equipo',message:note}];
    if(message)await attachProfile(record,bucket,prefix,'Equipo de revisión');
    event(record,target!==previous?'status':'comment',message||'El equipo actualizó el seguimiento.',{from:previous});
    if(target==='published'){
      record.publishedAt||=now();
      // Write the locator first: it stays invisible until the conditional record update succeeds.
      await bucket.put('catalog/'+record.publicationId+'.json',JSON.stringify({id:record.publicationId,recordKey:key}),{httpMetadata:{contentType:'application/json'}});
    }
    await write(key,record,etag,body.revision);return json({...participantsView(record,'/api/team/records/'+encodeURIComponent(parsed[0])),teamKey:parsed[0],role});
  }
  const ownMatch=path.match(/^\/api\/records\/([\w-]+)\/(reply|publication-consent|profile)$/);
  if(ownMatch&&request.method==='POST'){
    if(!uuid.test(ownMatch[1]))error(404,'Expediente no encontrado.');
    const key=prefix+'records/'+ownMatch[1]+'.json',{record,etag}=await read(key),body=await data();record.status=statusOf(record);
    if(ownMatch[2]==='profile'){
      if(!await attachProfile(record,bucket,prefix,'Titular del proyecto'))error(400,'Guarda tu perfil y activa su uso en proyectos antes de vincularlo.');
      event(record,'profile','El titular vinculó su perfil al proyecto.');
    }else if(ownMatch[2]==='publication-consent'){
      if(typeof body.authorized!=='boolean')error(400,'Selecciona si autorizas la publicación del resumen.');
      record.publicationId||=crypto.randomUUID();
      record.publicationConsent={authorized:body.authorized,at:now(),version:'summary-v1',includesNeighborhood:body.authorized&&body.includeNeighborhood===true};
      if(!body.authorized&&record.status==='published')record.status='approved';
      event(record,body.authorized?'consent':'revoked',body.authorized?'El titular autorizó publicar el resumen mostrado.':'El titular retiró la autorización de publicación.');
    }else{
      if(record.status!=='needs_information')error(409,'El expediente no tiene una solicitud de información pendiente.');
      const message=text(body.message,2000);if(!message)error(400,'Escribe tu respuesta al equipo.');
      const ids=body.documentIds||[];if(!Array.isArray(ids)||ids.length>20)error(400,'Puedes adjuntar hasta 20 documentos.');
      const files=new Map(record.files.map(f=>[f.id,f]));
      for(const id of new Set(ids)){
        const m=await documentMeta(bucket,prefix,id,Date.now());files.set(id,{id:m.id,name:m.name,size:m.size,origin:m.origin,createdAt:m.createdAt,expiresAt:m.expiresAt,analysis:{status:m.analysis.status,message:m.analysis.message}});
      }
      if(files.size>20)error(400,'El expediente admite hasta 20 documentos en total.');
      record.files=[...files.values()];record.status='in_review';await attachProfile(record,bucket,prefix,'Titular del proyecto');event(record,'reply',message,{from:'needs_information'});
    }
    await write(key,record,etag,body.revision);return json(ownerRecord(record));
  }
  return null;
}
