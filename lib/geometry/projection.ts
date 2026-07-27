import type { GeoPoint, GeometryBounds, ProjectedPoint } from "./types"

export function projectPoint(input: {
  readonly point: GeoPoint
  readonly bounds: GeometryBounds
  readonly width: number
  readonly height: number
  readonly padding: number
}): ProjectedPoint {
  const [longitude, latitude] = input.point
  const usableWidth = input.width - input.padding * 2
  const usableHeight = input.height - input.padding * 2
  const longitudeRange = input.bounds.maxLongitude - input.bounds.minLongitude
  const latitudeRange = input.bounds.maxLatitude - input.bounds.minLatitude
  const xRatio = (longitude - input.bounds.minLongitude) / longitudeRange
  const yRatio = (input.bounds.maxLatitude - latitude) / latitudeRange

  return {
    x: input.padding + xRatio * usableWidth,
    y: input.padding + yRatio * usableHeight,
  }
}
