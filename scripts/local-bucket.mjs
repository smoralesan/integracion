// Filesystem R2 adapter for loopback preview only. Never bundled into the Worker.
import {mkdir,readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
export class LocalBucket {
  constructor(directory){this.directory=directory;}
  path(key){return join(this.directory,createHash('sha256').update(key).digest('hex'));}
  async put(key,value,options={}) {
    await mkdir(this.directory,{recursive:true});
    const bytes=typeof value==='string'?Buffer.from(value):Buffer.from(value);
    if(options.onlyIf?.etagMatches){const current=await this.get(key);if(current?.etag!==options.onlyIf.etagMatches)return null;}
    const path=this.path(key);await writeFile(path+'.bin',bytes);await writeFile(path+'.json',JSON.stringify({key,...options}));
    return {etag:createHash('sha256').update(bytes).digest('hex')};
  }
  async get(key){
    try{const bytes=await readFile(this.path(key)+'.bin');return {etag:createHash('sha256').update(bytes).digest('hex'),body:new Uint8Array(bytes),json:async()=>JSON.parse(bytes.toString()),arrayBuffer:async()=>new Uint8Array(bytes).buffer};}
    catch(e){if(e.code==='ENOENT')return null;throw e;}
  }
  async delete(keys){for(const key of Array.isArray(keys)?keys:[keys])for(const ext of ['.json','.bin'])await unlink(this.path(key)+ext).catch(e=>{if(e.code!=='ENOENT')throw e;});}
  async list({prefix='',limit=100,cursor='',include=[]}={}){
    const names=await readdir(this.directory).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
    const entries=(await Promise.all(names.filter(n=>n.endsWith('.json')).map(async name=>JSON.parse(await readFile(join(this.directory,name),'utf8'))))).filter(entry=>entry.key.startsWith(prefix)&&entry.key>cursor);
    entries.sort((a,b)=>a.key.localeCompare(b.key));const page=entries.slice(0,limit),truncated=entries.length>limit;
    return {objects:page.map(e=>({key:e.key,...(include.includes('customMetadata')?{customMetadata:e.customMetadata||{}}:{})})),truncated,cursor:truncated?page.at(-1).key:undefined};
  }
}
