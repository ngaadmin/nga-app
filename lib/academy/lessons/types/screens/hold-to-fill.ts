import type { WithDeclarative } from "../declarative";

export type HoldToFillScreenConfig = WithDeclarative<{
  type: "hold-to-fill";
  id: string;
  narrative: string;
  holdLabel: string;
  frozenLabel: string;
  successMessage: string;
  holdDurationMs?: number;
  releaseHint?: string;
}>;
