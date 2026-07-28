import type { WithDeclarative } from "../declarative";
import type { TapRevealBucket, TapRevealItem } from "../shared-blocks";

export type TapRevealScreenConfig<TBucket extends string = string> = WithDeclarative<{
  type: "tap-reveal";
  id: string;
  intro: string;
  items: readonly TapRevealItem<TBucket>[];
  buckets: readonly TapRevealBucket<TBucket>[];
  successMessage?: string;
  /**
   * @deprecated Ignored — tap-reveal always renders emoji + label (see TapRevealScreen).
   */
  tapDisplay?: "emoji-only" | "emoji-label" | "label";
  /**
   * @deprecated Ignored — reveal buckets always render emoji + label (see TapRevealScreen).
   */
  revealDisplay?: "emoji-only" | "emoji-label" | "label";
  /** icon-grid = large icons with labels below; default = compact tiles. */
  tapLayout?: "default" | "icon-grid";
  /** neutral = sunken highlight only; colored = green/red selection (default). */
  selectionFeedback?: "neutral" | "colored";
  /** Render intro in bold instruction style. */
  emphasizeInstruction?: boolean;
}>;
