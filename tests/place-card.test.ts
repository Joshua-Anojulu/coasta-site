import { describe, expect, it } from "vitest";
import { placeCard } from "@/lib/hero/placeCard";

describe("placeCard", () => {
  const viewport = { width: 400, height: 300 };
  const card = { width: 100, height: 60 };

  it("places below-right of the anchor by default", () => {
    // Given room on every side, when placed, then it sits gap-offset below-right.
    const pos = placeCard({ x: 50, y: 50 }, card, viewport, 10);
    expect(pos).toEqual({ x: 60, y: 60 });
  });

  it("flips to the left when the default placement overflows the right edge", () => {
    // Given an anchor near the right edge, when placed, then it flips left of the anchor.
    const pos = placeCard({ x: 380, y: 50 }, card, viewport, 10);
    expect(pos.x).toBe(380 - 10 - card.width);
  });

  it("flips upward when the default placement overflows the bottom edge", () => {
    // Given an anchor near the bottom edge, when placed, then it flips above the anchor.
    const pos = placeCard({ x: 50, y: 280 }, card, viewport, 10);
    expect(pos.y).toBe(280 - 10 - card.height);
  });

  it("clamps inside the viewport when both flips still overflow", () => {
    // Given a viewport smaller than the card, when placed, then it clamps to the origin.
    const pos = placeCard({ x: 5, y: 5 }, card, { width: 60, height: 40 }, 10);
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
  });

  it("never places the card partially off the right or bottom edge when it fits", () => {
    // Given a mid-viewport anchor, when placed, then the card stays fully inside.
    const pos = placeCard({ x: 200, y: 150 }, card, viewport, 10);
    expect(pos.x + card.width).toBeLessThanOrEqual(viewport.width);
    expect(pos.y + card.height).toBeLessThanOrEqual(viewport.height);
  });
});
