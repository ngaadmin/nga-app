/** WebP has transparent padding — box is larger so the coin body matches the node. */
export const PENNY_JOURNEY_SIZE_PX = 126;
/** Keep Penny outside the 8px pulse ring. */
export const PENNY_NODE_GAP_PX = 8;
/** Stay inside the map so overflow-x clipping cannot eat the artwork. */
export const PENNY_EDGE_INSET_PX = 4;

export type PennyPlacement = {
  leftPx: number;
  topPx: number;
  /** True when the lesson tile sits to Penny's right (she stands on the left). */
  nodeOnRight: boolean;
};

/**
 * Seat Penny beside a lesson tile, fully inside the track.
 * Prefer the left side. Use the right side only when the left side would
 * leave the map. If neither side fits, clamp her inside the track.
 */
export function placePennyBesideNode(input: {
  slotWidth: number;
  nodeLeft: number;
  nodeTop: number;
  nodeWidth: number;
  nodeHeight: number;
  pennySize?: number;
}): PennyPlacement {
  const penny = input.pennySize ?? PENNY_JOURNEY_SIZE_PX;
  const gap = PENNY_NODE_GAP_PX;
  const inset = Math.min(PENNY_EDGE_INSET_PX, Math.max(0, (input.slotWidth - penny) / 2));
  const minLeft = inset;
  const maxLeft = Math.max(minLeft, input.slotWidth - inset - penny);
  const nodeRight = input.nodeLeft + input.nodeWidth;
  const leftCandidate = input.nodeLeft - gap - penny;
  const rightCandidate = nodeRight + gap;

  const fits = (left: number) => left >= minLeft - 0.5 && left <= maxLeft + 0.5;

  let leftPx: number;
  let nodeOnRight: boolean;
  if (fits(leftCandidate)) {
    leftPx = leftCandidate;
    nodeOnRight = true;
  } else if (fits(rightCandidate)) {
    leftPx = rightCandidate;
    nodeOnRight = false;
  } else {
    const spaceLeft = input.nodeLeft;
    const spaceRight = input.slotWidth - nodeRight;
    nodeOnRight = spaceLeft >= spaceRight;
    leftPx = nodeOnRight ? leftCandidate : rightCandidate;
  }

  return {
    leftPx: Math.min(maxLeft, Math.max(minLeft, leftPx)),
    topPx: input.nodeTop + input.nodeHeight / 2,
    nodeOnRight,
  };
}
