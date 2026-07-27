export type GeoPoint = readonly [longitude: number, latitude: number]

export type GeometryBounds = {
  readonly minLongitude: number
  readonly maxLongitude: number
  readonly minLatitude: number
  readonly maxLatitude: number
}

export type RoadClass = "interstate" | "us" | "state" | "loop" | "tollway"

export type RoadGeometry = {
  readonly id: string
  readonly roadRefs: readonly string[]
  readonly roadClass: RoadClass
  readonly points: readonly GeoPoint[]
}

export type CameraGeometry = {
  readonly id: string
  readonly roadRef: string
  readonly point: GeoPoint
}

export type GeometrySnapshot = {
  readonly capturedAt: string
  readonly attribution: string
  readonly bounds: GeometryBounds
  readonly roads: readonly RoadGeometry[]
  readonly cameras: readonly CameraGeometry[]
}

export type ProjectedPoint = {
  readonly x: number
  readonly y: number
}
