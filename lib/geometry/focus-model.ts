export type CoverageFocusState = {
  readonly focusedId: string | null
  readonly hoveredId: string | null
  readonly activeId: string | null
}

export type CoverageFocusEvent =
  | { readonly type: "focus"; readonly cameraId: string }
  | { readonly type: "blur"; readonly cameraId: string }
  | { readonly type: "hover"; readonly cameraId: string }
  | { readonly type: "leave"; readonly cameraId: string }
  | { readonly type: "escape" }

export const INITIAL_COVERAGE_FOCUS: CoverageFocusState = {
  activeId: null,
  focusedId: null,
  hoveredId: null,
}

class UnexpectedCoverageFocusEventError extends Error {
  readonly name = "UnexpectedCoverageFocusEventError"

  constructor(readonly event: never) {
    super("Unexpected coverage focus event")
  }
}

export function reduceCoverageFocus(
  state: CoverageFocusState,
  event: CoverageFocusEvent,
): CoverageFocusState {
  switch (event.type) {
    case "focus": {
      return {
        activeId: state.hoveredId ?? event.cameraId,
        focusedId: event.cameraId,
        hoveredId: state.hoveredId,
      }
    }
    case "blur": {
      const focusedId = state.focusedId === event.cameraId ? null : state.focusedId
      return {
        activeId: state.hoveredId ?? focusedId,
        focusedId,
        hoveredId: state.hoveredId,
      }
    }
    case "hover": {
      return {
        activeId: event.cameraId,
        focusedId: state.focusedId,
        hoveredId: event.cameraId,
      }
    }
    case "leave": {
      const hoveredId = state.hoveredId === event.cameraId ? null : state.hoveredId
      return {
        activeId: hoveredId ?? state.focusedId,
        focusedId: state.focusedId,
        hoveredId,
      }
    }
    case "escape":
      return INITIAL_COVERAGE_FOCUS
    default:
      throw new UnexpectedCoverageFocusEventError(event)
  }
}
