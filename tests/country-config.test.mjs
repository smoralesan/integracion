import test from 'node:test';
import assert from 'node:assert/strict';
import {activeMarket,countryProfile,operatingCountry,numberSeparators} from '../web/country-config.js';
import {areaEquivalences,areaEquivalencesHTML} from '../web/area-equivalences.js';
test('el país operativo es explícito y los países pendientes no toman prestada la configuración de Colombia',()=>{
 assert.equal(activeMarket.code,'CO');assert.equal(activeMarket.territory.source,'DIVIPOLA');assert.equal(activeMarket.landTerm,'lote');assert.equal(activeMarket.currency,'COP');
 assert.throws(()=>operatingCountry('PA'),/no está habilitado/);assert.throws(()=>countryProfile('XX'),/configuración local/);
 assert.deepEqual(activeMarket.territory,{region:'Departamento',municipality:'Municipio',neighborhood:'Barrio',source:'DIVIPOLA'});
 const panama=countryProfile('PA');assert.equal(panama.territory.region,'Provincia o comarca');assert.equal(panama.territory.municipality,'Distrito');assert.equal(panama.territory.neighborhood,'Corregimiento');assert.equal(panama.territory.source,null);
});
test('las unidades regionales se limitan al país que define sus equivalencias',()=>{
 const co=areaEquivalences('6400'),pa=areaEquivalences('6400',countryProfile('PA'));assert.equal(co.varas2,'10.000');assert.equal(co.fanegadas,'1');assert.equal(co.cuadras,'1');
 assert.deepEqual(Object.keys(pa),['ha','pies2']);assert.equal(pa.ha,'0.64');assert.equal(pa.pies2,'68,889.026667');assert.doesNotMatch(areaEquivalencesHTML('6400',countryProfile('PA')),/Fanegadas|Cuadras|Varas/);
});
test('los separadores dependen del mercado y la configuración no puede mutarse por una selección de interfaz',()=>{
 assert.deepEqual(numberSeparators(activeMarket),{decimal:',',group:'.'});assert.deepEqual(numberSeparators(countryProfile('PA')),{decimal:'.',group:','});
 assert.throws(()=>{activeMarket.areaEquivalents[0][2]=1;},TypeError);assert.equal(areaEquivalences('10000').ha,'1');
});
