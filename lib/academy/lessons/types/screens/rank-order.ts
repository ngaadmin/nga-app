import type { WithDeclarative } from "../declarative";

export type RankOrderItem = {
  id: string;
  label: string;
};

export type RankOrderScreenConfig = WithDeclarative<{
  type: "rank-order";
  id: string;
  intro: string;
  dragHint?: string;
  axisLabel?: string;
  submitLabel?: string;
  items: readonly RankOrderItem[];
  correctOrder: readonly string[];
  /** Keyed by wrong item id at a position, or special keys (e.g. borrow, cheaperTop). */
  errors: Record<string, string>;
  successMessage?: string;
  emphasizeInstruction?: boolean;
}>;
