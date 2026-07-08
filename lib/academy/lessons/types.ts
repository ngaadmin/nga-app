/**
 * Academy lesson content schema
 * ─────────────────────────────
 * Static TypeScript modules under `lib/academy/lessons/content/` define each lesson.
 * Cohort variants use `baseScreens` + per-cohort `screenOverrides` (see cohort-overrides.ts).
 * Maverick inherits Pathfinder when `maverick` is omitted.
 *
 * @example Word-drop screen (M1-L1 Screen 1)
 * ```ts
 * {
 *   type: "word-drop",
 *   id: "hook-word-drop",
 *   narrativeBefore: "Holly made $25... the cash must be",
 *   narrativeAfter: "right away!",
 *   options: ["Spent", "Saved", "Hidden"],
 *   correctOption: "Spent",
 *   wrongError: "Not quite! ...",
 * }
 * ```
 *
 * @example Binary-choice screen (M1-L1 Screen 5)
 * ```ts
 * {
 *   type: "binary-choice",
 *   id: "countdown-trap",
 *   prompt: 'Holly\'s playing online and a game alert flashes...',
 *   optionA: { label: "To stop her from pausing...", isCorrect: true },
 *   optionB: { label: "Because they want to make sure...", isCorrect: false },
 *   wrongError: "Don't fall for the countdown! ...",
 *   errorStyle: "banner",
 * }
 * ```
 *
 * @example Bucket-sort screen (M1-L1 Screen 4)
 * ```ts
 * {
 *   type: "bucket-sort",
 *   id: "sort-short-vs-long",
 *   intro: "Your turn! Sort these items into the correct bucket.",
 *   buckets: [
 *     { id: "short", label: "Short Fun" },
 *     { id: "long", label: "More Fun for Longer" },
 *   ],
 *   items: [
 *     { id: "bubble-tea", emoji: "🧋", label: "Giant bubble tea", bucket: "short" },
 *   ],
 * }
 * ```
 *
 * @example Custom screen (M1-L2 budget checkboxes)
 * ```ts
 * { type: "custom", id: "budget-wallet", renderer: "m1-l2-budget-wallet" }
 * ```
 */

import type { ComponentType } from "react";
import {
  applyCharacterTokensToScreen,
  applyCohortScreenOverrides,
} from "@/lib/academy/lessons/cohort-overrides";
import type { ScreenOverrideMap } from "@/lib/academy/lessons/cohort-overrides";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

export type {
  ScreenOverrideMap,
  ScreenOverridePatch,
} from "@/lib/academy/lessons/cohort-overrides";

// ─── Registry & metadata ───────────────────────────────────────────────────

export type LessonRewards = {
  xpReward: number;
  perfectStreakBonus: number;
  skillSlug: string;
  achievementSkillSlug: string;
};

export type LessonMeta = {
  milestoneId: number;
  levelId: number;
  lessonNumber: number;
  moduleTitle: string;
  lessonTitle: string;
  /** Shown in AcademyLessonShell header, e.g. "Module 1 · Lesson 1 · Money In, Money Out" */
  shellLabel: string;
  totalScreens: number;
  /** From Lesson Scaffold — display skill name (may differ from skillSlug). */
  skillName?: string;
  skillHubId?: string;
  learningOutcome?: string;
  conceptTruth?: string;
  behaviourShift?: string;
  ruleEnforcement?: string;
  learningArc?: string;
  focus?: string;
  /** Workbook tier key e.g. L1-M1-T1 */
  lessonKey?: string;
  /** Default character tokens for `{character}` / `{support}` substitution */
  characters?: CharacterTokenMap;
};

/** Pedagogical stage from Lesson Scaffold Screens sheet. */
export type PedagogicalStage = "hook" | "core" | "apply" | "reward" | "close";

