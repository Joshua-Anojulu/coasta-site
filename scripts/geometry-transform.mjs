// Pure geometry transforms for the reproducible DFW extraction pipeline.
// allow: SIZE_OK - the frozen spec requires every transform in this single module.

export const REQUIRED_ROUTES = [
  "I-35E", "I-35W", "I-30", "I-20", "I-635", "I-820", "US-75", "DNT",
];
export const OPTIONAL_ROUTES = ["US-175", "SH-183", "SH-114", "Loop-12", "PGBT"];
export const ROUTE_WHITELIST = [...REQUIRED_ROUTES, ...OPTIONAL_ROUTES];

const ROUTE_PATTERNS = [
  ["I-35E", /\b(?:INTERSTATE|IH|I)\s*-?\s*35E\b/g],
  ["I-35W", /\b(?:INTERSTATE|IH|I)\s*-?\s*35W\b/g],
  ["I-635", /\b(?:INTERSTATE|IH|I)\s*-?\s*635\b/g],
  ["I-820", /\b(?:INTERSTATE|IH|I)\s*-?\s*820\b/g],
  ["I-30", /\b(?:INTERSTATE|IH|I)\s*-?\s*30\b/g],
  ["I-20", /\b(?:INTERSTATE|IH|I)\s*-?\s*20\b/g],
  ["US-175", /\b(?:US HIGHWAY|US)\s*-?\s*175\b/g],
  ["US-75", /\b(?:US HIGHWAY|US)\s*-?\s*75\b/g],
  ["SH-183", /\b(?:STATE HIGHWAY|SH|TX)\s*-?\s*183\b/g],
  ["SH-114", /\b(?:STATE HIGHWAY|SH|TX)\s*-?\s*114\b/g],
  ["Loop-12", /\b(?:STATE LOOP|LOOP|SL)\s*-?\s*12\b/g],
  ["DNT", /\b(?:DNT|DALLAS NORTH TOLLWAY)\b/g],
  ["PGBT", /\b(?:PGBT|PRESIDENT GEORGE BUSH TURNPIKE|GEORGE BUSH TURNPIKE)\b/g],
];

function comparePoints([lonA, latA], [lonB, latB]) {
  return lonA === lonB ? latA - latB : lonA - lonB;
}

function equalPoints([lonA, latA], [lonB, latB]) {
  return lonA === lonB && latA === latB;
}

function normalizedText(value) {
  return value.toUpperCase().replaceAll("_", " ").replace(/\s+/g, " ");
}

export function canonicalizeRouteRefs(tags) {
  const text = Object.values(tags)
    .filter((value) => typeof value === "string")
    .map(normalizedText)
    .join(" ; ");
  const routes = new Set();
  for (const [route, pattern] of ROUTE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) routes.add(route);
  }
  return [...routes].sort();
}

function inside([lon, lat], bounds) {
  return lon >= bounds.minLon && lon <= bounds.maxLon &&
    lat >= bounds.minLat && lat <= bounds.maxLat;
}

function clipSegment([x0, y0], [x1, y1], bounds) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const p = [-dx, dx, -dy, dy];
  const q = [x0 - bounds.minLon, bounds.maxLon - x0,
    y0 - bounds.minLat, bounds.maxLat - y0];
  let start = 0;
  let end = 1;
  for (let index = 0; index < 4; index += 1) {
    if (p[index] === 0) {
      if (q[index] < 0) return null;
      continue;
    }
    const ratio = q[index] / p[index];
    if (p[index] < 0) start = Math.max(start, ratio);
    else end = Math.min(end, ratio);
    if (start > end) return null;
  }
  return [[x0 + start * dx, y0 + start * dy], [x0 + end * dx, y0 + end * dy]];
}

function cleanLine(points) {
  const cleaned = [];
  for (const point of points) {
    if (cleaned.length === 0 || !equalPoints(cleaned.at(-1), point)) cleaned.push(point);
  }
  return cleaned;
}

