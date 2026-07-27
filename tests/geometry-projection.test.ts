import { describe, expect, it } from "vitest"
import { projectPoint } from "@/lib/geometry/projection"
import type { GeometryBounds } from "@/lib/geometry/types"

const bounds: GeometryBounds = {
  maxLatitude: 33,
  maxLongitude: -96,
  minLatitude: 32,
  minLongitude: -98,
}

describe("projectPoint", () => {
  it("projects the north-west and south-east bounds into the padded viewport", () => {
    // Given
    const viewport = { bounds, height: 500, padding: 20, width: 1000 } as const

    // When
    const northWest = projectPoint({ ...viewport, point: [-98, 33] })
    const southEast = projectPoint({ ...viewport, point: [-96, 32] })

    // Then
    expect(northWest.x).toBeCloseTo(20)
    expect(northWest.y).toBeCloseTo(20)
    expect(southEast.x).toBeCloseTo(980)
    expect(southEast.y).toBeCloseTo(480)
  })

  it("projects the geographic center to the visual center", () => {
    // Given
    const viewport = { bounds, height: 500, padding: 20, width: 1000 } as const

    // When
    const center = projectPoint({ ...viewport, point: [-97, 32.5] })

    // Then
    expect(center).toEqual({ x: 500, y: 250 })
  })
})