/** Mirrors Explorer spreadsheet columns + scaffold stage metadata. */
export type ScreenAuthoringMeta = {
  /** Column: Objective — e.g. "Activate Prior Knowledge (Relatability)" */
  objective?: string;
  /** Column: Game Archetype — e.g. "The Fill-the-Blank Drop" */
  gameArchetype?: string;
  /** Column: The Simple Screen Text */
  simpleScreenText?: string;
  /** Column: The Action — interaction instructions for authors/QA */
  theAction?: string;
  /** Column: Content for game — raw pool/items/choices text */
  contentForGame?: string;
  /** Column: Error message — default wrong-answer copy */
  errorMessage?: string;
  /** Derived from screen index + scaffold (Hook / Core / Apply / Reward / Close) */
  pedagogicalStage?: PedagogicalStage;
  /** Scaffold retention goal / stage description */
  stageDescription?: string;
  screenNumber?: number;
  lessonKey?: string;
};

/** Per-cohort character names for token replacement in copy. */
export type CharacterTokenMap = {
  /** Primary protagonist — Lars, Mia, Holly, etc. */
  lead?: string;
  /** Optional supporting character — Senna, Eva, Tom, etc. */
  support?: string;
  explorer?: string;
  pathfinder?: string;
  maverick?: string;
};

/** How the lesson shell advances past this screen. */
export type AdvancePolicy =
  | { mode: "on-complete" }
  | { mode: "auto-ready" }
  | { mode: "manual-next" }
  | { mode: "all-taps-revealed" }
  | { mode: "all-items-sorted" }
  | { mode: "spotlight-rounds-complete" }
  | { mode: "validate-on-next"; rules: ValidationRule[] };

/** Declarative validation for custom / quantitative screens. */
export type ValidationRule =
  | {
      kind: "budget-wallet";
      correctIds: string[];
      maxTotal?: number;
      errors?: Record<string, string>;
    }
  | {
      kind: "reserve-slider";
      targetMin: number;
      total?: number;
      errorMessage?: string;
    }
  | {
      kind: "rank-order";
      correctOrder: string[];
      errors?: Record<string, string>;
    }
  | { kind: "all-items-sorted" }
  | { kind: "all-taps-revealed" }
  | { kind: "spotlight-rounds-complete" };

/** Optional declarative fields on every screen (spreadsheet + player metadata). */
export type DeclarativeScreenFields = {
  authoring?: ScreenAuthoringMeta;
  advance?: AdvancePolicy;
};

export type WithDeclarative<T> = T & DeclarativeScreenFields;

/** Per-cohort content. Maverick falls back to Pathfinder when `maverick` is omitted. */
export type CohortContentMap<T> = {
  explorer: T;
  pathfinder: T;
  maverick?: T;
};

export type LessonContentResolver = (
  cohort: MasteryCohort,
) => ResolvedLessonContent;

export type LessonComponentProps = {
  milestoneId: number;
};

export type LessonConfig = {
  meta: LessonMeta;
  rewards: LessonRewards;
  contentResolver: LessonContentResolver;
  component: ComponentType<LessonComponentProps>;
};

// ─── Shared screen building blocks ─────────────────────────────────────────

export type SortBucket<TBucket extends string = string> = {
  id: TBucket;
  label: string;
};

export type SortItem<TBucket extends string = string> = {
  id: string;
  emoji?: string;
  label: string;
  bucket: TBucket;
  /** Dollar value for spent-total bucket layouts. */
  price?: number;
  /** Shown on wrong-bucket drop (M1-L2 pattern). */
  wrongDropError?: string;
};

export type TapRevealItem<TBucket extends string = string> = {
  id: string;
  label: string;
  /** Shown on tap chips and in bucket lists; use with tapDisplay/revealDisplay. */
  emoji?: string;
  bucket: TBucket;
};

export type TapRevealBucket<TBucket extends string = string> = {
  id: TBucket;
  label: string;
  /** Tailwind-compatible tone token for bucket header */
  tone: "short" | "long" | "want" | "need";
};

// ─── Screen config discriminated union ─────────────────────────────────────

