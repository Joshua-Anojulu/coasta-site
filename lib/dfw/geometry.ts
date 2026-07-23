import {
  BOUNDS as GENERATED_BOUNDS,
  CAMERAS as GENERATED_CAMERAS,
  ROAD_SEGMENTS as GENERATED_ROAD_SEGMENTS,
  WATER as GENERATED_WATER,
} from "./geometry-data";

export type LonLat = readonly [number, number];
export type RoadClass = "interstate" | "us" | "state" | "loop" | "tollway";
export type RoadSegment = {
  readonly id: string;
  readonly routes: readonly string[];
  readonly cls: RoadClass;
  readonly points: readonly LonLat[];
};

export const ROAD_SEGMENTS: readonly RoadSegment[] = GENERATED_ROAD_SEGMENTS;
export const WATER: { readonly rings: readonly (readonly LonLat[])[] } = GENERATED_WATER;
export const CAMERAS: readonly { readonly id: string; readonly lonlat: LonLat }[] =
  GENERATED_CAMERAS;
export const BOUNDS: {
  readonly minLon: number;
  readonly maxLon: number;
  readonly minLat: number;
  readonly maxLat: number;
} = GENERATED_BOUNDS;

const DALLAS_FOCUS = {
  minLon: -97.05,
  maxLon: -96.55,
  minLat: 32.55,
  maxLat: 33.05,
} as const;

export function project(
  [lon, lat]: LonLat,
  width: number,
  height: number,
  pad = 8,
): [number, number] {
  const wide = width / height >= 1.5;
  const viewport = wide ? BOUNDS : DALLAS_FOCUS;
  const centerLon = (viewport.minLon + viewport.maxLon) / 2;
  const centerLat = (viewport.minLat + viewport.maxLat) / 2;
  const lonFactor = Math.cos((centerLat * Math.PI) / 180);
  const projectedWidth = (viewport.maxLon - viewport.minLon) * lonFactor;
  const projectedHeight = viewport.maxLat - viewport.minLat;
  const scaleX = (width - pad * 2) / projectedWidth;
  const scaleY = (height - pad * 2) / projectedHeight;
  const scale = wide ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
  return [
    width / 2 + (lon - centerLon) * lonFactor * scale,
    height / 2 - (lat - centerLat) * scale,
  ];
}
