import { projectPoint } from "./projection"
import type { GeometrySnapshot, RoadClass } from "./types"

export type CoverageRoadRender = {
  readonly id: string
  readonly points: string
  readonly roadClass: RoadClass
}

export type CoverageCameraRender = {
  readonly id: string
  readonly roadRef: string
  readonly x: number
  readonly y: number
}

export type CoverageRenderModel = {
  readonly attribution: string
  readonly cameras: readonly CoverageCameraRender[]
  readonly capturedAt: string
  readonly height: number
  readonly roads: readonly CoverageRoadRender[]
  readonly width: number
}

export function buildCoverageRenderModel(input: {
  readonly height: number
  readonly padding: number
  readonly snapshot: GeometrySnapshot
  readonly width: number
}): CoverageRenderModel {
  const project = (point: GeometrySnapshot["roads"][number]["points"][number]) =>
    projectPoint({
      bounds: input.snapshot.bounds,
      height: input.height,
      padding: input.padding,
      point,
      width: input.width,
    })

  return {
    attribution: input.snapshot.attribution,
    cameras: input.snapshot.cameras.map((camera) => {
      const point = project(camera.point)
      return { id: camera.id, roadRef: camera.roadRef, x: point.x, y: point.y }
    }),
    capturedAt: input.snapshot.capturedAt,
    height: input.height,
    roads: input.snapshot.roads.map((road) => ({
      id: road.id,
      points: road.points
        .map((point) => {
          const projected = project(point)
          return `${projected.x.toFixed(1)},${projected.y.toFixed(1)}`
        })
        .join(" "),
      roadClass: road.roadClass,
    })),
    width: input.width,
  }
}