export function clipPolylineToBbox(points, bounds) {
  const parts = [];
  let current = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const startPoint = points[index];
    const endPoint = points[index + 1];
    const clipped = clipSegment(startPoint, endPoint, bounds);
    if (!clipped) {
      if (current.length >= 2) parts.push(cleanLine(current));
      current = [];
      continue;
    }
    if (current.length === 0 || !inside(startPoint, bounds)) {
      if (current.length >= 2) parts.push(cleanLine(current));
      current = [clipped[0], clipped[1]];
    } else {
      if (!equalPoints(current.at(-1), clipped[0])) current.push(clipped[0]);
      current.push(clipped[1]);
    }
    if (!inside(endPoint, bounds)) {
      if (current.length >= 2) parts.push(cleanLine(current));
      current = [];
    }
  }
  if (current.length >= 2) parts.push(cleanLine(current));
  return parts.filter((part) => part.length >= 2);
}

function pointSegmentDistanceMeters(point, start, end) {
  const referenceLat = ((point[1] + start[1] + end[1]) / 3) * Math.PI / 180;
  const xScale = 111320 * Math.cos(referenceLat);
  const yScale = 110540;
  const px = (point[0] - start[0]) * xScale;
  const py = (point[1] - start[1]) * yScale;
  const vx = (end[0] - start[0]) * xScale;
  const vy = (end[1] - start[1]) * yScale;
  const lengthSquared = vx * vx + vy * vy;
  if (lengthSquared === 0) return Math.hypot(px, py);
  const ratio = Math.max(0, Math.min(1, (px * vx + py * vy) / lengthSquared));
  return Math.hypot(px - ratio * vx, py - ratio * vy);
}

export function simplifyPolyline(points, toleranceMeters) {
  if (points.length <= 2) return points.map((point) => [...point]);
  const keep = new Set([0, points.length - 1]);
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop();
    let farthestIndex = -1;
    let farthestDistance = 0;
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = pointSegmentDistanceMeters(
        points[index], points[startIndex], points[endIndex],
      );
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    }
    if (farthestDistance > toleranceMeters && farthestIndex > startIndex) {
      keep.add(farthestIndex);
      stack.push([startIndex, farthestIndex], [farthestIndex, endIndex]);
    }
  }
  return [...keep].sort((a, b) => a - b).map((index) => [...points[index]]);
}

export function maxDeviationMeters(raw, simplified) {
  let maximum = 0;
  for (const point of raw) {
    let nearest = Number.POSITIVE_INFINITY;
    for (let index = 0; index < simplified.length - 1; index += 1) {
      nearest = Math.min(nearest,
        pointSegmentDistanceMeters(point, simplified[index], simplified[index + 1]));
    }
    maximum = Math.max(maximum, nearest);
  }
  return maximum;
}


function geometryPoints(geometry) {
  if (!Array.isArray(geometry)) return [];
  return geometry
    .filter((point) => Number.isFinite(point?.lon) && Number.isFinite(point?.lat))
    .map((point) => [point.lon, point.lat]);
}

export function assembleOuterRings(members) {
  const fragments = members
    .filter((member) => member.type === "way" && member.role !== "inner")
    .map((member) => geometryPoints(member.geometry))
    .filter((points) => points.length >= 2)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const rings = [];
  while (fragments.length > 0) {
    let ring = fragments.shift();
    while (!equalPoints(ring[0], ring.at(-1))) {
      const end = ring.at(-1);
      const matchIndex = fragments.findIndex((fragment) =>
        equalPoints(fragment[0], end) || equalPoints(fragment.at(-1), end));
      if (matchIndex < 0) break;
      const [match] = fragments.splice(matchIndex, 1);
      const oriented = equalPoints(match[0], end) ? match : [...match].reverse();
      ring = [...ring, ...oriented.slice(1)];
    }
    if (ring.length >= 4 && equalPoints(ring[0], ring.at(-1))) rings.push(ring);
  }
  return rings;
}

function intersectBoundary(start, end, axis, value) {
  const delta = end[axis] - start[axis];
  const ratio = delta === 0 ? 0 : (value - start[axis]) / delta;
  return axis === 0
    ? [value, start[1] + ratio * (end[1] - start[1])]
    : [start[0] + ratio * (end[0] - start[0]), value];
}

