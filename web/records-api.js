export async function api(path,options={}) {
  const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});
  const data=await response.json().catch(()=>({error:'No se pudo leer la respuesta del servidor.'}));
  if(!response.ok)throw new Error(data.error||'No fue posible completar la operación.');
  return data;
}
export function uploadDocument(file) {const body=new FormData();body.append('file',file);return api('/api/documents',{method:'POST',body});}
export function addDocumentLink(name,url) {return api('/api/documents',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,url})});}
export function saveRecord(data) {return api('/api/records',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});}
