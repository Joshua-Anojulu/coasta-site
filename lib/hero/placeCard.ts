export type Point = { readonly x: number; readonly y: number };
export type Size = { readonly width: number; readonly height: number };

/**
 * Clamps and flips a card's placement relative to an anchor point (a hero
 * hotspot node) so it never overflows the viewport. Prefers below-right of
 * the anchor; flips to the opposite side on either axis when the default
 * placement would overflow that edge, then clamps fully inside the
 * viewport as a last resort (e.g. a viewport smaller than the card).
 */
export function placeCard(anchor: Point, card: Size, viewport: Size, gap = 12): Point {
  let x = anchor.x + gap;
  if (x + card.width > viewport.width) x = anchor.x - gap - card.width;

  let y = anchor.y + gap;
  if (y + card.height > viewport.height) y = anchor.y - gap - card.height;

  const maxX = Math.max(0, viewport.width - card.width);
  const maxY = Math.max(0, viewport.height - card.height);
  return {
    x: Math.min(Math.max(x, 0), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  };
}
