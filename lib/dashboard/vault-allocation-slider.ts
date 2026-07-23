import {
  resolveVaultSliderDampening,
  roundToSliderStep,
  VAULT_SLIDER_STEP,
} from "@/lib/dashboard/vault-amount-input";

/** Half-width of the 28px slider thumb — keeps thumb inside the track bounds. */
export const VAULT_SLIDER_THUMB_INSET_PX = 14;

type PointerValueOptions = {
  thumbInsetPx?: number;
  /** Full pool total — track position maps to this scale (defaults to sliderMax). */
  poolTotal?: number;
};

export function pointerValueFromClientX(
  clientX: number,
  rect: DOMRect,
  sliderMax: number,
  previousValue: number,
  mode: "direct" | "dampened",
  options: PointerValueOptions = {},
): number {
  const poolTotal = options.poolTotal ?? sliderMax;
  if (poolTotal <= 0 || sliderMax <= 0) return 0;

  const thumbInsetPx = options.thumbInsetPx ?? VAULT_SLIDER_THUMB_INSET_PX;
  const dampening = resolveVaultSliderDampening(poolTotal);
  const usableLeft = rect.left + thumbInsetPx;
  const usableWidth = Math.max(1, rect.width - thumbInsetPx * 2);
  const ratio = Math.min(1, Math.max(0, (clientX - usableLeft) / usableWidth));
  const raw = ratio * poolTotal;

  let next = mode === "direct" ? raw : previousValue + (raw - previousValue) * dampening;
  next = Math.min(Math.max(0, next), sliderMax);
  return roundToSliderStep(next, VAULT_SLIDER_STEP);
}

export { roundToSliderStep };
