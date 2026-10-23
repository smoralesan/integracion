import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {LocalBucket} from './local-bucket.mjs';
const localMapbox=await readFile(resolve('.local-data/mapbox-public.json'),'utf8').then(JSON.parse).catch(()=>({}));
const worker=(await import(pathToFileURL(resolve('dist/server/index.js')))).default;
const port=Number(process.env.PORT||4174),bucket=new LocalBucket(resolve(process.env.II_PREVIEW_DATA_DIRECTORY||'.local-data/r2'));
const server=createServer(async(req,res)=>{
  try{
    const url='http://127.0.0.1:'+port+req.url,headers=new Headers();
    for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
    headers.set('oai-authenticated-user-id','loopback-preview-owner');
    headers.set('oai-authenticated-user-email','owner@example.test');
    const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
    const response=await worker.fetch(request,{BUCKET:bucket,MAPBOX_PUBLIC_TOKEN:process.env.MAPBOX_PUBLIC_TOKEN||localMapbox.token||'',II_TEAM_ROLES:JSON.stringify({'owner@example.test':'admin'})},{waitUntil:p=>p.catch(()=>{})});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    if(response.body){for await(const chunk of response.body)res.write(chunk);}res.end();
  }catch(e){console.error(e.message);res.writeHead(500);res.end('Error de vista local');}
});
server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port+' (cuenta de prueba local)'));
