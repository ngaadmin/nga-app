import type { ComponentType } from "react";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import type {
  CohortContentMap,
  LessonComponentProps,
  LessonMeta,
  LessonRewards,
} from "./meta";
import type { ScreenConfig } from "./screens";
import type { ScreenOverrideMap } from "../cohort-overrides";

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

export type LessonContentResolver = (
  cohort: MasteryCohort,
) => ResolvedLessonContent;

export type LessonConfig = {
  meta: LessonMeta;
  rewards: LessonRewards;
  contentResolver: LessonContentResolver;
  component: ComponentType<LessonComponentProps>;
};
