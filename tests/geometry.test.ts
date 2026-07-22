import { describe, it, expect } from "vitest";
import { HIGHWAYS, CAMERAS, BOUNDS, project } from "@/lib/dfw/geometry";
import { TIMELINE } from "@/lib/replay/timeline";

describe("geometry data", () => {
  it("has the six named freeways", () =>
    expect(HIGHWAYS.map((h) => h.name).sort()).toEqual(
      ["DNT", "I-20", "I-30", "I-35E", "I-635", "US-75"].sort()
    ));
  it("keeps every polyline point inside BOUNDS", () => {
    for (const h of HIGHWAYS) for (const [lon, lat] of h.points) {
      expect(lon).toBeGreaterThanOrEqual(BOUNDS.minLon);
      expect(lon).toBeLessThanOrEqual(BOUNDS.maxLon);
      expect(lat).toBeGreaterThanOrEqual(BOUNDS.minLat);
      expect(lat).toBeLessThanOrEqual(BOUNDS.maxLat);
    }
  });
  it("keeps cameras and timeline events inside BOUNDS", () => {
    for (const { lonlat: [lon, lat] } of [...CAMERAS, ...TIMELINE]) {
      expect(lon).toBeGreaterThanOrEqual(BOUNDS.minLon);
      expect(lon).toBeLessThanOrEqual(BOUNDS.maxLon);
      expect(lat).toBeGreaterThanOrEqual(BOUNDS.minLat);
      expect(lat).toBeLessThanOrEqual(BOUNDS.maxLat);
    }
  });
});

describe("project", () => {
  it("maps the SW corner to bottom-left inside padding", () => {
    const [x, y] = project([BOUNDS.minLon, BOUNDS.minLat], 1000, 800, 40);
    expect(x).toBe(40);
    expect(y).toBe(760);
  });
  it("maps the NE corner to top-right inside padding", () => {
    const [x, y] = project([BOUNDS.maxLon, BOUNDS.maxLat], 1000, 800, 40);
    expect(x).toBe(960);
    expect(y).toBe(40);
  });
});
