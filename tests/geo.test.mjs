import test from "node:test";
import assert from "node:assert/strict";
import {
  isCoordinate,
  validRing,
  pointInRing,
  toPolygon,
  insideBounds,
  extent,
} from "../web/geo.js";

const zone = [
  [-75.51, 10.51],
  [-75.47, 10.51],
  [-75.47, 10.55],
  [-75.51, 10.55],
];
test("coordenadas WGS84 válidas; rechaza posiciones en píxeles del mapa anterior", () => {
  assert.equal(isCoordinate([-75.487, 10.53]), true);
  for (const p of [
    [610, 292],
    [0, 91],
    ["-75", 10],
    [Infinity, 10],
    [0, 0, 1],
    null,
  ])
    assert.equal(isCoordinate(p), false);
});
test("zona geográfica simple válida; rechaza colinealidad, duplicados y cruces", () => {
  assert.equal(validRing(zone), true);
  assert.equal(validRing([zone[0], zone[2], zone[1], zone[3]]), false);
  assert.equal(
    validRing([
      [-75, 10],
      [-74, 10],
      [-73, 10],
    ]),
    false,
  );
  assert.equal(validRing([...zone, zone[0]]), false);
  assert.equal(
    validRing([
      [490, 240],
      [650, 165],
      [790, 367],
    ]),
    false,
  );
});
test("coincidencias dentro, fuera y sobre el borde de una zona", () => {
  assert.equal(pointInRing([-75.487, 10.53], zone), true);
  assert.equal(pointInRing([-74.951, 10.992], zone), false);
  assert.equal(pointInRing(zone[0], zone), true);
  assert.equal(pointInRing([-75.51, 10.53], zone), true);
  assert.equal(pointInRing([610, 292], zone), false);
});
test("la prueba de inclusión funciona con el orden del anillo invertido", () => {
  assert.equal(pointInRing([-75.487, 10.53], [...zone].reverse()), true);
  assert.equal(validRing([...zone].reverse()), true);
});
test("GeoJSON cierra el anillo y no comparte ni modifica las coordenadas originales", () => {
  const original = structuredClone(zone),
    polygon = toPolygon(zone);
  assert.equal(polygon.type, "Polygon");
  assert.equal(polygon.coordinates[0].length, 5);
  assert.deepEqual(polygon.coordinates[0][0], polygon.coordinates[0].at(-1));
  polygon.coordinates[0][0][0] = 0;
  assert.deepEqual(zone, original);
  assert.throws(
    () =>
      toPolygon([
        [490, 240],
        [650, 165],
        [790, 367],
      ]),
    /invalid_search_polygon/,
  );
});
test("extent y bbox para centrar y filtrar sin invertir latitud y longitud", () => {
  const bounds = extent(zone);
  assert.deepEqual(bounds, [-75.51, 10.51, -75.47, 10.55]);
  assert.equal(insideBounds([-75.487, 10.53], bounds), true);
  assert.equal(insideBounds([-74.951, 10.992], bounds), false);
  assert.equal(extent([]), null);
  assert.equal(insideBounds([10.53, -75.487], bounds), false);
});
