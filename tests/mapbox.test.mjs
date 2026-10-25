import test from "node:test";
import assert from "node:assert/strict";
import { LandMap, geocodeLocation } from "../web/mapbox-map.js";
import { locationBounds } from "../web/geo.js";

test('el perímetro de un lote se encuadra con detalle y separado de la búsqueda',()=>{
  const view=new LandMap();let fitted;
  view.options={context:'parcel',geometry:{type:'Polygon',coordinates:[[[-75.5,10.4],[-75.4993,10.4],[-75.4993,10.4006],[-75.5,10.4]]]},zone:[[-74,9],[-74.1,9]],items:[]};
  view.map={fitBounds:(bounds,options)=>{fitted={bounds,options};}};view.fitView();
  assert.deepEqual(fitted.bounds,[[-75.5,10.4],[-75.4993,10.4006]]);assert.equal(fitted.options.maxZoom,19);
});

const bbox = [-75.6, 10.3, -75.2, 10.7];
test("la extensión v6 del municipio tiene prioridad y se copia sin mutar el resultado", () => {
  const feature = {
    properties: { bbox },
    geometry: { type: "Point", coordinates: [-75.5, 10.5] },
  };
  const result = locationBounds(feature);
  assert.deepEqual(result, bbox);
  result[0] = 0;
  assert.equal(bbox[0], -75.6);
  assert.deepEqual(locationBounds({ bbox }), bbox);
  for (const value of [
    null,
    {},
    { bbox: [1, 2] },
    { bbox: [2, 1, 1, 2] },
    { bbox: [1, 1, 2, 100] },
  ])
    assert.equal(locationBounds(value), null);
});
test("encuadrar un municipio v6 utiliza sus límites completos", () => {
  const view = new LandMap();
  let fitted;
  view.map = {
    fitBounds: (bounds) => {
      fitted = bounds;
    },
    easeTo: () => assert.fail("No debe ignorar la extensión del municipio"),
  };
  view.locate({
    properties: { bbox },
    geometry: { coordinates: [-75.5, 10.5] },
  });
  assert.deepEqual(fitted, [
    [-75.6, 10.3],
    [-75.2, 10.7],
  ]);
});
test("ubicaciones sin extensión usan el centro; datos inválidos no mueven el mapa", () => {
  const view = new LandMap();
  const moves = [];
  view.map = {
    easeTo: (options) => moves.push(options),
    fitBounds: () => assert.fail("Sin límites válidos"),
  };
  view.locate({ geometry: { coordinates: [-75.5, 10.5] } });
  view.locate({ bbox: [0, 0, 0, 0], geometry: { coordinates: [1000, 1000] } });
  assert.equal(moves.length, 1);
  assert.deepEqual(moves[0].center, [-75.5, 10.5]);
});

test("la consulta de ubicación envía únicamente parámetros admitidos y no guarda resultados", async (t) => {
  const feature = {
    properties: { bbox },
    geometry: { coordinates: [-75.5, 10.5] },
  };
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input);
    assert.equal(url.searchParams.get("q"), "Cartagena");
    assert.equal(url.searchParams.get("country"), "co");
    assert.equal(url.searchParams.get("permanent"), "false");
    assert.deepEqual(
      [...url.searchParams.keys()].sort(),
      [
        "q",
        "access_token",
        "country",
        "language",
        "autocomplete",
        "limit",
        "types",
        "permanent",
      ].sort(),
    );
    return {
      ok: true,
      json: async () => ({
        features: [feature, { geometry: { coordinates: [1000, 1000] } }],
      }),
    };
  });
  assert.deepEqual(await geocodeLocation("Cartagena"), [feature]);
});

