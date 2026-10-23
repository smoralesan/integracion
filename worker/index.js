import {notifyMutation} from './notifications.js';
import { handleApi } from './api.js';
import {specialistRouteRedirect} from './site-routes.js';
import { assets } from 'site-assets';
import {mapboxConfigResponse} from './mapbox-config.js';
import {securityHeaders} from './security-headers.js';
export default {
  async fetch(request,env,ctx) {
    const result=await handleApi(request,env,ctx);if(result){if(result.ok&&['POST','PATCH'].includes(request.method))ctx.waitUntil(notifyMutation(request,result,env).catch(()=>{}));return result;}
    const url=new URL(request.url),redirect=specialistRouteRedirect(url);
    if(redirect){
      if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});
      return new Response(null,{status:302,headers:{location:redirect,'cache-control':'no-cache'}});
    }
    const path=url.pathname==='/'?'/index.html':url.pathname;
    if(path==='/mapbox-config.js')return mapboxConfigResponse(request,env);
    const asset=assets[path];if(!asset)return new Response('No encontrado',{status:404});
    if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});
    const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));
    return new Response(request.method==='HEAD'?null:bytes,{headers:{'content-type':asset.type,'cache-control':'no-cache',...securityHeaders}});
  }
};
