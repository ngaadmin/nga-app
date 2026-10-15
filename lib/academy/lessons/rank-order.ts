/** True when every id sits in the authored correct position. */
export function rankOrderMatches(
  order: readonly string[],
  correctOrder: readonly string[],
): boolean {
  return (
    order.length === correctOrder.length &&
    correctOrder.length > 0 &&
    order.every((id, index) => id === correctOrder[index])
  );
}
