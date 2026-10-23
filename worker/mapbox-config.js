import {MAPBOX_VERSION,MAPBOX_STYLES} from '../web/mapbox-config.js';

// This endpoint exposes only a browser-safe pk token; server secrets never belong here.
export function mapboxConfigResponse(request,env={}){
 if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});
 const value=env.MAPBOX_PUBLIC_TOKEN;
 const token=typeof value==='string'&&/^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)?value:'';
 const source=`export const MAPBOX_TOKEN=${JSON.stringify(token)};\nexport const MAPBOX_VERSION=${JSON.stringify(MAPBOX_VERSION)};\nexport const MAPBOX_STYLES=${JSON.stringify(MAPBOX_STYLES)};\n`;
 return new Response(request.method==='HEAD'?null:source,{headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'}});
}
