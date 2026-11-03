const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const key=(item,field)=>field==='drafts'?item.form?.client_id||JSON.stringify(item):typeof item==='object'&&item!==null?item.id||JSON.stringify(item):String(item);
export function mergeBrowserStore(base,local,remote){
 const result={...remote};
 for(const field of ['favorites','searches','submissions','interests','drafts']){
  const b=new Map((base[field]||[]).map(x=>[key(x,field),x])),l=new Map((local[field]||[]).map(x=>[key(x,field),x])),r=new Map((remote[field]||[]).map(x=>[key(x,field),x]));
  for(const id of new Set([...b.keys(),...l.keys()])){const before=b.get(id),after=l.get(id),latest=r.get(id);if(same(before,after))continue;if(!same(before,latest)&&!same(after,latest))throw Error('Este registro cambió en otra pestaña. No se sobrescribió. Conserva tus datos y recarga para revisar la versión guardada.');if(l.has(id))r.set(id,after);else r.delete(id);}
  result[field]=[...r.values()];
 }
 if(!same(base.objective,local.objective))result.objective=local.objective;
 result.draft=result.drafts.find(d=>d.form?.client_id===local.draft?.form?.client_id)||result.drafts.at(-1)||null;
 return result;
}
