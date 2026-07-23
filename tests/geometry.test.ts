import { describe, expect, it } from "vitest";
import { createTrafficDots } from "@/components/MapCanvas";
import { BOUNDS, CAMERAS, project, ROAD_SEGMENTS, WATER } from "@/lib/dfw/geometry";
import { TIMELINE } from "@/lib/replay/timeline";

const REQUIRED_ROUTES = [
  "I-35E", "I-35W", "I-30", "I-20", "I-635", "I-820", "US-75", "DNT",
] as const;
const CORRIDOR_MIN_SPAN_KM = {
  "I-35E": 45, "I-35W": 45, "I-30": 70, "I-20": 70,
  "I-635": 35, "I-820": 30, "US-75": 24, DNT: 20,
} as const;
const CONSUMERS = [
  { name: "portrait Hero", width: 390, height: 844 },
  { name: "PhonePreview", width: 288, height: 224 },
  { name: "mobile Coverage", width: 350, height: 288 },
  { name: "desktop Coverage", width: 672, height: 288 },
] as const;

function distanceKm(
  [lonA, latA]: readonly [number, number],
  [lonB, latB]: readonly [number, number],
): number {
  const radians = Math.PI / 180;
  const latDelta = (latB - latA) * radians;
  const lonDelta = (lonB - lonA) * radians;
  const a = Math.sin(latDelta / 2) ** 2 +
    Math.cos(latA * radians) * Math.cos(latB * radians) *
    Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function corridorSpanKm(route: string): number {
  const points = ROAD_SEGMENTS
    .filter((segment) => segment.routes.includes(route))
    .flatMap((segment) => segment.points);
  const lons = points.map(([lon]) => lon);
  const lats = points.map(([, lat]) => lat);
  return distanceKm(
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  );
}

function visibleEnvelopeRatio(width: number, height: number): number {
  const visible = ROAD_SEGMENTS.flatMap((segment) => segment.points).map((point) => {
    const [x, y] = project(point, width, height);
    return [
      Math.min(width, Math.max(0, x)),
      Math.min(height, Math.max(0, y)),
    ] as const;
  });
  const xs = visible.map(([x]) => x);
  const ys = visible.map(([, y]) => y);
  return ((Math.max(...xs) - Math.min(...xs)) *
    (Math.max(...ys) - Math.min(...ys))) / (width * height);
}

describe("generated DFW geometry", () => {
  it("keeps every required corridor when membership is derived", () => {
    // Given the committed segmented model, when routes are derived, then all required corridors exist.
    const routes = new Set(ROAD_SEGMENTS.flatMap((segment) => segment.routes));
    expect(REQUIRED_ROUTES.every((route) => routes.has(route))).toBe(true);
  });

  it("keeps drawable road points inside generated bounds", () => {
    // Given each segment, when points are inspected, then clipping invariants hold.
    for (const segment of ROAD_SEGMENTS) {
      expect(segment.points.length).toBeGreaterThanOrEqual(2);
      for (const [lon, lat] of segment.points) {
        expect(lon).toBeGreaterThanOrEqual(BOUNDS.minLon);
        expect(lon).toBeLessThanOrEqual(BOUNDS.maxLon);
        expect(lat).toBeGreaterThanOrEqual(BOUNDS.minLat);
        expect(lat).toBeLessThanOrEqual(BOUNDS.maxLat);
      }
    }
  });

  it("keeps closed water rings with drawable geometry", () => {
    // Given the outer rings, when inspected, then each ring is closed and drawable.
    for (const ring of WATER.rings) {
      expect(ring.length).toBeGreaterThanOrEqual(4);
      expect(ring.at(-1)).toEqual(ring[0]);
    }
  });

  it("keeps twelve unique stable cameras near whitelisted roads", () => {
    // Given camera records, when identity and position are checked, then consumer contracts hold.
    const ids = CAMERAS.map((camera) => camera.id);
    const points = ROAD_SEGMENTS.flatMap((segment) => segment.points);
    expect(CAMERAS).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
    expect(ids.every((id) => /^CAM-\d{3}$/.test(id))).toBe(true);
    for (const camera of CAMERAS) {
      expect(Math.min(...points.map((point) => distanceKm(camera.lonlat, point))))
        .toBeLessThanOrEqual(0.3);
    }
  });

  it("aligns every replay event exactly with its camera", () => {
    // Given the camera lookup, when events resolve, then ring and highlight coordinates match.
    const cameras = new Map(CAMERAS.map((camera) => [camera.id, camera.lonlat]));
    for (const event of TIMELINE) {
      expect(cameras.has(event.camId)).toBe(true);
      expect(event.lonlat).toEqual(cameras.get(event.camId));
    }
  });

  it("ships each physical segment only once", () => {
    // Given orientation-independent keys, when compared, then coordinates are unique.
    const keys = ROAD_SEGMENTS.map((segment) => {
      const forward = JSON.stringify(segment.points);
      const reverse = JSON.stringify([...segment.points].reverse());
      return forward < reverse ? forward : reverse;
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("precomputes forty traffic dots deterministically", () => {
    // Given one road input, when generated twice, then the layout and count match.
    expect(createTrafficDots(ROAD_SEGMENTS)).toEqual(createTrafficDots(ROAD_SEGMENTS));
    expect(createTrafficDots(ROAD_SEGMENTS)).toHaveLength(40);
  });

  it("selects full and Dallas focus centers by aspect", () => {
    // Given wide and portrait consumers, when centers project, then the intended viewport is selected.
    const fullCenter: readonly [number, number] = [
      (BOUNDS.minLon + BOUNDS.maxLon) / 2,
      (BOUNDS.minLat + BOUNDS.maxLat) / 2,
    ];
    expect(project(fullCenter, 1200, 700)).toEqual([600, 350]);
    expect(project([-96.8, 32.8], 390, 844)).toEqual([195, 422]);
  });

  it.each(CONSUMERS)("keeps a uniform scale in $name", ({ width, height }) => {
    // Given equal local distances, when projected, then longitude and latitude share one scale.
    const origin = project([-96.8, 32.8], width, height);
    const east = project([-96.79, 32.8], width, height);
    const north = project([-96.8, 32.81], width, height);
    const lonScale = Math.abs(east[0] - origin[0]) /
      (0.01 * Math.cos((32.8 * Math.PI) / 180));
    const latScale = Math.abs(north[1] - origin[1]) / 0.01;
    expect(lonScale).toBeCloseTo(latScale, 8);
  });

  it.each(CONSUMERS)("covers sixty percent of $name", ({ width, height }) => {
    // Given actual consumer dimensions, when the visible envelope is measured, then it fills the frame.
    expect(visibleEnvelopeRatio(width, height)).toBeGreaterThanOrEqual(0.6);
  });

  it("retains absolute required corridor spans", () => {
    // Given extraction floors, when committed spans are measured, then no corridor has collapsed.
    for (const route of REQUIRED_ROUTES) {
      expect(corridorSpanKm(route)).toBeGreaterThanOrEqual(CORRIDOR_MIN_SPAN_KM[route]);
    }
  });
});
