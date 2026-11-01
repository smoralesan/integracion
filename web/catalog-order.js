// Numeric comparisons use declared area and COP asking prices, never missing values as zero.
export const catalogOrders=[
 ['', 'Orden inicial'],
 ['area-asc','Área: menor a mayor'],['area-desc','Área: mayor a menor'],
 ['precio-asc','Precio (COP): menor a mayor'],['precio-desc','Precio (COP): mayor a menor'],
 ['m2-asc','Precio/m² (COP): menor a mayor'],['m2-desc','Precio/m² (COP): mayor a menor'],
];
export function normalizeCatalogOrder(value){return catalogOrders.some(([key])=>key===value)?value:'';}
const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0?value:null;
export function copAskingPrice(item){return (item.currency||item.price_currency||'COP')==='COP'?positive(item.price):null;}
export function pricePerM2(item){const price=copAskingPrice(item),area=positive(item.area);return price!==null&&area!==null?price/area:null;}
export function orderCatalog(items,order){
 const mode=normalizeCatalogOrder(order);if(!mode)return [...items];
 const metric=mode.startsWith('area-')?item=>positive(item.area):mode.startsWith('precio-')?copAskingPrice:pricePerM2,direction=mode.endsWith('-desc')?-1:1;
 return items.map((item,index)=>({item,index,value:metric(item)})).sort((a,b)=>a.value===null?(b.value===null?a.index-b.index:1):b.value===null?-1:direction*(a.value-b.value)||a.index-b.index).map(row=>row.item);
}
export function catalogOrderHash(hash,order){const [path,query='']=hash.split('?'),params=new URLSearchParams(query),mode=normalizeCatalogOrder(order);if(mode)params.set('orden',mode);else params.delete('orden');return path+(params.size?'?'+params:'');}
export function catalogOrderHTML(order,{disabled=false,project=false}={}){if(project)return '';const selected=normalizeCatalogOrder(order);return `<label class="cp-order"><span>Ordenar por</span><select name="catalogOrder" aria-label="Ordenar resultados" ${disabled?'disabled title="Termina o cancela el dibujo antes de ordenar"':''}>${(project?catalogOrders.filter(([key])=>key===''):catalogOrders).map(([key,label])=>`<option value="${key}" ${key===selected?'selected':''}>${label}</option>`).join('')}</select></label>`;}
