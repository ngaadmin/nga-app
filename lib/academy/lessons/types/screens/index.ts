export type { AllocationSliderItem, AllocationSliderScreenConfig } from "./allocation-slider";
export type {
  BinaryChoiceOption,
  BinaryChoiceScreenConfig,
  MultipleChoiceOption,
  MultipleChoiceScreen,
  MultipleChoiceScreenConfig,
} from "./multiple-choice";
export { isMultipleChoiceScreen } from "./multiple-choice";
export type { BudgetSelectItem, BudgetSelectScreenConfig } from "./budget-select";
export type { BucketSortScreenConfig } from "./bucket-sort";
export type { CompletionScreenConfig } from "./completion";
export type { CustomScreenConfig } from "./custom";
export type {
  DragToTargetItemSize,
  DragToTargetScreenConfig,
} from "./drag-to-target";
export type { HoldToFillScreenConfig } from "./hold-to-fill";
export type { LinkMatchPair, LinkMatchScreenConfig } from "./link-match";
export type { NarrativeBonusScreenConfig } from "./narrative-bonus";
export type { RankOrderItem, RankOrderScreenConfig } from "./rank-order";
export type { SavingsGoalItem, SavingsGoalScreenConfig } from "./savings-goal";
export type { SpotlightRoundsScreenConfig } from "./spotlight-rounds";
export type { TapRevealScreenConfig } from "./tap-reveal";
export type { TrueFalseScreenConfig } from "./true-false";
export type { WordDropScreenConfig } from "./word-drop";

import type { AllocationSliderScreenConfig } from "./allocation-slider";
import type {
  BinaryChoiceScreenConfig,
  MultipleChoiceScreenConfig,
} from "./multiple-choice";
import type { BudgetSelectScreenConfig } from "./budget-select";
import type { BucketSortScreenConfig } from "./bucket-sort";
import type { CompletionScreenConfig } from "./completion";
import type { CustomScreenConfig } from "./custom";
import type { DragToTargetScreenConfig } from "./drag-to-target";
import type { HoldToFillScreenConfig } from "./hold-to-fill";
import type { LinkMatchScreenConfig } from "./link-match";
import type { NarrativeBonusScreenConfig } from "./narrative-bonus";
import type { RankOrderScreenConfig } from "./rank-order";
import type { SavingsGoalScreenConfig } from "./savings-goal";
import type { SpotlightRoundsScreenConfig } from "./spotlight-rounds";
import type { TapRevealScreenConfig } from "./tap-reveal";
import type { TrueFalseScreenConfig } from "./true-false";
import type { WordDropScreenConfig } from "./word-drop";

export type ScreenConfig =
  | WordDropScreenConfig
  | MultipleChoiceScreenConfig
  | BinaryChoiceScreenConfig
  | TrueFalseScreenConfig
  | TapRevealScreenConfig
  | LinkMatchScreenConfig
  | BucketSortScreenConfig
  | BudgetSelectScreenConfig
  | AllocationSliderScreenConfig
  | RankOrderScreenConfig
  | HoldToFillScreenConfig
  | DragToTargetScreenConfig
  | SavingsGoalScreenConfig
  | NarrativeBonusScreenConfig
  | SpotlightRoundsScreenConfig
  | CompletionScreenConfig
  | CustomScreenConfig;
