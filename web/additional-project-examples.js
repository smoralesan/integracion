import {demoRescueWorkGallery} from './rescue-gallery.js';

// Casos ficticios. Importes inventados para comparar escenarios en la maqueta.
const millions=n=>n*1_000_000;
const finance=({sales,contracts,collected,debt,funds,progress,units,sold,debts,plan})=>({
 illustrative:true,asOf:'2026-10-22',projectedSales:millions(sales),effectiveSales:millions(contracts),collectedSales:millions(collected),totalDebt:millions(debt),requiredFunds:millions(funds),constructionProgress:progress,totalUnits:units,contractedUnits:sold,
 debtBreakdown:debts.map(([label,n])=>({label,amount:millions(n)})),
 fundingPlan:plan.map(([label,n])=>({label,amount:millions(n)}))
});
const gallery=order=>({illustrative:true,items:order.map(i=>({...demoRescueWorkGallery.items[i]}))});
export const additionalProjectExamples=[
 {
  id:'PRO-DEMO-005',type:'proyecto',label:'Proyecto mixto en planeación',land_status:'available',
  title:'Vivienda y comercio que buscan desarrollador',city:'Cali',region:'Valle del Cauca',
  area:null,mode:'Alianzas',price:null,image:'./assets/projects/edificio-mixto-referencia.jpg',coordinates:[-76.53,3.41],sector:'interior',
  description:'Caso ficticio de un edificio con 48 viviendas y comercio en primer piso, en planeación. El promotor busca un desarrollador y especialistas para evaluar el producto, los estudios, el presupuesto y la vinculación de aliados. La titularidad del terreno, los usos y los permisos están por revisar. No se ofrecen unidades ni se acredita una viabilidad aprobada.',
  need:'Desarrollador y arquitectos'
 },
 {
  id:'PRO-DEMO-006',type:'proyecto',label:'Residencial para reactivación',land_status:'available',reactivation:true,
  title:'Un edificio residencial por retomar',city:'Cali',region:'Valle del Cauca',
  area:null,mode:'Alianzas',price:null,image:'./assets/projects/edificio-residencial-referencia.jpg',coordinates:[-76.52,3.43],sector:'interior',
  description:'Proyecto residencial ficticio de 80 viviendas con un avance estimado del 58 %. La obra está en pausa y requiere revisar estructura, presupuesto pendiente, contratos y acuerdos con acreedores antes de proponer su continuidad. Las ventas efectivas representan contratos vigentes del ejemplo; el recaudo se presenta por separado. Todas las cifras y fotografías son ilustrativas.',
  need:'Constructor, interventor y financiador',workGallery:gallery([1,2,0]),
  rescueFinance:finance({sales:28000,contracts:19600,collected:8400,debt:6100,funds:4900,progress:58,units:80,sold:56,
   debts:[['Entidades financieras',3200],['Contratistas y proveedores',1900],['Impuestos y obligaciones',600],['Otras obligaciones',400]],
   plan:[['Continuidad de obra',3400],['Estudios y gestión técnica y jurídica',400],['Pagos previstos a acreedores',1100]]})
 },
 {
  id:'PRO-DEMO-007',type:'proyecto',label:'Oficinas para reactivación',land_status:'available',reactivation:true,
  title:'Oficinas que buscan una nueva ruta',city:'Bogotá',region:'Bogotá D.C.',
  area:null,mode:'Alianzas',price:null,image:'./assets/projects/edificio-oficinas-referencia.jpg',coordinates:[-74.08,4.67],sector:'interior',
  description:'Edificio de oficinas ficticio con 40 unidades comerciales y avance estimado del 35 %. Necesita un diagnóstico jurídico y financiero, una revisión de lo ejecutado y una evaluación de alternativas de comercialización. El plan de continuidad está sujeto a soportes, acuerdos y presupuesto por validar. Las cifras no corresponden a una oferta de inversión y las imágenes son referencias de la maqueta.',
  need:'Abogados, estructurador e inversionista',workGallery:gallery([2,0,1]),
  rescueFinance:finance({sales:45000,contracts:18000,collected:5400,debt:12500,funds:10800,progress:35,units:40,sold:16,
   debts:[['Entidades financieras',7500],['Contratistas y proveedores',3200],['Impuestos y obligaciones',1000],['Otras obligaciones',800]],
   plan:[['Continuidad de obra',7600],['Estudios y gestión técnica y jurídica',800],['Pagos previstos a acreedores',2400]]})
 },
 {
  id:'PRO-DEMO-008',type:'proyecto',label:'Apartahotel para reactivación',land_status:'available',reactivation:true,
  title:'Un apartahotel en pausa que busca continuidad',city:'Pereira',region:'Risaralda',
  area:null,mode:'Alianzas',price:null,image:'./assets/projects/hotel-cafetero-referencia.jpg',coordinates:[-75.70,4.82],sector:'interior',
  description:'Caso ficticio de un apartahotel de 60 suites, con avance estimado del 67 %, que busca un operador y aliados para evaluar su terminación y apertura. Las ventas efectivas corresponden a contratos vigentes de 24 suites del ejemplo; el recaudo se presenta por separado. La evaluación deberá estudiar licencias, dotación, costos pendientes y condiciones de operación. Cifras e imágenes exclusivamente ilustrativas.',
  need:'Operador hotelero y financiador',workGallery:gallery([0,2,1]),
  rescueFinance:finance({sales:24000,contracts:9600,collected:3200,debt:4800,funds:6200,progress:67,units:60,sold:24,
   debts:[['Entidades financieras',2600],['Contratistas y proveedores',1500],['Impuestos y obligaciones',400],['Otras obligaciones',300]],
   plan:[['Terminación y dotación',4400],['Estudios y gestión técnica y jurídica',500],['Pagos previstos a acreedores',1300]]})
 }
];
