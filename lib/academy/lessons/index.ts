export { M1_L1_LESSON_DEFINITION } from "@/lib/academy/lessons/content/m1-l1";
export { M1_L2_LESSON_DEFINITION, M1_L2_CUSTOM } from "@/lib/academy/lessons/content/m1-l2";
export { M1_L3_LESSON_DEFINITION } from "@/lib/academy/lessons/content/m1-l3";
export { M1_L4_LESSON_DEFINITION } from "@/lib/academy/lessons/content/m1-l4";
export {
  M1_L1_EXPLORER_DEFINITION,
  M1_L2_EXPLORER_DEFINITION,
  M1_L3_EXPLORER_DEFINITION,
  M1_L4_EXPLORER_DEFINITION,
} from "@/lib/academy/lessons/content/data/explorer";
export {
  explorerCompletionScreen,
  teenCompletionScreen,
} from "@/lib/academy/lessons/completion-screen";
export type { ExplorerSpreadsheetRow, LessonScaffoldRow } from "@/lib/academy/lessons/spreadsheet-schema";
export {
  EXPLORER_SHEET_COLUMNS,
  GAME_ARCHETYPE_TO_TYPE,
  pedagogicalStageForScreen,
  SCREEN_INDEX_TO_STAGE,
} from "@/lib/academy/lessons/spreadsheet-schema";
export type {
  AdvancePolicy,
  CharacterTokenMap,
  DeclarativeScreenFields,
  PedagogicalStage,
  ScreenAuthoringMeta,
  ValidationRule,
  WithDeclarative,
} from "@/lib/academy/lessons/types";
export {
  applyCharacterTokensToScreen,
  applyCohortScreenOverrides,
  mergeScreenConfig,
} from "@/lib/academy/lessons/cohort-overrides";
export type { ScreenOverrideMap, ScreenOverridePatch } from "@/lib/academy/lessons/cohort-overrides";
export {
  canLaunchAcademyLesson,
  getLessonDefinition,
  getShippedCohortsForLesson,
  getShippedLessonIdsForCohort,
  hasShippedLesson,
  isLessonShippedForCohort,
  LESSON_DEFINITIONS,
  resolveLessonForMilestone,
  M1_L1_ACHIEVEMENT_SKILL_ID,
  M1_L1_PERFECT_STREAK_BONUS,
  M1_L1_SKILL_ID,
  M1_L1_XP_REWARD,
  M1_L2_ACHIEVEMENT_SKILL_ID,
  M1_L2_PERFECT_STREAK_BONUS,
  M1_L2_SKILL_ID,
  M1_L2_XP_REWARD,
  M1_L3_ACHIEVEMENT_SKILL_ID,
  M1_L3_PERFECT_STREAK_BONUS,
  M1_L3_SKILL_ID,
  M1_L3_XP_REWARD,
  M1_L4_ACHIEVEMENT_SKILL_ID,
  M1_L4_PERFECT_STREAK_BONUS,
  M1_L4_SKILL_ID,
  M1_L4_XP_REWARD,
  SHIPPED_ACADEMY_LESSON_IDS,
} from "@/lib/academy/lessons/registry";
export type {
  BinaryChoiceScreenConfig,
  BucketSortScreenConfig,
  CohortContentMap,
  CohortBundleInput,
  CohortLessonDefinition,
  CompletionScreenConfig,
  CustomScreenConfig,
  DragToTargetScreenConfig,
  HoldToFillScreenConfig,
  LinkMatchScreenConfig,
  LinkMatchPair,
  LessonContentBundle,
  LessonMeta,
  LessonRewards,
  NarrativeBonusScreenConfig,
  ResolvedLessonContent,
  SavingsGoalItem,
  SavingsGoalScreenConfig,
  ScreenConfig,
  SortBucket,
  SortItem,
  SpotlightRoundsScreenConfig,
  TapRevealBucket,
  TapRevealItem,
  TapRevealScreenConfig,
  TrueFalseScreenConfig,
  WordDropScreenConfig,
} from "@/lib/academy/lessons/types";
export {
  getScreenAtIndex,
  isCustomScreen,
  resolveCohortContent,
  resolveLessonDefinition,
} from "@/lib/academy/lessons/types";
