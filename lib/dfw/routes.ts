import { ROAD_SEGMENTS, type LonLat } from "./geometry";

// Deterministic route-name priority: when a road segment carries multiple
// concurrent signed routes (e.g. I-20/I-30 or DNT/PGBT), the first name in
// this list that the segment carries wins - fixed order, first match, so
// the same point always resolves to the same label. Extends the corridor
// list tests/geometry.test.ts already requires with the remaining named
// routes present in the generated segment data.
const ROUTE_PRIORITY: readonly string[] = [
  "I-35E", "I-35W", "I-30", "I-20", "I-635", "I-820", "US-75", "DNT", "PGBT",
];

const NEAR_THRESHOLD_KM = 0.15;
const KM_PER_LAT_DEG = 110.574;

function kmPerLonDeg(latDeg: number): number {
  return 111.32 * Math.cos((latDeg * Math.PI) / 180);
}

// Local planar projection centered on `origin` - accurate at the sub-km
// scale this helper operates at (DFW-area longitudes/latitudes only).
function toLocalKm(origin: LonLat, point: LonLat): readonly [number, number] {
  const lonScale = kmPerLonDeg(origin[1]);
  return [(point[0] - origin[0]) * lonScale, (point[1] - origin[1]) * KM_PER_LAT_DEG];
}

function pointToSegmentKm(point: LonLat, a: LonLat, b: LonLat): number {
  const A = toLocalKm(point, a);
  const B = toLocalKm(point, b);
  const abx = B[0] - A[0];
  const aby = B[1] - A[1];
  const lenSq = abx * abx + aby * aby;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, (-A[0] * abx + -A[1] * aby) / lenSq));
  const cx = A[0] + t * abx;
  const cy = A[1] + t * aby;
  return Math.hypot(-cx, -cy);
}

function pickRoute(routes: readonly string[]): string | null {
  for (const name of ROUTE_PRIORITY) {
    if (routes.includes(name)) return name;
  }
  return routes[0] ?? null;
}

/**
 * Resolves the nearest named route to a point, within ~150m. Cameras carry
 * no road field of their own, so this is the source of truth for the hero
 * hotspot card's road-name line. Returns null when nothing is in range - the
 * card falls back to the generic "DFW metroplex" line in that case.
 */
export function nearestRouteRef(point: LonLat): string | null {
  let bestDistance = Infinity;
  let bestRoutes: readonly string[] | null = null;
  for (const segment of ROAD_SEGMENTS) {
    for (let i = 1; i < segment.points.length; i++) {
      const d = pointToSegmentKm(point, segment.points[i - 1], segment.points[i]);
      if (d < bestDistance) {
        bestDistance = d;
        bestRoutes = segment.routes;
      }
    }
  }
  if (!bestRoutes || bestDistance > NEAR_THRESHOLD_KM) return null;
  return pickRoute(bestRoutes);
}
