export type DropRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type DragBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Padding around a destination so a near miss still counts. */
export const GENEROUS_DROP_PAD_PX = 48;

/** Share of the dragged item that must sit over the destination. */
export const DROP_OVERLAP_RATIO = 0.18;

export function expandRect(rect: DropRect, pad: number): DropRect {
  return {
    left: rect.left - pad,
    top: rect.top - pad,
    right: rect.right + pad,
    bottom: rect.bottom + pad,
  };
}

export function pointerInRect(x: number, y: number, rect: DropRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function overlapRatio(drag: DragBounds, zone: DropRect): number {
  const overlapW =
    Math.min(drag.x + drag.width, zone.right) - Math.max(drag.x, zone.left);
  const overlapH =
    Math.min(drag.y + drag.height, zone.bottom) - Math.max(drag.y, zone.top);
  if (overlapW <= 0 || overlapH <= 0) return 0;
  const area = Math.max(1, drag.width * drag.height);
  return (overlapW * overlapH) / area;
}

/**
 * A drop sticks when the pointer is inside the padded destination, or when
 * enough of the dragged item overlaps that destination.
 */
export function dragHitsZone(
  drag: DragBounds | null,
  pointerX: number,
  pointerY: number,
  zone: DropRect,
  pad = GENEROUS_DROP_PAD_PX,
): boolean {
  const expanded = expandRect(zone, pad);
  if (pointerInRect(pointerX, pointerY, expanded)) return true;
  if (!drag) return false;
  return overlapRatio(drag, expanded) >= DROP_OVERLAP_RATIO;
}

function distanceToRect(x: number, y: number, rect: DropRect): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

/**
 * Pick the destination the pointer or the dragged item covers most.
 * Padded zones can overlap when blanks sit close together (two blanks on
 * neighboring lines), so the zone the pointer is really over wins, then
 * the zone nearest the pointer.
 */
export function bestDropZone<T>(
  zones: readonly { id: T; rect: DropRect }[],
  drag: DragBounds | null,
  pointerX: number,
  pointerY: number,
  pad = GENEROUS_DROP_PAD_PX,
): T | null {
  let best: { id: T; score: number; distance: number } | null = null;
  for (const zone of zones) {
    const expanded = expandRect(zone.rect, pad);
    const pointerHit = pointerInRect(pointerX, pointerY, expanded);
    const overlap = drag ? overlapRatio(drag, expanded) : 0;
    if (!pointerHit && overlap < DROP_OVERLAP_RATIO) continue;
    const direct = pointerInRect(pointerX, pointerY, zone.rect);
    const distance = distanceToRect(pointerX, pointerY, zone.rect);
    const score = (direct ? 4 : 0) + (pointerHit ? 2 : 0) + overlap;
    const better =
      !best ||
      score > best.score + 1e-9 ||
      (Math.abs(score - best.score) <= 1e-9 && distance < best.distance);
    if (better) best = { id: zone.id, score, distance };
  }
  return best?.id ?? null;
}

export function domRectToDropRect(rect: DOMRect): DropRect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
}
