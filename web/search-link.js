const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
const parse=value=>{try{return JSON.parse(value);}catch{return null;}};
const positive=value=>/^(?:\d+)(?:\.\d{1,2})?$/.test(String(value||''))&&Number(value)>0&&Number(value)<=1e16?String(value):'';
export function readSearchLink(params){
 const ring=parse(params.get('poligono')),sectors=parse(params.get('sectores')),bounds=parse(params.get('limites'));
 const min=positive(params.get('area_min')),max=positive(params.get('area_max'));
 return {query:String(params.get('q')||'').trim().slice(0,160),mode:['Venta','Aporte','Alianzas'].includes(params.get('modalidad'))?params.get('modalidad'):'',min,max:max&&min&&Number(max)<Number(min)?'':max,maxPrice:positive(params.get('precio_max')),zone:Array.isArray(ring)&&ring.length>=3&&ring.length<=501&&ring.every(point)?ring:[],sectors:Array.isArray(sectors)&&sectors.length<=20?sectors.filter(x=>typeof x==='string'&&/^[a-z0-9-]{1,60}$/.test(x)):[],placeBounds:Array.isArray(bounds)&&bounds.length===4&&bounds.every(Number.isFinite)&&point(bounds.slice(0,2))&&point(bounds.slice(2))&&bounds[0]<bounds[2]&&bounds[1]<bounds[3]?bounds:null};
}
export function searchLinkHash(hash,state){
 const [path,query='']=hash.split('?'),params=new URLSearchParams(query);
 for(const [key,param]of [['query','q'],['mode','modalidad'],['min','area_min'],['max','area_max'],['maxPrice','precio_max']]){if(state[key])params.set(param,String(state[key]));else params.delete(param);}
 for(const [key,param]of [['zone','poligono'],['sectors','sectores'],['placeBounds','limites']]){if(state[key]?.length)params.set(param,JSON.stringify(state[key]));else params.delete(param);}
 for(const param of ['municipio','departamento_codigo','uso','ciudad','departamento','lote'])params.delete(param);
 if(state.type==='terreno'&&state.searchMunicipality)params.set('municipio',state.searchMunicipality);
 if(state.type==='terreno'&&state.searchDepartment)params.set('departamento_codigo',state.searchDepartment);
 if(state.type==='terreno'&&state.intendedUse)params.set('uso',state.intendedUse);
 if(state.directoryScope)for(const [key,param]of [['city','ciudad'],['department','departamento'],['landType','lote']])if(state.directoryScope[key])params.set(param,key==='landType'?({'Urbano':'urbano','Rural':'rural','Expansión urbana':'expansion'}[state.directoryScope[key]]||state.directoryScope[key]):state.directoryScope[key]);
 return path+(params.size?'?'+params:'');
}
export function savedSearchView(search){return search.view==='list'?'list':search.view==='both'?'both':'list';}
