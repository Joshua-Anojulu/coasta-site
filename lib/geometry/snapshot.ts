import {
  BOUNDS,
  CAMERAS,
  ROAD_SEGMENTS,
} from "@/data/dfw-geometry.snapshot"
import type {
  CameraGeometry,
  GeoPoint,
  GeometrySnapshot,
  RoadGeometry,
} from "./types"

const ROUTE_PRIORITY = [
  "I-35E",
  "I-35W",
  "I-30",
  "I-20",
  "I-635",
  "I-820",
  "US-75",
  "DNT",
  "PGBT",
] as const

const roads: readonly RoadGeometry[] = ROAD_SEGMENTS.map((segment) => ({
  id: segment.id,
  points: segment.points,
  roadClass: segment.cls,
  roadRefs: segment.routes,
}))

function firstRoadRef(roadRefs: readonly string[]): string {
  for (const prioritized of ROUTE_PRIORITY) {
    if (roadRefs.includes(prioritized)) {
      return prioritized
    }
  }
  return roadRefs[0] ?? "Road reference pending"
}

function nearestRoadRef(point: GeoPoint): string {
  let nearestDistance = Number.POSITIVE_INFINITY
  let nearestRef = "Road reference pending"

  for (const road of roads) {
    for (const roadPoint of road.points) {
      const longitudeDistance = point[0] - roadPoint[0]
      const latitudeDistance = point[1] - roadPoint[1]
      const distance = longitudeDistance ** 2 + latitudeDistance ** 2
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestRef = firstRoadRef(road.roadRefs)
      }
    }
  }

  return nearestRef
}

const cameras: readonly CameraGeometry[] = CAMERAS.map((camera) => ({
  id: camera.id,
  point: camera.lonlat,
  roadRef: nearestRoadRef(camera.lonlat),
}))

export const DFW_GEOMETRY = {
  attribution: "OpenStreetMap contributors",
  bounds: {
    maxLatitude: BOUNDS.maxLat,
    maxLongitude: BOUNDS.maxLon,
    minLatitude: BOUNDS.minLat,
    minLongitude: BOUNDS.minLon,
  },
  cameras,
  capturedAt: "2026-07-20T00:00:00Z",
  roads,
} satisfies GeometrySnapshot
