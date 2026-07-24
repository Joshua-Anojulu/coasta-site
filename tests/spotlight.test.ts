import { describe, expect, it } from "vitest";
import {
  deriveSpotlightId,
  initialSpotlightState,
  spotlightReducer,
  type SpotlightState,
} from "@/lib/hero/spotlight";

describe("spotlight reducer", () => {
  it("derives null when nothing is hovered, focused, or pinned", () => {
    // Given the initial state, when derived, then no spotlight is active.
    expect(deriveSpotlightId(initialSpotlightState)).toBeNull();
  });

  it("sets hoveredId on hover and derives it as the spotlight", () => {
    // Given a hover action, when applied, then hover drives the spotlight.
    const s = spotlightReducer(initialSpotlightState, { type: "hover", id: "CAM-114" });
    expect(s.hoveredId).toBe("CAM-114");
    expect(deriveSpotlightId(s)).toBe("CAM-114");
  });

  it("clears hoveredId on unhover for the matching id only", () => {
    // Given a hovered camera, when a different id unhovers, then hover is untouched.
    const hovered = spotlightReducer(initialSpotlightState, { type: "hover", id: "CAM-114" });
    const untouched = spotlightReducer(hovered, { type: "unhover", id: "CAM-207" });
    expect(untouched.hoveredId).toBe("CAM-114");

    const cleared = spotlightReducer(hovered, { type: "unhover", id: "CAM-114" });
    expect(cleared.hoveredId).toBeNull();
  });

  it("toggles pinnedId on repeated toggle-pin for the same id", () => {
    // Given a pin toggle, when repeated for the same camera, then it unpins.
    const pinned = spotlightReducer(initialSpotlightState, { type: "toggle-pin", id: "CAM-114" });
    expect(pinned.pinnedId).toBe("CAM-114");
    const unpinned = spotlightReducer(pinned, { type: "toggle-pin", id: "CAM-114" });
    expect(unpinned.pinnedId).toBeNull();
  });

  it("switches pinnedId when a different camera is toggled", () => {
    // Given one pinned camera, when another is toggled, then the pin moves.
    const first = spotlightReducer(initialSpotlightState, { type: "toggle-pin", id: "CAM-114" });
    const second = spotlightReducer(first, { type: "toggle-pin", id: "CAM-207" });
    expect(second.pinnedId).toBe("CAM-207");
  });

  it("keeps a pinned selection when hover leaves (pinned survives leave)", () => {
    // Given a pinned camera, when a hover starts and ends elsewhere, then pin holds.
    const pinned = spotlightReducer(initialSpotlightState, { type: "toggle-pin", id: "CAM-114" });
    const hovered = spotlightReducer(pinned, { type: "hover", id: "CAM-207" });
    const left = spotlightReducer(hovered, { type: "unhover", id: "CAM-207" });
    expect(left.pinnedId).toBe("CAM-114");
    expect(deriveSpotlightId(left)).toBe("CAM-114");
  });

  it("keeps a pinned selection when focus blurs (pinned survives blur)", () => {
    // Given a pinned camera, when it is focused then blurred, then pin holds.
    const pinned = spotlightReducer(initialSpotlightState, { type: "toggle-pin", id: "CAM-114" });
    const focused = spotlightReducer(pinned, { type: "focus", id: "CAM-114" });
    const blurred = spotlightReducer(focused, { type: "blur", id: "CAM-114" });
    expect(blurred.pinnedId).toBe("CAM-114");
    expect(deriveSpotlightId(blurred)).toBe("CAM-114");
  });

  it("clears pinnedId on escape", () => {
    // Given a pinned camera, when escape is dispatched, then the pin clears.
    const pinned = spotlightReducer(initialSpotlightState, { type: "toggle-pin", id: "CAM-114" });
    const escaped = spotlightReducer(pinned, { type: "escape" });
    expect(escaped.pinnedId).toBeNull();
  });

  it("clears pinnedId on outside-tap", () => {
    // Given a pinned camera, when an outside tap is dispatched, then the pin clears.
    const pinned = spotlightReducer(initialSpotlightState, { type: "toggle-pin", id: "CAM-114" });
    const tapped = spotlightReducer(pinned, { type: "outside-tap" });
    expect(tapped.pinnedId).toBeNull();
  });

  it("clears only hoveredId on pointercancel", () => {
    // Given hover and focus both set, when pointercancel fires, then only hover clears.
    const hovered = spotlightReducer(initialSpotlightState, { type: "hover", id: "CAM-114" });
    const focused = spotlightReducer(hovered, { type: "focus", id: "CAM-207" });
    const cancelled = spotlightReducer(focused, { type: "pointercancel" });
    expect(cancelled.hoveredId).toBeNull();
    expect(cancelled.focusedId).toBe("CAM-207");
  });

  it("derives pinned over hovered over focused", () => {
    // Given all three set, when derived, then priority is pinned > hovered > focused.
    const state: SpotlightState = { hoveredId: "A", focusedId: "B", pinnedId: "C" };
    expect(deriveSpotlightId(state)).toBe("C");
    expect(deriveSpotlightId({ ...state, pinnedId: null })).toBe("A");
    expect(deriveSpotlightId({ ...state, pinnedId: null, hoveredId: null })).toBe("B");
  });
});
