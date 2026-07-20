import type { WithDeclarative } from "../declarative";

export type HoldToFillScreenConfig = WithDeclarative<{
  type: "hold-to-fill";
  id: string;
  narrative: string;
  holdLabel: string;
  frozenLabel: string;
  successMessage: string;
  /** When true, success message replaces the entire screen UI */
  clearOnSuccess?: boolean;
  holdDurationMs?: number;
  releaseHint?: string;
}>;
