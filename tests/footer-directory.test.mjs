import test from 'node:test';
import assert from 'node:assert/strict';
import {departments,cities,landTypes,readDirectoryScope,matchesDirectory,footerDirectoryHTML} from '../web/footer-directory.js';
test('directory covers 32 distinct departments and round-trips every shortcut',()=>{
 assert.equal(departments.length,32);assert.equal(new Set(departments).size,32);
 for(const city of cities)assert.equal(readDirectoryScope('#/oportunidades?tipo=terreno&ciudad='+encodeURIComponent(city)).city,city);
 for(const department of departments)assert.equal(readDirectoryScope('#/oportunidades?tipo=terreno&departamento='+encodeURIComponent(department)).department,department);
 for(const [key,,value] of landTypes)assert.equal(readDirectoryScope('#/oportunidades?tipo=terreno&lote='+key).landType,value);
 assert.equal(footerDirectoryHTML().match(/departamento=/g).length,32);
});
test('department shortcuts distinguish Santander from Norte de Santander',()=>{
 const scope=readDirectoryScope('#/oportunidades?tipo=terreno&departamento=Santander');
 assert.equal(matchesDirectory({type:'terreno',region:'Santander'},scope),true);
 assert.equal(matchesDirectory({type:'terreno',region:'Norte de Santander'},scope),false);
 assert.equal(matchesDirectory({type:'proyecto',region:'Santander'},scope),false);
});
test('city matching accepts accents and Bogotá district notation',()=>{
 const scope=readDirectoryScope('#/oportunidades?tipo=terreno&ciudad=Bogot%C3%A1');
 assert.equal(matchesDirectory({kind:'terreno',city:'Bogotá D.C.'},scope),true);
 assert.equal(matchesDirectory({kind:'terreno',city:'Bogotá',region:'Bogotá D.C.'},scope),true);
 assert.equal(matchesDirectory({kind:'terreno',city:'Soacha',region:'Cundinamarca'},scope),false);
});
test('lot classification uses declared fields and does not infer permitted use',()=>{
 const scope=readDirectoryScope('#/oportunidades?tipo=terreno&lote=urbano');
 assert.equal(matchesDirectory({kind:'terreno',land_type:'Urbano'},scope),true);
 assert.equal(matchesDirectory({type:'terreno',label:'Terreno urbano'},scope),true);
 assert.equal(matchesDirectory({type:'terreno',label:'Terreno para desarrollo',description:'Desarrollo urbano'},scope),false);
 assert.equal(matchesDirectory({kind:'proyecto',land_type:'Urbano'},scope),false);
});
