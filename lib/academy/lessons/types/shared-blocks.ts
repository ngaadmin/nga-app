export type SortBucketTone =
  | "rush"
  | "think"
  | "want"
  | "need"
  | "short"
  | "long";

export type SortBucket<TBucket extends string = string> = {
  id: TBucket;
  label: string;
  /** Visual accent for statement-sort buckets. Inferred from id when omitted. */
  tone?: SortBucketTone;
  /** Header emoji — defaults from tone when omitted. */
  icon?: string;
};

export type SortItem<TBucket extends string = string> = {
  id: string;
  emoji?: string;
  label: string;
  bucket: TBucket;
  price?: number;
  wrongDropError?: string;
};

export type TapRevealItem<TBucket extends string = string> = {
  id: string;
  label: string;
  emoji?: string;
  bucket: TBucket;
};

export type TapRevealBucket<TBucket extends string = string> = {
  id: TBucket;
  label: string;
  tone: "short" | "long" | "want" | "need";
};
