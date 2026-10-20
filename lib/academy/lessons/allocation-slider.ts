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

/**
 * How the settings cell scores the slider.
 * `at-least` comes from a KEEP line (save this much or more).
 * `exact` is a move or pay line with one dollar amount.
 */
export type AllocationMatch = "exact" | "at-least";

/**
 * Exact screens unlock only on the target amount.
 * KEEP screens unlock on the target or anything above it.
 */
export function allocationNextEnabled(
  save: number,
  targetMin: number,
  match: AllocationMatch = "exact",
): boolean {
  if (!Number.isFinite(save) || !Number.isFinite(targetMin)) return false;
  const saved = Math.round(save);
  const target = Math.max(0, Math.round(targetMin));
  if (match === "at-least") return saved >= target;
  return saved === target;
}

export function allocationSavedBadge(targetMin: number): string {
  return `🔒 $${Math.max(0, Math.round(targetMin))} saved!`;
}

/** Under-track caption. KEEP reads "$20+". A move or pay line stays a single amount. */
export function allocationGoalCaption(
  targetMin: number,
  match: AllocationMatch = "at-least",
): string {
  const target = Math.max(0, Math.round(targetMin));
  return match === "at-least" ? `🎯 $${target}+` : `🎯 $${target}`;
}

/** Spoken value for the slider. Over-saving a KEEP goal is still "goal met". */
export function allocationSliderValueText(
  save: number,
  targetMin: number,
  match: AllocationMatch = "exact",
): string {
  const saved = Math.round(save);
  const target = Math.max(0, Math.round(targetMin));
  const met = allocationNextEnabled(saved, target, match);
  if (match === "at-least") {
    return met
      ? `$${saved} saved, goal is at least $${target}, goal met`
      : `$${saved} saved, goal is at least $${target}`;
  }
  return met
    ? `$${saved} saved, goal is $${target}, goal met`
    : `$${saved} saved, goal is $${target}`;
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