export type WordDropScreenConfig = WithDeclarative<{
  type: "word-drop";
  id: string;
  narrativeBefore: string;
  narrativeAfter: string;
  options: readonly string[];
  correctOption: string;
  wrongError: string;
  promptLabel?: string;
  /** Multi-blank prompt with [blank] tokens */
  prompt?: string;
  blanks?: readonly {
    options: readonly string[];
    correctOption: string;
  }[];
}>;

export type BinaryChoiceScreenConfig = WithDeclarative<{
  type: "binary-choice";
  id: string;
  /** Main narrative / question copy */
  prompt: string;
  optionA: { label: string; isCorrect: boolean };
  optionB: { label: string; isCorrect: boolean };
  optionC?: { label: string; isCorrect: boolean };
  wrongError: string;
  successMessage?: string;
  /** inline-red = sentence screen; banner = trap-style toast */
  errorStyle?: "inline-red" | "banner";
}>;

export type TrueFalseScreenConfig = WithDeclarative<{
  type: "true-false";
  id: string;
  prompt: string;
  correctAnswer: "true" | "false";
  wrongError: string;
  promptLabel?: string;
}>;

export type TapRevealScreenConfig<TBucket extends string = string> = WithDeclarative<{
  type: "tap-reveal";
  id: string;
  intro: string;
  items: readonly TapRevealItem<TBucket>[];
  buckets: readonly TapRevealBucket<TBucket>[];
  successMessage?: string;
  /** Tap chips: emoji-only (teen) vs emoji + label (Explorer). Default emoji-label. */
  tapDisplay?: "emoji-only" | "emoji-label";
  /** Sorted bucket lists: emoji-only vs emoji + label. Default emoji-label. */
  revealDisplay?: "emoji-only" | "emoji-label";
}>;

export type LinkMatchPair = {
  id: string;
  event: string;
  benefit: string;
};

export type LinkMatchScreenConfig = WithDeclarative<{
  type: "link-match";
  id: string;
  intro: string;
  pairs: readonly LinkMatchPair[];
  eventColumnLabel?: string;
  benefitColumnLabel?: string;
  successMessage?: string;
  wrongError?: string;
}>;

export type BucketSortScreenConfig<TBucket extends string = string> = WithDeclarative<{
  type: "bucket-sort";
  id: string;
  intro: string;
  buckets: readonly SortBucket<TBucket>[];
  items: readonly SortItem<TBucket>[];
  successMessage?: string;
  /** Two-column layout with running spent total (L3 Screen 2). */
  layout?: "default" | "spent-total";
  /** Expected total when all items are sorted (shown in spent-total header). */
  targetTotal?: number;
}>;

export type HoldToFillScreenConfig = WithDeclarative<{
  type: "hold-to-fill";
  id: string;
  narrative: string;
  holdLabel: string;
  frozenLabel: string;
  successMessage: string;
  /** When true, success message replaces the entire screen UI */
  clearOnSuccess?: boolean;
  holdDurationMs?: number;
  releaseHint?: string;
}>;

export type NarrativeBonusScreenConfig = WithDeclarative<{
  type: "narrative-bonus";
  id: string;
  narrative: string;
  bonusXp: number;
  bonusTapLabel: string;
  successMessage?: string;
  /** When bonusXp is 0, screen auto-advances when visited */
  autoReadyWhenNoBonus?: boolean;
}>;

export type SpotlightRoundsScreenConfig = WithDeclarative<{
  type: "spotlight-rounds";
  id: string;
  prompt: string;
  rounds: readonly {
    iconA: string;
    optionA: string;
    iconB: string;
    optionB: string;
    correct: "a" | "b";
    error: string;
  }[];
}>;

export type CompletionScreenConfig = WithDeclarative<{
  type: "completion";
  id: string;
  /** Pathfinder-style custom completion copy; omit to use LessonCompletionPane defaults */
  skillLearnedLabel?: string;
  pointsLabel?: string;
  bodyCopy?: string;
  returnButtonLabel?: string;
  useStandardPane?: boolean;
}>;

