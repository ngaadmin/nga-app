/** Save grows from the left. Spend is whatever is left over. */
export function clampSaveAmount(amount: number, total: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(total, Math.max(0, Math.round(amount)));
}

/**
 * Map a pointer on the track to a save amount.
 * The left edge is $0 saved. The right edge is the full total saved.
 */
export function saveAmountFromClientX(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  total: number,
): number {
  if (!Number.isFinite(trackWidth) || trackWidth <= 0 || total <= 0) return 0;
  const ratio = (clientX - trackLeft) / trackWidth;
  const clamped = Math.min(1, Math.max(0, ratio));
  return clampSaveAmount(clamped * total, total);
}

/** Next turns on once the saved amount covers the need. Spending the rest is fine. */
export function allocationNextEnabled(save: number, targetMin: number): boolean {
  if (!Number.isFinite(save)) return false;
  return Math.round(save) >= Math.max(0, Math.round(targetMin));
}

export function allocationSavedBadge(targetMin: number): string {
  return `🔒 $${Math.max(0, Math.round(targetMin))} saved!`;
}

/** Knob diameter. The track is inset by half of this so the knob stays on the bar. */
export const ALLOCATION_KNOB_PX = 44;

export function allocationTrackInsetPx(knobPx = ALLOCATION_KNOB_PX): number {
  return knobPx / 2;
}

/** One marker, sitting on the bar where the knob has to land. */
export function allocationTargetMarker(targetMin: number): string {
  return `Save $${Math.max(0, Math.round(targetMin))} 🎯`;
}
