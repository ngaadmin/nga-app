import {
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

/** Drag follow strength — lower values make large pools easier to tune precisely. */
export function resolveVaultSliderDampening(poolTotal: number): number {
  if (poolTotal <= 10) return 0.62;
  if (poolTotal <= 30) return 0.38;
  if (poolTotal <= 80) return 0.24;
  if (poolTotal <= 200) return 0.16;
  return 0.12;
}

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

  const next =
    mode === "direct" ? raw : previousValue + (raw - previousValue) * dampening;
  return Math.min(Math.max(0, next), sliderMax);
}

export function pointerValueFromClientXStepped(
  clientX: number,
  rect: DOMRect,
  sliderMax: number,
  previousValue: number,
  mode: "direct" | "dampened",
  options: PointerValueOptions = {},
): number {
  return roundToSliderStep(
    pointerValueFromClientX(clientX, rect, sliderMax, previousValue, mode, options),
    VAULT_SLIDER_STEP,
  );
}

export { roundToSliderStep };
