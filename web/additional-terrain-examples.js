import {getMunicipality,getDepartment} from './colombia-locations.js';
// Synthetic locations, areas and prices for browsing and pagination tests only.
// None of these records represents an advertised property or a cadastral parcel.
const samples=[
 ['11001',[-74.117,4.711],5200,'Urbano','residencial','Venta',450000,'Sector ilustrativo 01'],
 ['05001',[-75.581,6.267],7200,'Urbano','mixto','Venta o aporte',520000,'Sector ilustrativo 02'],
 ['76001',[-76.522,3.411],9600,'Urbano','comercial','Venta',360000,'Sector ilustrativo 03'],
 ['68001',[-73.111,7.101],3800,'Urbano','residencial','Venta o aporte',410000,'Sector ilustrativo 04'],
 ['66001',[-75.721,4.795],18000,'Rural','hotelero','Aporte',null,'Sector ilustrativo 05'],
 ['17001',[-75.483,5.062],6800,'Urbano','residencial','Venta',320000,'Sector ilustrativo 06'],
 ['63001',[-75.681,4.559],14500,'Rural','hotelero','Venta o aporte',150000,'Sector ilustrativo 07'],
 ['05615',[-75.389,6.151],24000,'Expansión urbana','mixto','Venta o aporte',260000,'Sector ilustrativo 08'],
 ['76892',[-76.491,3.571],42000,'Rural','industrial','Venta',195000,'Sector ilustrativo 09'],
 ['25214',[-74.121,4.819],32000,'Expansión urbana','logistico','Venta',330000,'Sector ilustrativo 10'],
 ['25473',[-74.231,4.701],28000,'Urbano','logistico','Venta o aporte',310000,'Sector ilustrativo 11'],
 ['50001',[-73.652,4.122],36000,'Rural','mixto','Aporte',null,'Sector ilustrativo 12'],
 ['08001',[-74.827,10.979],12800,'Urbano','industrial','Venta',280000,'Sector ilustrativo 13'],
 ['73001',[-75.198,4.435],21500,'Expansión urbana','residencial','Venta o aporte',180000,'Sector ilustrativo 14']
];
const format=value=>new Intl.NumberFormat('es-CO').format(value);
export const additionalTerrainExamples=samples.map(([code,coordinates,area,land_type,intended_use,mode,unitPrice,neighborhood],index)=>{
 const municipality=getMunicipality(code),department=getDepartment(municipality.departmentCode),id='TER-DEMO-'+String(index+5).padStart(3,'0');
 return {id,type:'terreno',landContent:'land-only',department_code:department.code,municipality_code:municipality.code,city:municipality.name,region:department.name,coordinates,area,land_type,intended_use,mode,price:unitPrice?area*unitPrice:null,neighborhood,label:'Terreno '+land_type.toLocaleLowerCase('es'),title:'Terreno '+(land_type==='Expansión urbana'?'de expansión urbana':land_type.toLocaleLowerCase('es'))+' de '+format(area)+' m² en '+municipality.name,image:land_type==='Rural'?'./assets/terreno-rural.jpg':'./assets/desarrollo-urbano.jpg',sector:department.code==='08'?'caribe':'interior',description:'Terreno simulado para probar la búsqueda, los filtros y la paginación. La ubicación, el sector, el área y el precio son ilustrativos; no corresponde a un inmueble disponible. El uso propuesto requiere evaluación y no representa un permiso de desarrollo.',need:'Evaluación jurídica, técnica y de desarrollo'};
});
export function additionalTerrainRing(record){
 const outline=[[-.52,-.3],[-.13,-.5],[.48,-.24],[.53,.17],[.12,.47],[-.42,.33]];
 const unitArea=Math.abs(outline.reduce((sum,[x,y],i)=>{const next=outline[(i+1)%outline.length];return sum+x*next[1]-next[0]*y;},0))/2,scale=Math.sqrt(record.area/unitArea),[lng,lat]=record.coordinates;
 return outline.map(([x,y])=>[Number((lng+x*scale/(111320*Math.cos(lat*Math.PI/180))).toFixed(7)),Number((lat+y*scale/110574).toFixed(7))]);
}
