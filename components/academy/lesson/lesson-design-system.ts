/**
 * Academy lesson design system — shared layout components and style tokens.
 *
 * Import UI primitives from `@/components/academy/lesson/lesson-ui`.
 * Import tokens from `@/components/academy/lesson/lesson-shared-styles`.
 * Import flow hook from `@/components/academy/lesson/hooks/use-lesson-screen-flow`.
 */

export {
  LessonCard,
  LessonColumnLabel,
  LessonErrorBanner,
  LessonGameBoard,
  LessonGameHint,
  LessonIconOption,
  LessonIconReveal,
  LessonIllustrationSlot,
  LessonImagePlaceholder,
  LessonMatchColumnHeaders,
  LessonRevealBucket,
  LessonScreenIntro,
  LessonScreenLayout,
  LessonSortBucket,
  LessonSortBucketRow,
  LessonSortPool,
  LessonSortStatementCard,
  LessonSortStatementPlaced,
  LessonPricedSortItemContent,
  LessonSequenceSlot,
  LessonSequenceNumberedRow,
  LessonSequenceSortBoard,
  LessonSequenceStepCard,
  LessonSequenceStepPlaced,
  LessonSpentTotalBar,
  LessonSuccessBanner,
  resolveLessonScreenCopy,
} from "@/components/academy/lesson/lesson-ui";

export { useLessonScreenFlow } from "@/components/academy/lesson/hooks/use-lesson-screen-flow";

export { LessonSequenceSortGame } from "@/components/academy/lesson/lesson-sequence-sort-game";

export * from "@/components/academy/lesson/lesson-shared-styles";

export { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";

export { LessonChoiceIndicator } from "@/components/academy/lesson/lesson-choice-indicator";

export {
  resolveChoiceVariant,
  usesNeutralChoiceFeedback,
  usesNeutralTapFeedback,
} from "@/components/academy/lesson/lesson-shared-styles";

export {
  LessonScreenPane,
  AcademyLessonShell,
} from "@/components/academy/lesson/academy-lesson-shell";

export {
  LessonScreenChromeProvider,
  LessonScreenIllustration,
  useLessonScreenIllustration,
} from "@/components/academy/lesson/lesson-screen-chrome";
