import {normalizeLandVisibility} from '../web/land-visibility.js';
import {normalizeLocationPin} from '../web/terrain-location.js';
import {landUses} from '../web/development-sectors.js';
import {notificationApi} from './notifications.js';
import {opportunityApi} from './opportunity-experience.js';
import {salesApi} from './sales.js';
import {serviceRequestsApi} from './service-requests.js';
import {normalizeBrokerExclusivity} from '../web/broker-exclusivity.js';
import {normalizeLandSituation} from '../web/land-situation-model.js';
import {landScopeExclusion} from '../web/land-scope.js';
import {profilesApi,attachProfile} from './profiles.js';
import {resolveLocation} from '../web/colombia-locations.js';
import { parseGeospatial, describeGeometry, MAX_FILE_BYTES } from '../lib/parcel.js';
import { reviewApi, teamRole, initialWorkflow, ownerRecord } from './review.js';
const DAY=86400000, MAX_BODY=MAX_FILE_BYTES+65536;
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
class ApiError extends Error {constructor(status,message){super(message);this.status=status;}}
const error=(status,message)=>{throw new ApiError(status,message);};
async function bodyBytes(request,limit) {
  if(Number(request.headers.get('content-length'))>limit) error(413,'El archivo supera el tamaño permitido.');
  if(!request.body) return new Uint8Array();
  const reader=request.body.getReader(),chunks=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();error(413,'La carga supera 10 MB por archivo. Utiliza un enlace de descarga.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}return bytes;
}
const text=(value,max=150)=>typeof value==='string'?value.trim().slice(0,max):'';
async function ownerPrefix(request) {
  const id=request.headers.get('oai-authenticated-user-id');
  if(!id) error(401,'Inicia sesión para guardar tu expediente y sus documentos privados.');
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));
  return 'users/'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')+'/';
}
async function getJson(bucket,key){const obj=await bucket.get(key);return obj?obj.json():null;}
function safeName(name) {return text(name,160).replace(/[\u0000-\u001f\u007f/\\]/g,'_')||'documento';}
function httpsLink(value) {try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.href.length>2048)throw Error();return u.href;}catch{error(400,'Utiliza un enlace HTTPS sin credenciales en la dirección.');}}
function signature(bytes,extension) {
  const start=new TextDecoder().decode(bytes.subarray(0,80));
  if(extension==='pdf'&&!start.startsWith('%PDF-')) error(415,'El contenido no corresponde a un PDF.');
  if(['kmz','zip'].includes(extension)&&!(bytes[0]===80&&bytes[1]===75)) error(415,'El contenido no corresponde a un archivo ZIP/KMZ.');
  if(extension==='png'&&!(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)) error(415,'La imagen PNG no es válida.');
  if(['jpg','jpeg'].includes(extension)&&!(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)) error(415,'La imagen JPG no es válida.');
  if(extension==='dwg'&&!/^AC10\d\d/.test(start)) error(415,'El archivo DWG no es válido.');
}
async function documentMeta(bucket,prefix,id,now) {
  if(!uuid.test(id)) error(404,'Documento no encontrado.');
  const key=prefix+'documents/'+id+'/',meta=await getJson(bucket,key+'meta.json');
  if(!meta) error(404,'Documento no encontrado.');
  if(Date.parse(meta.expiresAt)<=now) {await bucket.delete([key+'content',key+'meta.json']);error(410,'El documento temporal venció después de 60 días.');}
  return meta;
}
// Access expires at the exact deadline. Physical cleanup is bounded and runs on activity.
export async function purgeExpired(bucket,now=Date.now(),cursor) {
  const listed=await bucket.list({prefix:'users/',limit:100,include:['customMetadata'],...(cursor?{cursor}:{})});
  const keys=listed.objects.filter(o=>o.customMetadata?.expiresAt&&Date.parse(o.customMetadata.expiresAt)<=now).map(o=>o.key);
  if(keys.length) await bucket.delete(keys);
  return {deleted:keys.length,cursor:listed.truncated?listed.cursor:null};
}
const allowedFields=['land_content','intended_use','valuation_assistance','title','city','region','department_code','municipality_code','neighborhood','land_type','project_land_confirmed','area','relationship','description','negotiation','price_method','amount','amount_usd','negotiable','receive_currencies','rate_method','exchange_rate','compensation','payment_schedule','payment_months','unit_type','unit_count','unit_area','unit_months','cash_percent','stage','land_status','need','participation','desired_min','desired_max','desired_zone','need_description','reactivation'];
export async function handleApi(request,env,ctx={waitUntil:()=>{}}) {
  const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return null;
  try {
    const publicRead=request.method==='GET'&&/^\/api\/catalog(?:\/[\w-]+(?:\/photos\/[\w-]+)?)?$/.test(url.pathname);
    const prefix=publicRead?null:await ownerPrefix(request),bucket=env.BUCKET;
    if(!bucket) error(503,'El almacenamiento privado todavía no está disponible. No se guardó el archivo.');
    if(publicRead){
      const context={bucket,prefix:null,json,error,bodyBytes,text,documentMeta,uuid,role:null};
      const result=url.pathname.includes('/photos/')?await opportunityApi(request,env,context):await reviewApi(request,env,context);
      if(result)return result;
      error(404,'Publicación no disponible.');
    }
    if(!['GET','HEAD'].includes(request.method)) {
      if(request.headers.get('origin')!==url.origin) error(403,'La solicitud debe originarse en este portal.');
      if(request.headers.get('sec-fetch-site')==='cross-site') error(403,'Origen no autorizado.');
    }
    if(url.pathname==='/api/session'&&request.method==='GET') return json({authenticated:true,storage:true,teamRole:teamRole(request,env)});
    const notices=await notificationApi(request,env,{bucket,prefix,json,error,bodyBytes,role:teamRole(request,env)});if(notices)return notices;
    const salesResponse=await salesApi(request,env,{bucket,prefix,json,error,bodyBytes,text,uuid,teamRole:teamRole(request,env)});if(salesResponse)return salesResponse;
    const servicesResponse=await serviceRequestsApi(request,env,{bucket,prefix,json,error,bodyBytes,text,uuid,teamRole:teamRole(request,env)});if(servicesResponse)return servicesResponse;
    const profileResponse=await profilesApi(request,env,{bucket,prefix,json,error,bodyBytes,text,uuid,teamRole:teamRole(request,env)});if(profileResponse)return profileResponse;
    const experience=await opportunityApi(request,env,{bucket,prefix,json,error,bodyBytes,text,uuid,role:teamRole(request,env)});if(experience)return experience;
    const review=await reviewApi(request,env,{bucket,prefix,json,error,bodyBytes,text,documentMeta,uuid});if(review)return review;
    // Sweep older objects with a rotating cursor; failed cleanup never exposes expired content.
    ctx.waitUntil((async()=>{const state=await getJson(bucket,'system/expiry-cursor.json');const result=await purgeExpired(bucket,Date.now(),state?.cursor);await bucket.put('system/expiry-cursor.json',JSON.stringify({cursor:result.cursor}),{httpMetadata:{contentType:'application/json'}});})().catch(()=>{}));
    if(url.pathname==='/api/documents'&&request.method==='POST') {
      let meta,bytes;
      const now=new Date(),expiresAt=new Date(+now+60*DAY).toISOString(),id=crypto.randomUUID();
      if((request.headers.get('content-type')||'').includes('application/json')) {
        const data=JSON.parse(new TextDecoder().decode(await bodyBytes(request,8192)));
        const name=safeName(data.name); if(!text(data.name))error(400,'Escribe el nombre del documento.');
        meta={id,name,origin:'link',url:httpsLink(data.url),size:null,createdAt:now.toISOString(),expiresAt,analysis:{status:'pending_review',message:'Enlace guardado para revisión. No se descargó su contenido.'}};
      } else {
        if(!(request.headers.get('content-type')||'').startsWith('multipart/form-data'))error(415,'Selecciona un archivo.');
        bytes=await bodyBytes(request,MAX_BODY);
        const form=await new Response(bytes,{headers:{'content-type':request.headers.get('content-type')}}).formData();
        const file=form.get('file');if(!file||typeof file.arrayBuffer!=='function')error(400,'Falta el archivo.');
        if(file.size>MAX_FILE_BYTES)error(413,'El archivo supera 10 MB. Utiliza un enlace de descarga.');
        if(!file.size)error(400,'El archivo está vacío.');
        const name=safeName(file.name),extension=name.split('.').at(-1).toLowerCase();
        if(!['pdf','kml','kmz','geojson','json','zip','jpg','jpeg','png','dwg','dxf'].includes(extension))error(415,'Formato de archivo no admitido.');
        bytes=new Uint8Array(await file.arrayBuffer());signature(bytes,extension);
        let analysis={status:'pending_review',message:'Soporte almacenado. Pendiente de lectura y revisión del equipo.'};
        if(['kml','kmz','geojson','json'].includes(extension)) {
          try {analysis={status:'geometry_read',...await parseGeospatial(bytes,name),message:'Perímetros interpretados. Confirma cuál corresponde al lote.'};}
          catch(e){analysis={status:'needs_review',message:String(e.message).slice(0,300)};}
        }
        meta={id,name,size:file.size,origin:'file',extension,createdAt:now.toISOString(),expiresAt,analysis};
      }
      const key=prefix+'documents/'+id+'/';
      if(bytes) await bucket.put(key+'content',bytes,{httpMetadata:{contentType:'application/octet-stream'},customMetadata:{expiresAt}});
      try{await bucket.put(key+'meta.json',JSON.stringify(meta),{httpMetadata:{contentType:'application/json'},customMetadata:{expiresAt}});}catch(e){if(bytes)await bucket.delete(key+'content');throw e;}
      return json(meta,201);
    }
    const docMatch=url.pathname.match(/^\/api\/documents\/([\w-]+)(\/download)?$/);
    if(docMatch) {
      const meta=await documentMeta(bucket,prefix,docMatch[1],Date.now());
      if(request.method==='DELETE') {await bucket.delete([prefix+'documents/'+meta.id+'/content',prefix+'documents/'+meta.id+'/meta.json']);return json({deleted:true});}
      if(request.method!=='GET')error(405,'Método no permitido.');
      if(docMatch[2]) {
        if(meta.origin==='link')return json({url:meta.url});
        const object=await bucket.get(prefix+'documents/'+meta.id+'/content');if(!object)error(404,'El archivo ya no está disponible.');
        return new Response(object.body,{headers:{'content-type':'application/octet-stream','content-disposition':`attachment; filename*=UTF-8''${encodeURIComponent(meta.name)}`,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
      }
      return json(meta);
    }
    if(url.pathname==='/api/records'&&request.method==='POST') {
      const data=JSON.parse(new TextDecoder().decode(await bodyBytes(request,262144)));
      if(!uuid.test(data.id)||!['terreno','proyecto'].includes(data.kind))error(400,'Registro inválido.');
      const form={};for(const field of allowedFields){const v=data.form?.[field];if(typeof v==='string')form[field]=text(v,field.includes('description')?3000:200);else if(typeof v==='boolean')form[field]=v;else if(field==='receive_currencies'&&Array.isArray(v))form[field]=v.filter(x=>['COP','USD'].includes(x));}
      if(data.form?.land_content!=null&&!['land-only','land-project'].includes(data.form.land_content))error(400,'Selecciona si ofreces solo terreno o terreno con proyecto.');
      if(data.kind!=='terreno')delete form.land_content;
      if(data.kind==='terreno'){try{form.visibility=normalizeLandVisibility(data.form?.visibility);}catch(e){error(400,e.message);}}
      if(form.intended_use&&!landUses.some(([key])=>key===form.intended_use))error(400,'Selecciona un uso a evaluar válido.');
      if(data.form?.valuation_assistance!=null&&typeof data.form.valuation_assistance!=='boolean')error(400,'La solicitud de asesoría premium no es válida.');
      if(data.kind==='terreno'){try{const exclusivity=normalizeBrokerExclusivity(form.relationship,data.form?.broker_exclusivity);if(exclusivity)form.broker_exclusivity=exclusivity;}catch(e){error(400,e.message);}}
      if(!form.title||!form.relationship)error(400,'Completa la información básica del expediente.');
      const location=resolveLocation(form);
      if(!location)error(400,'Selecciona un departamento y un municipio válido de Colombia.');
      Object.assign(form,location);
      if(form.neighborhood)form.neighborhood=text(form.neighborhood,120);
      let parcel=null,locationPin=null;
      if(data.kind==='terreno') {
        if(form.project_land_confirmed!==true)error(400,landScopeExclusion+' Confirma que presentas el terreno para desarrollar un proyecto.');
        if(data.locationMode!=null&&!['pin','polygon'].includes(data.locationMode))error(400,'Elige pin o polígono para ubicar el terreno.');
        if(data.locationMode==='pin'){
          if(data.parcel!=null)error(400,'Envía solo la opción de ubicación elegida.');
          try{locationPin={...normalizeLocationPin(data.locationPin),confirmedAt:new Date().toISOString()};}catch(e){error(400,e.message);}
          if(!(Number(form.area)>0&&Number.isFinite(Number(form.area))))error(400,'Indica el área declarada; el pin no permite calcularla.');
        }else{
          if(!data.parcel?.confirmed)error(400,'Confirma el perímetro antes de enviar el terreno.');
          parcel={...describeGeometry(data.parcel.geometry),source:text(data.parcel.source,160),confirmed:true,confirmedAt:new Date().toISOString()};
        }
      }
      if(!Array.isArray(data.documentIds)||data.documentIds.length>20)error(400,'Puedes vincular hasta 20 documentos.');
      if(data.kind==='terreno'&&data.form?.land_situation!=null){try{form.land_situation=normalizeLandSituation(data.form.land_situation,{documentIds:data.documentIds});}catch(e){error(400,e.message);}}
      const files=[];for(const id of [...new Set(data.documentIds)]){const m=await documentMeta(bucket,prefix,id,Date.now());files.push({id:m.id,name:m.name,size:m.size,origin:m.origin,createdAt:m.createdAt,expiresAt:m.expiresAt,analysis:{status:m.analysis.status,message:m.analysis.message}});}
      const key=prefix+'records/'+data.id+'.json',existing=await getJson(bucket,key);if(existing)return json(ownerRecord(existing));
      const record={id:data.id,reference:(data.kind==='terreno'?'TER-':'PRO-')+data.id.slice(0,8).toUpperCase(),kind:data.kind,form,parcel,...(locationPin?{locationPin}:{}),files,status:'received',createdAt:new Date().toISOString(),...initialWorkflow(request)};
      await attachProfile(record,bucket,prefix,'Titular del proyecto');
      await bucket.put(key,JSON.stringify(record),{httpMetadata:{contentType:'application/json'}});
      return json(ownerRecord(record),201);
    }
    if(url.pathname==='/api/records'&&request.method==='GET') {
      const cursor=url.searchParams.get('cursor');if(cursor&&cursor.length>2048)error(400,'Página inválida.');
      const list=await bucket.list({prefix:prefix+'records/',limit:30,...(cursor?{cursor}:{})});
      const records=await Promise.all(list.objects.map(o=>getJson(bucket,o.key)));
      return json({records:records.filter(Boolean).map(ownerRecord),cursor:list.truncated?list.cursor:null});
    }
    const recordMatch=url.pathname.match(/^\/api\/records\/([\w-]+)$/);
    if(recordMatch&&request.method==='GET') {
      if(!uuid.test(recordMatch[1]))error(404,'Registro no encontrado.');
      const record=await getJson(bucket,prefix+'records/'+recordMatch[1]+'.json');if(!record)error(404,'Registro no encontrado.');return json(ownerRecord(record));
    }
    return json({error:'Ruta no disponible.'},404);
  }catch(e){return json({error:e instanceof ApiError?e.message:e instanceof SyntaxError?'El contenido enviado no es válido.':e.message?.includes('perímetro')||e.message?.includes('coordenadas')||e.message?.includes('polígono')?e.message:'No se pudo completar la operación. Conservamos tu borrador para que puedas reintentar.'},e.status||400);}
}