function clipPolygonBoundary(points, axis, value, keepGreater) {
  const output = [];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const previous = points[(index + points.length - 1) % points.length];
    const currentInside = keepGreater ? current[axis] >= value : current[axis] <= value;
    const previousInside = keepGreater ? previous[axis] >= value : previous[axis] <= value;
    if (currentInside !== previousInside) {
      output.push(intersectBoundary(previous, current, axis, value));
    }
    if (currentInside) output.push(current);
  }
  return output;
}

function clipRingToBbox(ring, bounds) {
  let points = equalPoints(ring[0], ring.at(-1)) ? ring.slice(0, -1) : [...ring];
  points = clipPolygonBoundary(points, 0, bounds.minLon, true);
  points = clipPolygonBoundary(points, 0, bounds.maxLon, false);
  points = clipPolygonBoundary(points, 1, bounds.minLat, true);
  points = clipPolygonBoundary(points, 1, bounds.maxLat, false);
  if (points.length < 3) return [];
  return [...cleanLine(points), cleanLine(points)[0]];
}

function simplifyClosedRing(ring, toleranceMeters) {
  const open = equalPoints(ring[0], ring.at(-1)) ? ring.slice(0, -1) : [...ring];
  if (open.length <= 3) return [...open, open[0]];
  let anchor = 0;
  for (let index = 1; index < open.length; index += 1) {
    if (comparePoints(open[index], open[anchor]) < 0) anchor = index;
  }
  const rotated = [...open.slice(anchor), ...open.slice(0, anchor)];
  let split = 1;
  let farthest = 0;
  for (let index = 1; index < rotated.length; index += 1) {
    const distance = pointSegmentDistanceMeters(rotated[index], rotated[0], rotated[0]);
    if (distance > farthest) {
      farthest = distance;
      split = index;
    }
  }
  const first = simplifyPolyline(rotated.slice(0, split + 1), toleranceMeters);
  const second = simplifyPolyline([...rotated.slice(split), rotated[0]], toleranceMeters);
  const simplified = [...first, ...second.slice(1, -1)];
  return simplified.length >= 3 ? [...simplified, simplified[0]] : [...open, open[0]];
}

function canonicalLine(points) {
  const forward = cleanLine(points);
  const reverse = [...forward].reverse();
  return comparePoints(forward[0], forward.at(-1)) <= 0 ? forward : reverse;
}

function canonicalRing(ring) {
  const open = equalPoints(ring[0], ring.at(-1)) ? ring.slice(0, -1) : [...ring];
  let anchor = 0;
  for (let index = 1; index < open.length; index += 1) {
    if (comparePoints(open[index], open[anchor]) < 0) anchor = index;
  }
  const forward = [...open.slice(anchor), ...open.slice(0, anchor)];
  const reversedOpen = [...open].reverse();
  const reverseAnchor = reversedOpen.findIndex((point) => equalPoints(point, open[anchor]));
  const reverse = [...reversedOpen.slice(reverseAnchor), ...reversedOpen.slice(0, reverseAnchor)];
  const chosen = JSON.stringify(forward) <= JSON.stringify(reverse) ? forward : reverse;
  return [...chosen, chosen[0]];
}

function polygonAreaKm2(ring) {
  const meanLat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
  const xScale = 111.32 * Math.cos(meanLat * Math.PI / 180);
  const yScale = 110.54;
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    area += ring[index][0] * xScale * ring[index + 1][1] * yScale -
      ring[index + 1][0] * xScale * ring[index][1] * yScale;
  }
  return Math.abs(area) / 2;
}

function quantizePoints(points, digits) {
  const factor = 10 ** digits;
  return cleanLine(points.map(([lon, lat]) => [
    Math.round(lon * factor) / factor,
    Math.round(lat * factor) / factor,
  ]));
}

function classForRoutes(routes) {
  if (routes.some((route) => route.startsWith("I-"))) return "interstate";
  if (routes.some((route) => route.startsWith("US-"))) return "us";
  if (routes.some((route) => route.startsWith("SH-"))) return "state";
  if (routes.some((route) => route.startsWith("Loop-"))) return "loop";
  return "tollway";
}

