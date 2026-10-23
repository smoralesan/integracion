import {properties} from '../web/opportunity-examples.js';
import {publicSummary,statusOf} from '../web/workflow-model.js';
import {salesStates,salesTransitions,advancedSalesStates,terminalSale,normalizeBuyer,validateContact,normalizeVisit,normalizeProposal} from '../web/sales-model.js';
export async function salesApi(request,env,context){
 const {bucket,prefix,json,error,bodyBytes,text,uuid,teamRole}=context,url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/purchase-leads')&&!path.startsWith('/api/team/purchase-leads')&&!path.startsWith('/api/received-leads'))return null;
 const metadata={httpMetadata:{contentType:'application/json'}},now=()=>new Date().toISOString(),actor=request.headers.get('oai-authenticated-user-email')||'Equipo';
 const read=async key=>{const obj=await bucket.get(key);return obj?{record:await obj.json(),etag:obj.etag}:null;};
 const input=async()=>JSON.parse(new TextDecoder().decode(await bodyBytes(request,20000)));
 const keyPattern=/^users\/[0-9a-f]{64}\/purchase-leads\/[0-9a-f-]{36}\.json$/;
 const recordPattern=/^users\/[0-9a-f]{64}\/records\/[0-9a-f-]{36}\.json$/;
 const authorizeTeam=()=>{if(!teamRole)error(403,'Gestión reservada al equipo autorizado.');};
 async function source(kind,id){
  if(kind==='demo'){const p=properties.find(p=>p.id===id);if(!p)error(404,'Ejemplo no encontrado.');return {source:{kind,id,snapshot:{id:p.id,reference:p.id,title:p.title,city:p.city,region:p.region,kind:p.type}},targetRecordKey:null};}
  if(kind!=='publication'||!uuid.test(id))error(404,'Publicación no disponible.');
  const pointer=(await read('catalog/'+id+'.json'))?.record;if(!pointer||pointer.id!==id||!recordPattern.test(pointer.recordKey))error(404,'Publicación no disponible.');
  const target=(await read(pointer.recordKey))?.record;if(!target||statusOf(target)!=='published'||!target.publicationConsent?.authorized||target.publicationId!==id)error(404,'La publicación ya no está disponible para nuevas solicitudes.');
  if(target.availability==='withdrawn')error(409,'El titular retiró esta oportunidad. No se reciben nuevos intereses.');
  const summary=publicSummary(target),snapshot={};for(const field of ['id','reference','kind','title','city','region','area','negotiation','price_method','amount','amount_usd'])if(summary[field]!==undefined)snapshot[field]=summary[field];
  return {source:{kind,id,snapshot},targetRecordKey:pointer.recordKey};
 }
 async function storedByIndex(id,owner=false){if(!uuid.test(id))error(404,'Interés no encontrado.');const index=(await read((owner?prefix+'received-leads/':'purchase-lead-index/')+id+'.json'))?.record;if(!index||!keyPattern.test(index.leadKey))error(404,'Interés no encontrado.');const result=await read(index.leadKey);if(!result)error(404,'Interés no encontrado.');if(owner&&(!result.record.targetRecordKey?.startsWith(prefix+'records/')))error(404,'Interés no encontrado.');return {...result,key:index.leadKey};}
 async function view(r,audience){
  const target=r.targetRecordKey?(await read(r.targetRecordKey))?.record:null,granted=r.authorization.state==='granted'&&!!target;
  const common={id:r.id,reference:r.reference,source:r.source,status:r.status,assignee:r.assignee,revision:r.revision,createdAt:r.createdAt,updatedAt:r.updatedAt,authorization:{state:r.authorization.state,at:r.authorization.at||null},history:r.history.map(({actor,...h})=>audience==='seller'&&!granted?{at:h.at,status:h.status,message:h.type==='authorization'?h.message:'El equipo actualizó el seguimiento.'}:h),visit:granted||audience==='team'||r.source.kind==='demo'?r.visit:null,proposal:granted||audience==='team'||r.source.kind==='demo'?r.proposal:null};
  if(audience==='team')return {...common,buyer:r.buyer,internalNotes:r.internalNotes,sellerContact:granted?r.authorization.contact:null,targetTeamKey:r.targetRecordKey?r.targetRecordKey.split('/')[1]+':'+target?.id:null};
  if(audience==='seller')return {...common,recordId:target?.id,buyer:granted?r.buyer:{role:r.buyer.role,intent:r.buyer.intent},sellerContact:granted?r.authorization.contact:null,ownContactEmail:target?.owner?.email||''};
  return {...common,buyer:r.buyer,sellerContact:granted?r.authorization.contact:null};
 }
 function event(r,message,type='update'){r.history.push({at:now(),status:r.status,message,actor,type});}
 async function save(stored,key,data){if(data.revision!==stored.record.revision)error(409,'El seguimiento cambió. Actualiza antes de guardar.');stored.record.revision++;stored.record.updatedAt=now();if(await bucket.put(key,JSON.stringify(stored.record),{...metadata,onlyIf:{etagMatches:stored.etag}})===null)error(409,'Otra sesión modificó este interés. Recarga para continuar.');return stored.record;}
 const sourceMatch=path.match(/^\/api\/purchase-leads\/source\/(publication|demo)\/([\w-]+)$/);
 if(sourceMatch&&request.method==='GET'){const s=await source(sourceMatch[1],sourceMatch[2]);return json({source:s.source,isOwn:!!s.targetRecordKey?.startsWith(prefix+'records/')});}
 if(path==='/api/purchase-leads'&&request.method==='POST'){
  const data=await input();if(!uuid.test(data.id))error(400,'Referencia de interés inválida.');
  const key=prefix+'purchase-leads/'+data.id+'.json',global='purchase-lead-index/'+data.id+'.json',index=(await read(global))?.record;
  if(index&&index.leadKey!==key)error(409,'La referencia ya existe. Inicia otra solicitud.');
  const existing=await read(key);if(existing){if(existing.record.targetRecordKey){const sellerPrefix=existing.record.targetRecordKey.split('records/')[0];await bucket.put(sellerPrefix+'received-leads/'+data.id+'.json',JSON.stringify({leadKey:key}),metadata);}return json(await view(existing.record,'buyer'));}
  const s=await source(data.sourceKind,data.sourceId);if(s.targetRecordKey?.startsWith(prefix+'records/'))error(400,'Esta publicación pertenece a tu cuenta. Consulta los interesados recibidos.');
  let buyer;try{buyer=normalizeBuyer(data,request.headers.get('oai-authenticated-user-email'));}catch(e){error(400,e.message);}
  if(s.source.kind==='demo'&&data.demoAcknowledged!==true)error(400,'Confirma que esta ficha es un ejemplo para probar el seguimiento.');
  if(!index&&await bucket.put(global,JSON.stringify({leadKey:key}),{...metadata,onlyIf:{etagDoesNotMatch:'*'}})===null){if((await read(global))?.record.leadKey!==key)error(409,'La referencia ya existe. Inicia otra solicitud.');}
  const at=now(),r={id:data.id,reference:'INT-'+data.id.slice(0,8).toUpperCase(),...s,buyer,authorization:{state:s.source.kind==='demo'?'demo':'pending'},status:'received',assignee:'',revision:0,createdAt:at,updatedAt:at,history:[{at,status:'received',type:'received',message:'Interés recibido para revisión comercial.'}],internalNotes:[],visit:null,proposal:null};
  if(await bucket.put(key,JSON.stringify(r),{...metadata,onlyIf:{etagDoesNotMatch:'*'}})===null)return json(await view((await read(key)).record,'buyer'));
  if(s.targetRecordKey)await bucket.put(s.targetRecordKey.split('records/')[0]+'received-leads/'+r.id+'.json',JSON.stringify({leadKey:key}),metadata);
  return json(await view(r,'buyer'),201);
 }
 const own=path.match(/^\/api\/purchase-leads\/([\w-]+)(\/reply)?$/);
 if(own){if(!uuid.test(own[1]))error(404,'Interés no encontrado.');const key=prefix+'purchase-leads/'+own[1]+'.json',stored=await read(key);if(!stored)error(404,'Interés no encontrado.');
  if(!own[2]&&request.method==='GET')return json(await view(stored.record,'buyer'));
  if(own[2]&&request.method==='POST'){const data=await input(),message=text(data.message,2000);if(!message||terminalSale(stored.record.status))error(400,'Escribe un mensaje en un seguimiento abierto.');event(stored.record,message,'buyer_reply');return json(await view(await save(stored,key,data),'buyer'));}error(405,'Método no permitido.');
 }
 const seller=path.match(/^\/api\/received-leads\/([\w-]+)(\/authorization)?$/);
 if(seller){const stored=await storedByIndex(seller[1],true),r=stored.record;
  if(!seller[2]&&request.method==='GET')return json(await view(r,'seller'));
  if(seller[2]&&request.method==='POST'){
   const data=await input();if(!['grant','decline','revoke'].includes(data.action))error(400,'Elige aceptar, rechazar o retirar la autorización.');
   if(data.action==='grant'){if(terminalSale(r.status))error(400,'Este seguimiento ya está cerrado.');let contact;try{contact=validateContact(data.contact);}catch(e){error(400,e.message);}if(data.confirm!==true)error(400,'Confirma que autorizas compartir estos datos para esta presentación.');r.authorization={state:'granted',at:now(),contact};event(r,'El titular del expediente autorizó la presentación y compartir sus datos de contacto.','authorization');}
   else if(data.action==='decline'){if(terminalSale(r.status))error(400,'Este seguimiento ya está cerrado.');r.authorization={state:'declined',at:now()};r.status='closed_lost';event(r,'El titular del expediente declinó la presentación.','authorization');}
   else {if(r.authorization.state!=='granted')error(400,'No hay una autorización vigente para retirar.');r.authorization={state:'revoked',at:now()};if(!terminalSale(r.status))r.status='awaiting_authorization';event(r,'El titular del expediente retiró la autorización de contacto.','authorization');}
   return json(await view(await save(stored,stored.key,data),'seller'));
  }error(405,'Método no permitido.');
 }
 if((path==='/api/purchase-leads'||path==='/api/received-leads'||path==='/api/team/purchase-leads')&&request.method==='GET'){
  const team=path.startsWith('/api/team/'),seller=path==='/api/received-leads';if(team)authorizeTeam();const c=url.searchParams.get('cursor');if(c&&c.length>2048)error(400,'Página inválida.');
  const page=await bucket.list({prefix:team?'purchase-lead-index/':prefix+(seller?'received-leads/':'purchase-leads/'),limit:30,...(c?{cursor:c}:{})});
  const rows=await Promise.all(page.objects.map(async o=>{const id=o.key.split('/').at(-1).replace('.json','');if(!uuid.test(id))return null;try{const s=team?await storedByIndex(id):seller?await storedByIndex(id,true):await read(o.key);return s?view(s.record,team?'team':seller?'seller':'buyer'):null;}catch(e){if(e.status===404)return null;throw e;}}));
  return json({leads:rows.filter(Boolean),cursor:page.truncated?page.cursor:null});
 }
 const manage=path.match(/^\/api\/team\/purchase-leads\/([\w-]+)$/);
 if(manage){authorizeTeam();const stored=await storedByIndex(manage[1]),r=stored.record;if(request.method==='GET')return json(await view(r,'team'));if(request.method!=='PATCH')error(405,'Método no permitido.');
  const data=await input(),next=data.status||r.status,old=r.status,message=text(data.message,2000),note=text(data.internalNote,2000);
  if(!Object.hasOwn(salesStates,next)||(next!==old&&!salesTransitions[old]?.includes(next)))error(400,'Este cambio de etapa no está permitido.');
  if((next!==old&&advancedSalesStates.includes(next))||data.proposal||data.visit){
   if(r.source.kind==='demo'){if(data.demoAcknowledged!==true)error(400,'Confirma que gestionas una ficha de ejemplo.');}
   else if(r.authorization.state!=='granted'||!r.targetRecordKey||(await read(r.targetRecordKey))===null)error(400,'El titular del expediente debe autorizar el contacto antes de avanzar.');
  }
  if(next!==old&&!message)error(400,'Explica el cambio en un mensaje de seguimiento.');
  if(data.assignee!==undefined)r.assignee=text(data.assignee,100);
  if(next==='visit_scheduled'){try{r.visit=normalizeVisit(data.visit||r.visit);}catch(e){error(400,e.message);}}
  if(data.proposal||next==='proposal'){try{r.proposal={...normalizeProposal(data.proposal||r.proposal),at:now()};}catch(e){error(400,e.message);}}
  r.status=next;if(message||next!==old)event(r,message||'El equipo actualizó el seguimiento.');if(note)r.internalNotes.push({at:now(),actor,message:note});
  return json(await view(await save(stored,stored.key,data),'team'));
 }
 return null;
}
