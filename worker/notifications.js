const metadata={httpMetadata:{contentType:'application/json'}},emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
export const notificationsConfigured=env=>env.II_EMAIL_ENABLED==='true'&&!!env.BREVO_API_KEY&&emailPattern.test(env.BREVO_SENDER_EMAIL||'');
const read=async(bucket,key)=>{const o=await bucket.get(key);return o?{data:await o.json(),etag:o.etag}:null;};
export async function queueNotice(bucket,prefix,event){
 const id=await digest(event.eventId),key=prefix+'notifications/'+id+'.json';
 await bucket.put(key,JSON.stringify({id,eventId:event.eventId,kind:event.kind,reference:String(event.reference||'').slice(0,50),href:event.href,title:event.title||'Tu seguimiento tiene una actualización',createdAt:new Date().toISOString(),read:false,emailStatus:'pending',attempts:0}),{...metadata,onlyIf:{etagDoesNotMatch:'*'}});return key;
}
export async function deliverNotice(bucket,key,env,fetcher=fetch){
 const item=await read(bucket,key);if(!item||['sent','unknown','sending'].includes(item.data.emailStatus))return;
 const prefix=key.split('notifications/')[0],pref=(await read(bucket,prefix+'notification-settings.json'))?.data,n=item.data;
 if(!pref?.enabled){n.emailStatus='disabled';await bucket.put(key,JSON.stringify(n),{...metadata,onlyIf:{etagMatches:item.etag}});return;}
 if(!notificationsConfigured(env)){n.emailStatus='pending_configuration';await bucket.put(key,JSON.stringify(n),{...metadata,onlyIf:{etagMatches:item.etag}});return;}
 if(!emailPattern.test(pref.email||''))return;
 n.emailStatus='sending';n.attempts=(n.attempts||0)+1;
 const locked=await bucket.put(key,JSON.stringify(n),{...metadata,onlyIf:{etagMatches:item.etag}});if(locked===null)return;
 try{
  const response=await fetcher('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{accept:'application/json','content-type':'application/json','api-key':env.BREVO_API_KEY},body:JSON.stringify({sender:{name:'Integración Inmobiliaria',email:env.BREVO_SENDER_EMAIL},to:[{email:pref.email}],subject:'Actualización de seguimiento · '+n.reference,textContent:'Tienes una actualización en Integración Inmobiliaria. Referencia: '+n.reference+'. Ingresa al portal y consulta Mi espacio para revisar su estado. Por privacidad no incluimos mensajes, contactos ni documentos en este correo.',headers:{'X-Mailin-custom':'event:'+n.id},tags:['seguimiento-portal']}),signal:AbortSignal.timeout(10000)});
  if(response.ok){const data=await response.json().catch(()=>({}));n.emailStatus='sent';n.messageId=typeof data.messageId==='string'?data.messageId:null;n.sentAt=new Date().toISOString();}
  else {n.emailStatus=response.status===429?'retryable':response.status>=500?'unknown':'failed';n.failureCode='provider_'+response.status;}
 }catch{n.emailStatus='unknown';n.failureCode='delivery_unconfirmed';}
 // An uncertain provider response is not automatically resent: it could have been accepted.
 await bucket.put(key,JSON.stringify(n),{...metadata,onlyIf:{etagMatches:locked.etag}});
}
export async function notificationApi(request,env,c){
 const {bucket,prefix,json,error,bodyBytes,role}=c,path=new URL(request.url).pathname;
 if(!['/api/notifications','/api/notification-settings','/api/team/notifications'].includes(path))return null;
 if(path==='/api/notification-settings'){
  if(request.method==='GET'){const settings=(await read(bucket,prefix+'notification-settings.json'))?.data;return json({enabled:settings?.enabled===true,emailConfigured:notificationsConfigured(env),accountEmail:request.headers.get('oai-authenticated-user-email')||''});}
  if(request.method!=='POST')error(405,'Método no permitido.');const data=JSON.parse(new TextDecoder().decode(await bodyBytes(request,2000))),email=request.headers.get('oai-authenticated-user-email')||'';
  if(typeof data.enabled!=='boolean'||!emailPattern.test(email))error(400,'No hay un correo válido de cuenta para configurar los avisos.');
  await bucket.put(prefix+'notification-settings.json',JSON.stringify({enabled:data.enabled,email,updatedAt:new Date().toISOString()}),metadata);const subscriberKey='notification-subscribers/'+await digest(email.toLowerCase())+'.json';if(data.enabled)await bucket.put(subscriberKey,JSON.stringify({prefix}),metadata);else if((await read(bucket,subscriberKey))?.data?.prefix===prefix)await bucket.delete(subscriberKey);return json({enabled:data.enabled,emailConfigured:notificationsConfigured(env)});
 }
 if(path==='/api/team/notifications'){
  if(role!=='admin')error(403,'Solo administración puede consultar la configuración de envíos.');
  return json({configured:notificationsConfigured(env),senderConfigured:!!env.BREVO_SENDER_EMAIL,keyConfigured:!!env.BREVO_API_KEY,enabled:env.II_EMAIL_ENABLED==='true',teamEmailConfigured:emailPattern.test(env.BREVO_TEAM_EMAIL||'')});
 }
 if(request.method==='GET'){const cursor=new URL(request.url).searchParams.get('cursor');if(cursor?.length>2048)error(400,'Página inválida.');const page=await bucket.list({prefix:prefix+'notifications/',limit:30,...(cursor?{cursor}:{})}),rows=await Promise.all(page.objects.map(async o=>{const x=(await read(bucket,o.key))?.data;if(!x)return null;const {eventId,messageId,failureCode,...view}=x;return view;}));return json({notifications:rows.filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),cursor:page.truncated?page.cursor:null});}
 if(request.method==='POST'){
  const data=JSON.parse(new TextDecoder().decode(await bodyBytes(request,2000)));if(!/^[0-9a-f]{64}$/.test(data.id||''))error(404,'Aviso no encontrado.');const key=prefix+'notifications/'+data.id+'.json',item=await read(bucket,key);if(!item)error(404,'Aviso no encontrado.');item.data.read=true;await bucket.put(key,JSON.stringify(item.data),{...metadata,onlyIf:{etagMatches:item.etag}});return json({read:true});
 }
 error(405,'Método no permitido.');
}
// Runs only after a successful domain mutation; recipients derive from stored ownership, never request-provided email addresses.
export async function notifyMutation(request,response,env){
 if(!env.BUCKET||!['POST','PATCH'].includes(request.method)||!response.ok)return;
 const path=new URL(request.url).pathname;if(!/^\/api\/(records|team\/records|purchase-leads|team\/purchase-leads|received-leads|service-requests|team\/service-requests)(?:\/|$)/.test(path))return;
 if(/\/(photos|duplicates|report|profile|availability)$/.test(path))return;
 const data=await response.clone().json().catch(()=>null);if(!data?.id)return;
 const bucket=env.BUCKET,prefixes=new Map(),type=data.kind?'record':data.source?'lead':'service',part=type==='record'?'records/':type==='lead'?'purchase-leads/':'service-requests/';
 const auth=request.headers.get('oai-authenticated-user-id');if(!auth)return;
 const own='users/'+await digest(auth)+'/',team=path.startsWith('/api/team/');
 let recordKey;
 if(type==='record'){
  if(team){const raw=decodeURIComponent(path.split('/')[4]||''),m=raw.match(/^([0-9a-f]{64}):([0-9a-f-]{36})$/);if(m)recordKey='users/'+m[1]+'/records/'+m[2]+'.json';}
  else recordKey=own+part+data.id+'.json';
 }else{const index=(await read(bucket,(type==='lead'?'purchase-lead-index/':'service-request-index/')+data.id+'.json'))?.data;recordKey=index?.leadKey||index?.recordKey;}
 if(!recordKey||!/^users\/[0-9a-f]{64}\/(records|purchase-leads|service-requests)\/[0-9a-f-]{36}\.json$/.test(recordKey))return;
 const owner=recordKey.split(part)[0];prefixes.set(owner,'#/'+(type==='record'?'mi-expediente':type==='lead'?'mis-intereses':'mis-solicitudes')+'/'+data.id);
 if(type==='lead'){const lead=(await read(bucket,recordKey))?.data;if(lead?.targetRecordKey){const seller=lead.targetRecordKey.split('records/')[0];prefixes.set(seller,'#/interesados-recibidos/'+data.id);}}
 const eventId=type+':'+data.id+':'+(data.revision||0)+':'+path;
 for(const [prefix,href] of prefixes){const key=await queueNotice(bucket,prefix,{eventId,kind:type,reference:data.reference,href});await deliverNotice(bucket,key,env);}
 // Team notices use the verified configured team identity only; no public signup can subscribe someone else.
 const teamEmail=String(env.BREVO_TEAM_EMAIL||'').toLowerCase();let roles={};try{roles=JSON.parse(env.II_TEAM_ROLES||'{}');}catch{}
 if(emailPattern.test(teamEmail)&&roles[teamEmail]){const teamPrefix=(await read(bucket,'notification-subscribers/'+await digest(teamEmail)+'.json'))?.data?.prefix;if(/^users\/[0-9a-f]{64}\/$/.test(teamPrefix||'')){const key=await queueNotice(bucket,teamPrefix,{eventId:eventId+':team',kind:type,reference:data.reference,href:'#/'+(type==='record'?'equipo':type==='lead'?'equipo-comercial':'equipo-solicitudes')});await deliverNotice(bucket,key,env);}}
}