export function deduplicateSegments(segments) {
  const byGeometry = new Map();
  for (const source of segments) {
    const points = canonicalLine(source.points);
    const key = JSON.stringify(points);
    const existing = byGeometry.get(key);
    if (!existing) {
      byGeometry.set(key, { ...source, points, routes: [...source.routes].sort() });
      continue;
    }
    existing.routes = [...new Set([...existing.routes, ...source.routes])].sort();
    existing.cls = classForRoutes(existing.routes);
    if (source.wayId < existing.wayId ||
      (source.wayId === existing.wayId && source.partIndex < existing.partIndex)) {
      existing.id = source.id;
      existing.wayId = source.wayId;
      existing.partIndex = source.partIndex;
    }
  }
  return [...byGeometry.values()].sort((a, b) =>
    a.routes[0].localeCompare(b.routes[0]) || a.wayId - b.wayId ||
    a.partIndex - b.partIndex);
}

function endpointKey(point) {
  return JSON.stringify(point);
}

function mergeSegmentGroup(group) {
  const adjacency = new Map();
  group.forEach((segment, index) => {
    for (const point of [segment.points[0], segment.points.at(-1)]) {
      const key = endpointKey(point);
      const indexes = adjacency.get(key) ?? [];
      indexes.push(index);
      adjacency.set(key, indexes);
    }
  });
  const visited = new Set();
  const merged = [];
  const trace = (startIndex, startKey) => {
    let currentIndex = startIndex;
    let current = group[currentIndex];
    let points = endpointKey(current.points[0]) === startKey
      ? [...current.points] : [...current.points].reverse();
    const members = [current];
    visited.add(currentIndex);
    while (true) {
      const endKey = endpointKey(points.at(-1));
      const incident = adjacency.get(endKey) ?? [];
      if (incident.length !== 2) break;
      const nextIndex = incident.find((index) => index !== currentIndex && !visited.has(index));
      if (nextIndex === undefined) break;
      const next = group[nextIndex];
      const oriented = endpointKey(next.points[0]) === endKey
        ? next.points : [...next.points].reverse();
      points.push(...oriented.slice(1));
      members.push(next);
      visited.add(nextIndex);
      currentIndex = nextIndex;
      current = next;
    }
    const first = [...members].sort((a, b) =>
      a.wayId - b.wayId || a.partIndex - b.partIndex)[0];
    merged.push({
      id: members.length === 1 ? first.id : `chain-${first.wayId}-${first.partIndex}`,
      routes: [...first.routes],
      cls: first.cls,
      points: canonicalLine(points),
      wayId: first.wayId,
      partIndex: first.partIndex,
    });
  };
  const order = group.map((segment, index) => ({ segment, index }))
    .sort((a, b) => a.segment.wayId - b.segment.wayId ||
      a.segment.partIndex - b.segment.partIndex);
  for (const { segment, index } of order) {
    if (visited.has(index)) continue;
    const startKey = endpointKey(segment.points[0]);
    const endKey = endpointKey(segment.points.at(-1));
    const startDegree = (adjacency.get(startKey) ?? []).length;
    const endDegree = (adjacency.get(endKey) ?? []).length;
    if (startDegree === 2 && endDegree === 2) continue;
    trace(index, startDegree !== 2 ? startKey : endKey);
  }
  for (const { segment, index } of order) {
    if (!visited.has(index)) trace(index, endpointKey(segment.points[0]));
  }
  return merged;
}

export function mergeConnectedSegments(segments) {
  const groups = new Map();
  for (const segment of segments) {
    const key = `${segment.cls}|${segment.routes.join("|")}`;
    const group = groups.get(key) ?? [];
    group.push(segment);
    groups.set(key, group);
  }
  return [...groups.values()].flatMap(mergeSegmentGroup).sort((a, b) =>
    a.routes[0].localeCompare(b.routes[0]) || a.wayId - b.wayId ||
    a.partIndex - b.partIndex);
}

