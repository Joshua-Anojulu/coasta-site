import { describe, expect, it } from "vitest";
import {
  assembleOuterRings,
  canonicalizeRouteRefs,
  clipPolylineToBbox,
  deduplicateSegments,
  mergeConnectedSegments,
  maxDeviationMeters,
  serializeGeometryData,
  simplifyPolyline,
  transformOverpassResponse,
} from "../scripts/geometry-transform.mjs";

const FIXTURE_BOUNDS = { minLon: 0, maxLon: 1, minLat: 0, maxLat: 1 } as const;
const FIXTURE_RESPONSE = {
  elements: [
    {
      type: "way",
      id: 11,
      tags: {
        highway: "motorway",
        ref: "IH 35E; I 20 / I 820",
        unsafe: "`; globalThis.compromised = true; //",
      },
      geometry: [
        { lon: -0.2, lat: 0.2 },
        { lon: 0.5, lat: 0.2 },
        { lon: 1.2, lat: 0.2 },
      ],
    },
    {
      type: "relation",
      id: 90,
      tags: { type: "route", route: "road", ref: "Interstate 35E" },
      members: [{ type: "way", ref: 11, role: "" }],
    },
    {
      type: "relation",
      id: 100,
      tags: { type: "multipolygon", natural: "water", name: "Fixture Lake" },
      members: [
        {
          type: "way", ref: 201, role: "outer",
          geometry: [
            { lon: 0.1, lat: 0.1 },
            { lon: 0.3, lat: 0.1 },
            { lon: 0.3, lat: 0.3 },
          ],
        },
        {
          type: "way", ref: 202, role: "outer",
          geometry: [
            { lon: 0.3, lat: 0.3 },
            { lon: 0.1, lat: 0.3 },
            { lon: 0.1, lat: 0.1 },
          ],
        },
        {
          type: "way", ref: 203, role: "inner",
          geometry: [
            { lon: 0.15, lat: 0.15 },
            { lon: 0.2, lat: 0.15 },
            { lon: 0.15, lat: 0.15 },
          ],
        },
      ],
    },
  ],
} as const;

describe("offline Overpass geometry transforms", () => {
  it("canonicalizes route variants and concurrencies", () => {
    // Given inconsistent tags, when refs are derived, then stable spellings are returned.
    const routes = canonicalizeRouteRefs({
      ref: "IH-35E; US 75; SH-183",
      name: "Dallas North Tollway and President George Bush Turnpike",
    });
    expect(routes).toEqual(["DNT", "I-35E", "PGBT", "SH-183", "US-75"]);
  });

  it("splits a polyline that exits and reenters the bbox", () => {
    // Given an invisible excursion, when clipped, then no fictional connector remains.
    const clipped = clipPolylineToBbox([
      [-0.5, 0.5], [0.5, 0.5], [1.5, 0.5], [0.5, 0.75], [-0.5, 0.75],
    ], FIXTURE_BOUNDS);
    expect(clipped).toEqual([
      [[0, 0.5], [0.5, 0.5], [1, 0.5]],
      [[1, 0.625], [0.5, 0.75], [0, 0.75]],
    ]);
  });

  it("assembles outer fragments and drops relation holes", () => {
    // Given shuffled members, when assembled, then one closed outer ring remains.
    const relation = FIXTURE_RESPONSE.elements[2];
    const rings = assembleOuterRings([...relation.members].reverse());
    expect(rings).toHaveLength(1);
    expect(rings[0]?.at(-1)).toEqual(rings[0]?.[0]);
    expect(rings[0]).toHaveLength(5);
  });

  it("deduplicates reversed geometry while merging memberships", () => {
    // Given reversed duplicates, when normalized, then coordinates ship once with both routes.
    const deduplicated = deduplicateSegments([
      {
        id: "way-2-0", routes: ["I-20"], cls: "interstate",
        points: [[0, 0], [1, 1]], wayId: 2, partIndex: 0,
      },
      {
        id: "way-1-0", routes: ["I-820"], cls: "interstate",
        points: [[1, 1], [0, 0]], wayId: 1, partIndex: 0,
      },
    ]);
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0]?.routes).toEqual(["I-20", "I-820"]);
    expect(deduplicated[0]?.points).toEqual([[0, 0], [1, 1]]);
  });

  it("merges only unbranched segments with identical memberships", () => {
    // Given a same-route chain and a different-route branch, when merged, then only the chain joins.
    const merged = mergeConnectedSegments([
      {
        id: "way-1-0", routes: ["I-30"], cls: "interstate",
        points: [[0, 0], [1, 0]], wayId: 1, partIndex: 0,
      },
      {
        id: "way-2-0", routes: ["I-30"], cls: "interstate",
        points: [[1, 0], [2, 0]], wayId: 2, partIndex: 0,
      },
      {
        id: "way-3-0", routes: ["I-20"], cls: "interstate",
        points: [[1, 0], [1, 1]], wayId: 3, partIndex: 0,
      },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged.find((segment) => segment.routes[0] === "I-30")?.points)
      .toEqual([[0, 0], [1, 0], [2, 0]]);
  });

  it("simplifies within the maximum deviation", () => {
    // Given a curve, when simplified at 60m, then measured displacement stays capped.
    const raw = [
      [-97, 32.7], [-96.9995, 32.7002], [-96.999, 32.7005],
      [-96.9985, 32.7002], [-96.998, 32.7],
    ];
    const simplified = simplifyPolyline(raw, 60);
    expect(maxDeviationMeters(raw, simplified)).toBeLessThanOrEqual(60);
  });

  it("transforms and serializes deterministically without free-form tags", () => {
    // Given one offline response, when reordered and serialized, then output stays safe and stable.
    const options = {
      bounds: FIXTURE_BOUNDS,
      roadToleranceMeters: 20,
      waterToleranceMeters: 100,
      minWaterAreaKm2: 2,
    };
    const first = transformOverpassResponse(FIXTURE_RESPONSE, options);
    const second = transformOverpassResponse(
      { elements: [...FIXTURE_RESPONSE.elements].reverse() }, options,
    );
    const artifact = {
      roadSegments: first.roadSegments,
      water: first.water,
      cameras: [{ id: "CAM-001", lonlat: [0.5, 0.2] }],
      bounds: FIXTURE_BOUNDS,
    };
    const serialized = serializeGeometryData(artifact);
    expect(first).toEqual(second);
    expect(serialized).toBe(serializeGeometryData(artifact));
    expect(serialized).not.toContain("unsafe");
    expect(serialized).not.toContain("compromised");
    expect(first.roadSegments[0]?.routes).toEqual(["I-20", "I-35E", "I-820"]);
    expect(first.water.rings).toHaveLength(1);
  });
});
