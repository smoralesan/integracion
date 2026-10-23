import {normalizeServiceRequest,ownerServiceRequest,serviceStates,serviceTransitions} from '../web/service-request-model.js';
import {profileView} from './profiles.js';
export async function serviceRequestsApi(request,env,context){
 const {bucket,prefix,json,error,bodyBytes,text,uuid,teamRole}=context,url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/service-requests')&&!path.startsWith('/api/team/service-requests')&&!path.startsWith('/api/team/ally-profiles'))return null;
 const metadata={httpMetadata:{contentType:'application/json'}},now=()=>new Date().toISOString(),actor=request.headers.get('oai-authenticated-user-email')||'Equipo';
 const read=async key=>{const obj=await bucket.get(key);return obj?{record:await obj.json(),etag:obj.etag}:null;};
 const input=async()=>JSON.parse(new TextDecoder().decode(await bodyBytes(request,20000)));
 const cursor=()=>{const v=url.searchParams.get('cursor');if(v&&v.length>2048)error(400,'Página inválida.');return v;};
 const team=()=>{if(!teamRole)error(403,'Acceso reservado al equipo autorizado.');};
 async function update(stored,key,data){if(data.revision!==stored.record.revision)error(409,'La solicitud cambió. Actualiza antes de guardar.');stored.record.revision++;stored.record.updatedAt=now();if(await bucket.put(key,JSON.stringify(stored.record),{...metadata,onlyIf:{etagMatches:stored.etag}})===null)error(409,'Otra sesión actualizó la solicitud. Recarga para continuar.');return stored.record;}
 async function teamRequest(id){if(!uuid.test(id))error(404,'Solicitud no encontrada.');const index=await read('service-request-index/'+id+'.json');if(!index||!/^users\/[0-9a-f]{64}\/service-requests\/[0-9a-f-]{36}\.json$/.test(index.record.recordKey))error(404,'Solicitud no encontrada.');const stored=await read(index.record.recordKey);if(!stored)error(404,'Solicitud no encontrada.');return {...stored,key:index.record.recordKey};}
 async function sharedProfile(id){if(!uuid.test(id))error(404,'Perfil no disponible.');const index=await read('ally-profiles/'+id+'.json');if(!index||!/^users\/[0-9a-f]{64}\/profile\.json$/.test(index.record.profileKey))return null;const p=(await read(index.record.profileKey))?.record;return p?.shareWithTeam&&p.id===id?p:null;}
 if(path.startsWith('/api/team/ally-profiles')){
  team();const match=path.match(/^\/api\/team\/ally-profiles\/([\w-]+)\/avatar$/);
  if(match&&request.method==='GET'){const p=await sharedProfile(match[1]),image=p?.avatarKey?await bucket.get(p.avatarKey):null;if(!image)error(404,'Imagen no disponible.');return new Response(image.body,{headers:{'content-type':'image/png','cache-control':'private, no-store','x-content-type-options':'nosniff'}});}
  if(path!=='/api/team/ally-profiles'||request.method!=='GET')error(404,'Ruta no disponible.');
  const c=cursor(),page=await bucket.list({prefix:'ally-profiles/',limit:30,...(c?{cursor:c}:{})});
  const profiles=(await Promise.all(page.objects.map(async o=>{const id=o.key.split('/').at(-1).replace('.json','');if(!uuid.test(id))return null;const p=await sharedProfile(id);return p?{...profileView(p),avatarUrl:p.avatarKey?'/api/team/ally-profiles/'+p.id+'/avatar?v='+p.revision:null}:null;}))).filter(Boolean);
  return json({profiles,cursor:page.truncated?page.cursor:null});
 }
 if(path==='/api/service-requests'&&request.method==='POST'){
  const body=await input();if(!uuid.test(body.id))error(400,'Referencia de solicitud inválida.');
  const key=prefix+'service-requests/'+body.id+'.json',indexKey='service-request-index/'+body.id+'.json',index=await read(indexKey);
  if(index&&index.record.recordKey!==key)error(409,'La referencia ya existe. Inicia otra solicitud.');
  const existing=await read(key);if(existing){if(!index)await bucket.put(indexKey,JSON.stringify({recordKey:key}),metadata);return json(ownerServiceRequest(existing.record));}
  let values;try{values=normalizeServiceRequest(body,request.headers.get('oai-authenticated-user-email'));}catch(e){error(400,e.message);}
  if(!index&&await bucket.put(indexKey,JSON.stringify({recordKey:key}),{...metadata,onlyIf:{etagDoesNotMatch:'*'}})===null){const current=await read(indexKey);if(current?.record.recordKey!==key)error(409,'La referencia ya existe. Inicia otra solicitud.');}
  const at=now(),record={...values,id:body.id,reference:'SOL-'+body.id.slice(0,8).toUpperCase(),status:'received',revision:0,createdAt:at,updatedAt:at,assignee:'',owner:{email:request.headers.get('oai-authenticated-user-email')||null},history:[{at,status:'received',message:'Solicitud recibida para revisión del equipo.'}],internalNotes:[]};
  if(await bucket.put(key,JSON.stringify(record),{...metadata,onlyIf:{etagDoesNotMatch:'*'}})===null)return json(ownerServiceRequest((await read(key)).record));
  return json(ownerServiceRequest(record),201);
 }
 if(path==='/api/service-requests'&&request.method==='GET'){
  const c=cursor(),page=await bucket.list({prefix:prefix+'service-requests/',limit:30,...(c?{cursor:c}:{})}),rows=await Promise.all(page.objects.map(async o=>{const s=await read(o.key);return s?ownerServiceRequest(s.record):null;}));
  return json({requests:rows.filter(Boolean),cursor:page.truncated?page.cursor:null});
 }
 const own=path.match(/^\/api\/service-requests\/([\w-]+)(\/reply)?$/);
 if(own){if(!uuid.test(own[1]))error(404,'Solicitud no encontrada.');const key=prefix+'service-requests/'+own[1]+'.json',stored=await read(key);if(!stored)error(404,'Solicitud no encontrada.');
  if(!own[2]&&request.method==='GET')return json(ownerServiceRequest(stored.record));
  if(own[2]&&request.method==='POST'){const data=await input(),message=text(data.message,2000);if(!message)error(400,'Escribe una respuesta para el equipo.');if(stored.record.status==='closed')error(400,'Esta solicitud está cerrada. Puedes crear una nueva.');if(stored.record.status==='needs_information')stored.record.status='in_review';stored.record.history.push({at:now(),status:stored.record.status,message});return json(ownerServiceRequest(await update(stored,key,data)));}
  error(405,'Método no permitido.');
 }
 if(path==='/api/team/service-requests'&&request.method==='GET'){
  team();const c=cursor(),page=await bucket.list({prefix:'service-request-index/',limit:30,...(c?{cursor:c}:{})});
  const rows=(await Promise.all(page.objects.map(async o=>{const id=o.key.split('/').at(-1).replace('.json','');if(!uuid.test(id))return null;try{return (await teamRequest(id)).record;}catch{return null;}}))).filter(Boolean);
  return json({requests:rows,cursor:page.truncated?page.cursor:null});
 }
 const manage=path.match(/^\/api\/team\/service-requests\/([\w-]+)$/);
 if(manage){team();const stored=await teamRequest(manage[1]);if(request.method==='GET')return json(stored.record);
  if(request.method!=='PATCH')error(405,'Método no permitido.');const data=await input(),r=stored.record,status=data.status||r.status;
  if(!serviceStates[status]||(status!==r.status&&!serviceTransitions[r.status]?.includes(status)))error(400,'El cambio de estado no está permitido.');
  const message=text(data.message,2000),note=text(data.internalNote,2000),oldStatus=r.status;
  if(status!==r.status&&['needs_information','connected','closed'].includes(status)&&!message)error(400,'Explica el cambio en un mensaje para el solicitante.');
  if(data.assignee!==undefined)r.assignee=text(data.assignee,100);r.status=status;
  if(message||status!==oldStatus)r.history.push({at:now(),status,message:message||'El equipo actualizó el seguimiento de la solicitud.',actor});
  if(note)r.internalNotes.push({at:now(),message:note,actor});
  return json(await update(stored,stored.key,data));
 }
 return null;
}
