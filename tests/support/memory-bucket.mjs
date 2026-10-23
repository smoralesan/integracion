export class MemoryBucket {
  objects=new Map();counter=0;
  async put(key,value,options={}){
    if(options.onlyIf?.etagDoesNotMatch==='*'&&this.objects.has(key))return null;
    if(options.onlyIf?.etagMatches!==undefined&&this.objects.get(key)?.etag!==options.onlyIf.etagMatches)return null;
    const object={bytes:typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value),...options,etag:String(++this.counter)};this.objects.set(key,object);return {etag:object.etag};
  }
  async get(key){const o=this.objects.get(key);return o?{etag:o.etag,body:o.bytes,json:async()=>JSON.parse(new TextDecoder().decode(o.bytes))}:null;}
  async delete(keys){for(const k of Array.isArray(keys)?keys:[keys])this.objects.delete(k);}
  async list({prefix='',cursor='',limit=100}={}){const keys=[...this.objects.keys()].filter(k=>k.startsWith(prefix)&&k>cursor).sort(),truncated=keys.length>limit;return {objects:keys.slice(0,limit).map(key=>({key,customMetadata:this.objects.get(key).customMetadata})),truncated,cursor:truncated?keys[limit-1]:null};}
}