test('El detalle encuadra su polígono sin heredar el límite de zoom de búsqueda',()=>{
 const view=new LandMap();let fitted;
 const geometry={type:'Polygon',coordinates:[[[-75.5,10.4],[-75.4993,10.4],[-75.4993,10.4006],[-75.5,10.4]]]};
 view.options={context:'detail',geometry,zone:[],items:[]};
 view.map={fitBounds:(bounds,options)=>{fitted={bounds,options};}};
 view.fitView();assert.equal(fitted.options.maxZoom,19);
 assert.deepEqual(fitted.bounds,[[-75.5,10.4],[-75.4993,10.4006]]);
 view.options={context:'search',geometry:null,zone:geometry.coordinates[0],items:[]};
 view.fitView();assert.equal(fitted.options.maxZoom,14);
});

test('La vista del perímetro retira los marcadores y su popup para no tapar el lote',t=>{
 const previousWindow=globalThis.window;globalThis.window={mapboxgl:{}};
 t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
 const view=new LandMap();let markersRemoved=0,popupsRemoved=0;
 view.map={};view.options={hideMarkers:true,items:[{}]};
 view.markers=[{remove:()=>markersRemoved++}];view.popup={remove:()=>popupsRemoved++};view.selection='old';
 view.updateMarkers();assert.equal(markersRemoved,1);assert.equal(popupsRemoved,1);
 assert.equal(view.selection,null);assert.equal(view.popup,null);assert.deepEqual(view.markers,[]);
});

test('a parcel pin centers on one coordinate without fabricating bounds, a ring or area',()=>{
 const view=new LandMap();let located,data;
 view.options={context:'parcel',geometry:{type:'Point',coordinates:[-74.05982,4.65057]},zone:[],items:[]};
 view.map={easeTo:options=>{located=options;},getSource:()=>({setData:value=>{data=value;}})};
 view.fitView();view.updateDraw();
 assert.deepEqual(located.center,[-74.05982,4.65057]);assert.equal(located.zoom,16);
 assert.equal(data.features.length,1);assert.equal(data.features[0].geometry.type,'Point');
 assert.deepEqual(data.features[0].geometry.coordinates,[-74.05982,4.65057]);
});

test('redimensionar resultados reencuadra los marcadores sin reutilizar una cámara de otro ancho',()=>{
 const view=new LandMap(),fits=[],jumps=[];
 view.root={clientWidth:390,clientHeight:600};view.viewportSize={width:600,height:600};
 view.options={context:'search',items:[{coordinates:[-75.487,10.53]},{coordinates:[-74.19,11.24]}],zone:[],initialCamera:{center:[-75.5,10.5],zoom:12}};
 view.map={resize:()=>{},fitBounds:(bounds,options)=>fits.push({bounds,options}),jumpTo:c=>jumps.push(c)};
 view.resize();assert.equal(fits.length,1);assert.equal(jumps.length,0);
 assert.deepEqual(fits[0].bounds,[[-75.487,10.53],[-74.19,11.24]]);
 assert.equal(fits[0].options.retainPadding,false);
 assert.ok(fits[0].options.padding.bottom>=130,'Las herramientas inferiores no deben ocultar los marcadores');
 view.resize();assert.equal(fits.length,1,'Un repintado sin cambio de tamaño conserva el desplazamiento del usuario');
});
test('redimensionar durante el dibujo conserva la cámara y los puntos en curso',()=>{
 const view=new LandMap();let resized=0;
 view.root={clientWidth:390,clientHeight:600};view.viewportSize={width:600,height:600};
 view.options={context:'search',drawing:true};
 view.map={resize:()=>resized++,fitBounds:()=>assert.fail('No debe desplazar un polígono en curso')};
 view.resize();assert.equal(resized,1);
});
test('restaurar una búsqueda elimina el margen heredado de otro contexto del mapa',()=>{
 const view=new LandMap();let camera;
 view.options={context:'search',initialCamera:{center:[-75.5,10.5],zoom:11}};
 view.map={jumpTo:value=>camera=value};view.fitView();
 assert.deepEqual(camera,{center:[-75.5,10.5],zoom:11,padding:0});
});
