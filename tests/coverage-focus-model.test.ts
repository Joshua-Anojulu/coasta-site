import { describe, expect, it } from "vitest"
import {
  INITIAL_COVERAGE_FOCUS,
  reduceCoverageFocus,
} from "@/lib/geometry/focus-model"

describe("reduceCoverageFocus", () => {
  it("lets hover temporarily override keyboard focus", () => {
    // Given
    const focused = reduceCoverageFocus(INITIAL_COVERAGE_FOCUS, {
      cameraId: "CAM-021",
      type: "focus",
    })

    // When
    const hovered = reduceCoverageFocus(focused, {
      cameraId: "CAM-114",
      type: "hover",
    })

    // Then
    expect(hovered).toEqual({
      activeId: "CAM-114",
      focusedId: "CAM-021",
      hoveredId: "CAM-114",
    })
  })

  it("returns to the focused camera when hover leaves", () => {
    // Given
    const state = {
      activeId: "CAM-114",
      focusedId: "CAM-021",
      hoveredId: "CAM-114",
    } as const

    // When
    const next = reduceCoverageFocus(state, {
      cameraId: "CAM-114",
      type: "leave",
    })

    // Then
    expect(next.activeId).toBe("CAM-021")
  })

  it("clears hover and focus on Escape", () => {
    // Given
    const state = {
      activeId: "CAM-114",
      focusedId: "CAM-021",
      hoveredId: "CAM-114",
    } as const

    // When
    const next = reduceCoverageFocus(state, { type: "escape" })

    // Then
    expect(next).toEqual(INITIAL_COVERAGE_FOCUS)
  })
})
