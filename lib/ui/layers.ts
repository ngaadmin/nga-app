/**
 * Centralized stacking context for the NGA app.
 * Prefer Tailwind utilities (`z-chrome`, `z-overlay`, …) in components.
 * Use `Z` when inline styles or programmatic stacking is required.
 */
export const Z = {
  base: 0,
  raised: 10,
  sticky: 20,
  chrome: 40,
  overlay: 50,
  modal: 60,
  toast: 70,
  dev: 80,
} as const;

export type LayerToken = keyof typeof Z;

export const LAYER_ROOT_IDS = {
  overlay: "overlay-root",
  modal: "modal-root",
  toast: "toast-root",
} as const;

export type LayerRootId = (typeof LAYER_ROOT_IDS)[keyof typeof LAYER_ROOT_IDS];