/**
 * Bespoke interaction — rendered via global custom renderer registry.
 * Config lives in screen `authoring` + lesson `custom` bag keyed by `configRef` or `id`.
 */
export type CustomScreenConfig = WithDeclarative<{
  type: "custom";
  id: string;
  renderer: string;
  /** Key into lesson `custom` bag (defaults to screen id) */
  configRef?: string;
}>;

export type ScreenConfig =
  | WordDropScreenConfig
  | BinaryChoiceScreenConfig
  | TrueFalseScreenConfig
  | TapRevealScreenConfig
  | LinkMatchScreenConfig
  | BucketSortScreenConfig
  | HoldToFillScreenConfig
  | NarrativeBonusScreenConfig
  | SpotlightRoundsScreenConfig
  | CompletionScreenConfig
  | CustomScreenConfig;

// ─── Resolved lesson content (after cohort merge) ───────────────────────────

export type LessonContentBundle = {
  characterName?: string;
  screens: readonly ScreenConfig[];
  rewards: LessonRewards;
  /** Arbitrary copy/constants for custom screen renderers (budget, slider, rank, gift). */
  custom?: Record<string, unknown>;
};

export type ResolvedLessonContent = LessonContentBundle & {
  meta: LessonMeta;
};

/** Per-cohort bundle: patch shared base screens or supply a full replacement array. */
export type CohortBundleInput = {
  characterName?: string;
  /** Light patches keyed by screen id — preferred for narrative-only cohort differences. */
  screenOverrides?: ScreenOverrideMap;
  /** Full screen array — escape hatch for bespoke lessons (e.g. M1-L2 custom screens). */
  screens?: readonly ScreenConfig[];
  rewards?: Partial<LessonRewards>;
  custom?: Record<string, unknown>;
};

export type CohortLessonDefinition = {
  meta: LessonMeta;
  rewards: LessonRewards;
  /** Shared custom renderer configs keyed by screen id or configRef. */
  custom?: Record<string, unknown>;
  /** Shared 8-screen pipeline; cohorts patch copy via `screenOverrides`. */
  baseScreens?: readonly ScreenConfig[];
  byCohort: CohortContentMap<CohortBundleInput>;
  /** Set by import script when spreadsheet rows are placeholders. */
  _draft?: boolean;
};

// ─── Cohort resolution helpers ─────────────────────────────────────────────

export function resolveCohortContent<T>(
  map: CohortContentMap<T>,
  cohort: MasteryCohort,
): T {
  if (cohort === "maverick" && map.maverick !== undefined) {
    return map.maverick;
  }
  if (cohort === "maverick") {
    return map.pathfinder;
  }
  return map[cohort];
}

export function resolveLessonDefinition(
  definition: CohortLessonDefinition,
  cohort: MasteryCohort,
): ResolvedLessonContent {
  const cohortBundle = resolveCohortContent(definition.byCohort, cohort);
  const rewards: LessonRewards = {
    ...definition.rewards,
    ...cohortBundle.rewards,
  };

  const screens =
    cohortBundle.screens ??
    applyCohortScreenOverrides(
      definition.baseScreens ?? [],
      cohortBundle.screenOverrides,
    );

  const tokens = {
    lead: cohortBundle.characterName ?? definition.meta.characters?.lead,
    support: definition.meta.characters?.support,
  };

  const resolvedScreens = screens.map((screen) =>
    applyCharacterTokensToScreen(screen, tokens),
  );

  return {
    meta: definition.meta,
    characterName: cohortBundle.characterName ?? definition.meta.characters?.lead,
    screens: resolvedScreens,
    rewards,
    custom: {
      ...(definition.custom ?? {}),
      ...(cohortBundle.custom ?? {}),
    },
  };
}

/** Type guard for custom screen configs */
export function isCustomScreen(
  screen: ScreenConfig,
): screen is CustomScreenConfig {
  return screen.type === "custom";
}

export function getScreenAtIndex(
  content: ResolvedLessonContent,
  index: number,
): ScreenConfig | undefined {
  return content.screens[index];
}
