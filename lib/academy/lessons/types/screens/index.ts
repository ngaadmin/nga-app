export type { BinaryChoiceOption, BinaryChoiceScreenConfig } from "./binary-choice";
export type { BucketSortScreenConfig } from "./bucket-sort";
export type { CompletionScreenConfig } from "./completion";
export type { CustomScreenConfig } from "./custom";
export type { DragToTargetScreenConfig } from "./drag-to-target";
export type { HoldToFillScreenConfig } from "./hold-to-fill";
export type { LinkMatchPair, LinkMatchScreenConfig } from "./link-match";
export type { NarrativeBonusScreenConfig } from "./narrative-bonus";
export type { SavingsGoalItem, SavingsGoalScreenConfig } from "./savings-goal";
export type { SpotlightRoundsScreenConfig } from "./spotlight-rounds";
export type { TapRevealScreenConfig } from "./tap-reveal";
export type { TrueFalseScreenConfig } from "./true-false";
export type { WordDropScreenConfig } from "./word-drop";

import type { BinaryChoiceScreenConfig } from "./binary-choice";
import type { BucketSortScreenConfig } from "./bucket-sort";
import type { CompletionScreenConfig } from "./completion";
import type { CustomScreenConfig } from "./custom";
import type { DragToTargetScreenConfig } from "./drag-to-target";
import type { HoldToFillScreenConfig } from "./hold-to-fill";
import type { LinkMatchScreenConfig } from "./link-match";
import type { NarrativeBonusScreenConfig } from "./narrative-bonus";
import type { SavingsGoalScreenConfig } from "./savings-goal";
import type { SpotlightRoundsScreenConfig } from "./spotlight-rounds";
import type { TapRevealScreenConfig } from "./tap-reveal";
import type { TrueFalseScreenConfig } from "./true-false";
import type { WordDropScreenConfig } from "./word-drop";

export type ScreenConfig =
  | WordDropScreenConfig
  | BinaryChoiceScreenConfig
  | TrueFalseScreenConfig
  | TapRevealScreenConfig
  | LinkMatchScreenConfig
  | BucketSortScreenConfig
  | HoldToFillScreenConfig
  | DragToTargetScreenConfig
  | SavingsGoalScreenConfig
  | NarrativeBonusScreenConfig
  | SpotlightRoundsScreenConfig
  | CompletionScreenConfig
  | CustomScreenConfig;
