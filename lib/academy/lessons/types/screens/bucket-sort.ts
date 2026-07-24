import type { WithDeclarative } from "../declarative";
import type { SortBucket, SortItem } from "../shared-blocks";

export type BucketSortScreenConfig<TBucket extends string = string> = WithDeclarative<{
  type: "bucket-sort";
  id: string;
  intro: string;
  buckets: readonly SortBucket<TBucket>[];
  items: readonly SortItem<TBucket>[];
  successMessage?: string;
  /** Bold heading above the intro (e.g. "Wants or Needs?"). */
  title?: string;
  /** Two-column layout with running spent total (L3 Screen 2). */
  layout?: "default" | "spent-total" | "steps-row" | "stable-grid" | "statement-sort";
  /** Expected total when all items are sorted (shown in spent-total header). */
  targetTotal?: number;
  /** Left-column heading for spent-total layout (e.g. "Holly's purchases"). */
  poolColumnLabel?: string;
  emphasizeInstruction?: boolean;
}>;
