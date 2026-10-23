// Coordenadas WGS84: [longitud, latitud]. No calcula titularidad ni viabilidad.
export function isCoordinate(p) {
  return (
    Array.isArray(p) &&
    p.length === 2 &&
    p.every(Number.isFinite) &&
    Math.abs(p[0]) <= 180 &&
    Math.abs(p[1]) <= 90
  );
}
const cross = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const onSegment = (p, a, b) =>
  Math.abs(cross(a, b, p)) < 1e-10 &&
  p[0] >= Math.min(a[0], b[0]) - 1e-10 &&
  p[0] <= Math.max(a[0], b[0]) + 1e-10 &&
  p[1] >= Math.min(a[1], b[1]) - 1e-10 &&
  p[1] <= Math.max(a[1], b[1]) + 1e-10;
function segmentsIntersect(a, b, c, d) {
  const x = cross(a, b, c),
    y = cross(a, b, d),
    z = cross(c, d, a),
    w = cross(c, d, b);
  return (
    (x * y < 0 && z * w < 0) ||
    onSegment(c, a, b) ||
    onSegment(d, a, b) ||
    onSegment(a, c, d) ||
    onSegment(b, c, d)
  );
}
export function validRing(points) {
  if (
    !Array.isArray(points) ||
    points.length < 3 ||
    points.length > 500 ||
    !points.every(isCoordinate)
  )
    return false;
  if (new Set(points.map((p) => p.join(","))).size !== points.length)
    return false;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      if (segmentsIntersect(a, b, points[j], points[(j + 1) % points.length]))
        return false;
    }
  }
  return Math.abs(area) > 1e-12;
}
export function pointInRing(point, points) {
  if (
    !isCoordinate(point) ||
    !Array.isArray(points) ||
    points.length < 3 ||
    !points.every(isCoordinate)
  )
    return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (onSegment(point, a, b)) return true;
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
export function toPolygon(points) {
  if (!validRing(points)) throw Error("invalid_search_polygon");
  return {
    type: "Polygon",
    coordinates: [[...points.map((p) => [...p]), [...points[0]]]],
  };
}
export function insideBounds(point, bounds) {
  return (
    isCoordinate(point) &&
    Array.isArray(bounds) &&
    bounds.length === 4 &&
    bounds.every(Number.isFinite) &&
    point[0] >= bounds[0] &&
    point[0] <= bounds[2] &&
    point[1] >= bounds[1] &&
    point[1] <= bounds[3]
  );
}
export function extent(points) {
  const valid = points.filter(isCoordinate);
  if (!valid.length) return null;
  return [
    Math.min(...valid.map((p) => p[0])),
    Math.min(...valid.map((p) => p[1])),
    Math.max(...valid.map((p) => p[0])),
    Math.max(...valid.map((p) => p[1])),
  ];
}

// Mapbox Geocoding v6 stores the extent in properties.bbox; v5 uses bbox.
export function locationBounds(feature) {
  const bounds = feature?.properties?.bbox || feature?.bbox;
  if (
    !Array.isArray(bounds) ||
    bounds.length !== 4 ||
    !isCoordinate(bounds.slice(0, 2)) ||
    !isCoordinate(bounds.slice(2)) ||
    bounds[0] >= bounds[2] ||
    bounds[1] >= bounds[3]
  )
    return null;
  return [...bounds];
}
