import { describe, expect, it } from "vitest"
import { placeDetectionLabel } from "@/lib/detection/placement"

describe("placeDetectionLabel", () => {
  it("places a label above the detection when it fits", () => {
    // Given
    const input = {
      detection: { height: 80, width: 120, x: 200, y: 160 },
      frame: { height: 360, width: 640 },
      gap: 8,
      label: { height: 24, width: 160 },
    } as const

    // When
    const placement = placeDetectionLabel(input)

    // Then
    expect(placement).toEqual({ x: 200, y: 128 })
  })

  it("clamps the label inside the frame at the top-right edge", () => {
    // Given
    const input = {
      detection: { height: 80, width: 120, x: 580, y: 6 },
      frame: { height: 360, width: 640 },
      gap: 8,
      label: { height: 24, width: 160 },
    } as const

    // When
    const placement = placeDetectionLabel(input)

    // Then
    expect(placement).toEqual({ x: 480, y: 94 })
  })
})
