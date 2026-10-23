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
