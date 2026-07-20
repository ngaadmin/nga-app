import type { WithDeclarative } from "../declarative";

/**
 * Bespoke interaction — rendered via global custom renderer registry.
 * Config lives in screen `authoring` + lesson `custom` bag keyed by `configRef` or `id`.
 */
export type CustomScreenConfig = WithDeclarative<{
  type: "custom";
  id: string;
  renderer: string;
  /** Key into lesson `custom` bag (defaults to screen id) */
  configRef?: string;
}>;
