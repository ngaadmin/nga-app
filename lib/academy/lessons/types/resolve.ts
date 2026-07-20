import {
  applyCharacterTokensToScreen,
  applyCohortScreenOverrides,
} from "@/lib/academy/lessons/cohort-overrides";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import type {
  CohortLessonDefinition,
  ResolvedLessonContent,
} from "./lesson-content";
import type { CohortContentMap, LessonRewards } from "./meta";
import type { CustomScreenConfig, ScreenConfig } from "./screens";

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
