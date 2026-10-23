import {toPolygon} from './geo.js';

// Geometrías creadas exclusivamente para las cuatro fichas de demostración.
// No proceden de catastro ni de expedientes privados; no acreditan área o linderos.
const demoRings={
 'TER-DEMO-001':[[-75.48745,10.52978],[-75.48715,10.52962],[-75.48670,10.52979],[-75.48664,10.53012],[-75.48694,10.53040],[-75.48739,10.53023]],
 'TER-DEMO-002':[[-74.95148,10.99164],[-74.95109,10.99149],[-74.95057,10.99170],[-74.95048,10.99216],[-74.95088,10.99245],[-74.95140,10.99227]],
 'TER-DEMO-003':[[-74.08030,4.64982],[-74.07994,4.64972],[-74.07967,4.64995],[-74.07979,4.65028],[-74.08021,4.65023]],
 'TER-DEMO-004':[[-74.19060,11.23962],[-74.19012,11.23940],[-74.18948,11.23970],[-74.18938,11.24015],[-74.18983,11.24054],[-74.19039,11.24039],[-74.19064,11.24003]]
};
export function demoTerrainGeometry(id){
 return Object.hasOwn(demoRings,id)?toPolygon(demoRings[id]):null;
}

// Una ficha urbana siempre inicia en satélite; la elección del catálogo es independiente.
export const terrainDefaultMapStyle=p=>p?.type==='terreno'&&p.land_type==='Urbano'?'satellite':'map';
