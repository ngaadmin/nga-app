import type { WithDeclarative } from "../declarative";
import type { TapRevealBucket, TapRevealItem } from "../shared-blocks";

export type TapRevealScreenConfig<TBucket extends string = string> = WithDeclarative<{
  type: "tap-reveal";
  id: string;
  intro: string;
  items: readonly TapRevealItem<TBucket>[];
  buckets: readonly TapRevealBucket<TBucket>[];
  successMessage?: string;
  /** Tap chips: emoji-only, label-only, or emoji + label (Explorer). Default emoji-label. */
  tapDisplay?: "emoji-only" | "emoji-label" | "label";
  /** Sorted bucket lists: emoji-only, label-only, or emoji + label. Default emoji-label. */
  revealDisplay?: "emoji-only" | "emoji-label" | "label";
  /** icon-grid = large icons with labels below; default = compact tiles. */
  tapLayout?: "default" | "icon-grid";
  /** neutral = sunken highlight only; colored = green/red selection (default). */
  selectionFeedback?: "neutral" | "colored";
  /** Render intro in bold instruction style. */
  emphasizeInstruction?: boolean;
}>;