function corridorSpanKm(segments, route) {
  const points = segments.filter((segment) => segment.routes.includes(route))
    .flatMap((segment) => segment.points);
  if (points.length === 0) return 0;
  const lons = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);
  return Math.hypot(
    (Math.max(...lons) - Math.min(...lons)) * 111.32 *
      Math.cos(((Math.max(...lats) + Math.min(...lats)) / 2) * Math.PI / 180),
    (Math.max(...lats) - Math.min(...lats)) * 110.54,
  );
}


function routeMembership(elements) {
  const byWay = new Map();
  for (const element of elements) {
    if (element.type !== "relation" || element.tags?.type !== "route" ||
      element.tags?.route !== "road") continue;
    const routes = canonicalizeRouteRefs(element.tags ?? {});
    for (const member of element.members ?? []) {
      if (member.type !== "way") continue;
      const memberships = byWay.get(member.ref) ?? new Set();
      for (const route of routes) memberships.add(route);
      byWay.set(member.ref, memberships);
    }
  }
  return byWay;
}

function collectWaterRings(elements, bounds, toleranceMeters, minimumAreaKm2, digits) {
  const rawRings = [];
  for (const element of elements) {
    const waterFeature = element.tags?.natural === "water" || element.tags?.water === "river";
    if (!waterFeature) continue;
    if (element.type === "way") {
      const points = geometryPoints(element.geometry);
      if (points.length >= 4 && equalPoints(points[0], points.at(-1))) rawRings.push(points);
    } else if (element.type === "relation") {
      rawRings.push(...assembleOuterRings(element.members ?? []));
    }
  }
  const rings = [];
  for (const raw of rawRings) {
    if (polygonAreaKm2(raw) <= minimumAreaKm2) continue;
    const clipped = clipRingToBbox(raw, bounds);
    if (clipped.length < 4) continue;
    const simplified = simplifyClosedRing(clipped, toleranceMeters);
    const quantized = quantizePoints(simplified, digits);
    if (quantized.length >= 4 && equalPoints(quantized[0], quantized.at(-1))) {
      rings.push(canonicalRing(quantized));
    }
  }
  const unique = new Map(rings.map((ring) => [JSON.stringify(ring), ring]));
  return [...unique.values()].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

export function transformOverpassResponse(response, options) {
  const elements = Array.isArray(response?.elements) ? response.elements : [];
  const bounds = options.bounds;
  const digits = options.coordinateDigits ?? 5;
  const allowed = new Set(options.allowedRoutes ?? ROUTE_WHITELIST);
  const memberships = routeMembership(elements);
  const clippedSegments = [];

  for (const element of elements) {
    if (element.type !== "way" ||
      !["motorway", "trunk"].includes(element.tags?.highway)) continue;
    const routes = [...new Set([
      ...canonicalizeRouteRefs(element.tags ?? {}),
      ...(memberships.get(element.id) ?? []),
    ])].filter((route) => allowed.has(route)).sort();
    if (routes.length === 0) continue;
    const parts = clipPolylineToBbox(geometryPoints(element.geometry), bounds);
    parts.forEach((part, partIndex) => {
      clippedSegments.push({
        id: `way-${element.id}-${partIndex}`,
        routes,
        cls: classForRoutes(routes),
        points: canonicalLine(part),
        wayId: element.id,
        partIndex,
      });
    });
  }

  const rawSegments = mergeConnectedSegments(deduplicateSegments(clippedSegments));
  let maximumDeviation = 0;
  const simplifiedSegments = rawSegments.map((segment) => {
    const points = quantizePoints(
      simplifyPolyline(segment.points, options.roadToleranceMeters), digits,
    );
    const deviation = maxDeviationMeters(segment.points, points);
    if (deviation > 120) {
      throw new RangeError(`Road simplification exceeded 120m for ${segment.id}`);
    }
    maximumDeviation = Math.max(maximumDeviation, deviation);
    return { ...segment, points: canonicalLine(points) };
  });
  const roadSegments = simplifiedSegments.map(({ id, routes, cls, points }) =>
    ({ id, routes, cls, points }));
  const rawPointCount = rawSegments.reduce((sum, segment) => sum + segment.points.length, 0);
  const simplifiedPointCount = roadSegments.reduce(
    (sum, segment) => sum + segment.points.length, 0,
  );
  const waterRings = collectWaterRings(
    elements, bounds, options.waterToleranceMeters,
    options.minWaterAreaKm2, digits,
  );
  const routes = [...new Set(roadSegments.flatMap((segment) => segment.routes))].sort();
  const corridorSpans = Object.fromEntries(routes.map((route) => {
    const rawKm = corridorSpanKm(rawSegments, route);
    const simplifiedKm = corridorSpanKm(roadSegments, route);
    return [route, {
      rawKm,
      simplifiedKm,
      retainedPercent: rawKm === 0 ? 0 : (simplifiedKm / rawKm) * 100,
    }];
  }));
  return {
    roadSegments,
    water: { rings: waterRings },
    corridorSpans,
    stats: {
      routes,
      segments: roadSegments.length,
      rawPoints: rawPointCount,
      simplifiedPoints: simplifiedPointCount,
      waterRings: waterRings.length,
      waterPoints: waterRings.reduce((sum, ring) => sum + ring.length, 0),
      maximumDeviationMeters: maximumDeviation,
    },
  };
}


function pointDistanceKm([lonA, latA], [lonB, latB]) {
  const meanLat = ((latA + latB) / 2) * Math.PI / 180;
  return Math.hypot(
    (lonB - lonA) * 111.32 * Math.cos(meanLat),
    (latB - latA) * 110.54,
  );
}

export function snapCameras(roadSegments, targets) {
  const used = new Set();
  return targets.map((target) => {
    const candidates = roadSegments
      .filter((segment) => segment.routes.includes(target.route))
      .flatMap((segment) => segment.points)
      .map((point) => ({ point, distance: pointDistanceKm(target.lonlat, point) }))
      .sort((a, b) => a.distance - b.distance || comparePoints(a.point, b.point));
    const match = candidates.find(({ point }) => !used.has(JSON.stringify(point)));
    if (!match) throw new RangeError(`No unique road point for ${target.id}`);
    used.add(JSON.stringify(match.point));
    return { id: target.id, lonlat: [...match.point] };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

export function computeBounds(roadSegments, water, cameras) {
  const points = [
    ...roadSegments.flatMap((segment) => segment.points),
    ...water.rings.flatMap((ring) => ring),
    ...cameras.map((camera) => camera.lonlat),
  ];
  if (points.length === 0) throw new RangeError("Cannot compute empty geometry bounds");
  const lons = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);
  return {
    minLon: Math.min(...lons), maxLon: Math.max(...lons),
    minLat: Math.min(...lats), maxLat: Math.max(...lats),
  };
}

function sortedArtifact(data) {
  const roadSegments = data.roadSegments.map((segment) => ({
    id: String(segment.id),
    routes: [...segment.routes].map(String).sort(),
    cls: String(segment.cls),
    points: segment.points.map(([lon, lat]) => [Number(lon), Number(lat)]),
  })).sort((a, b) =>
    a.routes[0].localeCompare(b.routes[0]) || a.id.localeCompare(b.id));
  const rings = data.water.rings.map((ring) => canonicalRing(
    ring.map(([lon, lat]) => [Number(lon), Number(lat)]),
  )).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const cameras = data.cameras.map((camera) => ({
    id: String(camera.id),
    lonlat: [Number(camera.lonlat[0]), Number(camera.lonlat[1])],
  })).sort((a, b) => a.id.localeCompare(b.id));
  const bounds = {
    minLon: Number(data.bounds.minLon), maxLon: Number(data.bounds.maxLon),
    minLat: Number(data.bounds.minLat), maxLat: Number(data.bounds.maxLat),
  };
  return { roadSegments, water: { rings }, cameras, bounds };
}

export function serializeGeometryData(data) {
  const artifact = sortedArtifact(data);
  return [
    `export const ROAD_SEGMENTS = ${JSON.stringify(artifact.roadSegments)} as const;`,
    `export const WATER = ${JSON.stringify(artifact.water)} as const;`,
    `export const CAMERAS = ${JSON.stringify(artifact.cameras)} as const;`,
    `export const BOUNDS = ${JSON.stringify(artifact.bounds)} as const;`,
    "",
  ].join("\n");
}
