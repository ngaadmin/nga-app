export type DragPointer = {
  x: number;
  y: number;
};

/** Where the finger grabbed the element, and where that element's corner was. */
export type DragOrigin = {
  pointerX: number;
  pointerY: number;
  left: number;
  top: number;
};

/**
 * Place a dragged element from the grab point.
 * No pointer movement returns the original corner. A move shifts that corner
 * by the same delta, so the finger stays the same distance from the corner.
 */
export function dragPositionFromPointer(
  origin: DragOrigin,
  pointer: DragPointer,
): { x: number; y: number } {
  return {
    x: origin.left + (pointer.x - origin.pointerX),
    y: origin.top + (pointer.y - origin.pointerY),
  };
}
