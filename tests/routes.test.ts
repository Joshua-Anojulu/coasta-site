import { describe, expect, it } from "vitest";
import { nearestRouteRef } from "@/lib/dfw/routes";
import { CAMERAS } from "@/lib/dfw/geometry";

describe("nearestRouteRef", () => {
  it("resolves every camera to a route within range", () => {
    // Given each committed camera, when resolved, then a route name is found.
    for (const cam of CAMERAS) {
      expect(nearestRouteRef(cam.lonlat)).not.toBeNull();
    }
  });

  it("resolves CAM-114 to US-75", () => {
    // Given the High Five camera, when resolved, then its road matches the timeline.
    const cam = CAMERAS.find((c) => c.id === "CAM-114")!;
    expect(nearestRouteRef(cam.lonlat)).toBe("US-75");
  });

  it("applies deterministic priority when a segment carries concurrent routes", () => {
    // Given a camera on an I-20/I-30 concurrency, when resolved, then priority order wins.
    const cam = CAMERAS.find((c) => c.id === "CAM-207")!;
    expect(nearestRouteRef(cam.lonlat)).toBe("I-30");
  });

  it("returns the same route on repeated calls (deterministic)", () => {
    // Given one input point, when called twice, then the result is identical.
    const cam = CAMERAS[0];
    expect(nearestRouteRef(cam.lonlat)).toBe(nearestRouteRef(cam.lonlat));
  });

  it("returns null when nothing is within range", () => {
    // Given a point far from any DFW road, when resolved, then it falls back to null.
    expect(nearestRouteRef([-90, 25])).toBeNull();
  });
});
