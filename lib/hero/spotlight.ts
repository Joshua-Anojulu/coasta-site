// Pure spotlight state reducer for the Hero camera hotspot layer. Hover,
// focus, and pin are tracked separately so pinned survives hover-leave and
// blur (see docs/DESIGN.md section 9.3's keyboard behavior map); the derived
// spotlightId is what Hero passes to MapCanvas's controlled spotlightId prop.

export type SpotlightState = {
  readonly hoveredId: string | null;
  readonly focusedId: string | null;
  readonly pinnedId: string | null;
};

export const initialSpotlightState: SpotlightState = {
  hoveredId: null,
  focusedId: null,
  pinnedId: null,
};

export type SpotlightAction =
  | { type: "hover"; id: string }
  | { type: "unhover"; id: string }
  | { type: "focus"; id: string }
  | { type: "blur"; id: string }
  | { type: "toggle-pin"; id: string }
  | { type: "escape" }
  | { type: "outside-tap" }
  | { type: "pointercancel" };

export function spotlightReducer(state: SpotlightState, action: SpotlightAction): SpotlightState {
  switch (action.type) {
    case "hover":
      return state.hoveredId === action.id ? state : { ...state, hoveredId: action.id };
    case "unhover":
      return state.hoveredId === action.id ? { ...state, hoveredId: null } : state;
    case "focus":
      return state.focusedId === action.id ? state : { ...state, focusedId: action.id };
    case "blur":
      return state.focusedId === action.id ? { ...state, focusedId: null } : state;
    case "toggle-pin":
      return { ...state, pinnedId: state.pinnedId === action.id ? null : action.id };
    case "escape":
    case "outside-tap":
      return state.pinnedId === null ? state : { ...state, pinnedId: null };
    case "pointercancel":
      return state.hoveredId === null ? state : { ...state, hoveredId: null };
    default:
      return state;
  }
}

export function deriveSpotlightId(state: SpotlightState): string | null {
  return state.pinnedId ?? state.hoveredId ?? state.focusedId;
}
