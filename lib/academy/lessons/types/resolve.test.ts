import { describe, expect, it } from "vitest";
import {
  LESSON_COMPLETION_XP,
  LESSON_PERFECT_STREAK_BONUS,
} from "@/lib/academy/lessons/completion-xp";
import { DESIGN_SHELL_LESSON_DEFINITION } from "@/lib/academy/lessons/content/design-shell";
import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import { selectLessonPayload } from "@/lib/academy/lessons/payload/explorer-m1/select-payload";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { CohortLessonDefinition } from "@/lib/academy/lessons/types";
import { resolveLessonDefinition } from "@/lib/academy/lessons/types/resolve";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

const SKILL_ONLY_DEFINITION: CohortLessonDefinition = {
  meta: {
    milestoneId: 99,
    levelId: 1,
    lessonNumber: 9,
    moduleTitle: "Test",
    lessonTitle: "XP rule",
    shellLabel: "Test",
    totalScreens: 1,
  },
  rewards: {
    skillSlug: "stop-and-think",
    achievementSkillSlug: "stop-and-think",
  },
  baseScreens: [{ type: "completion", id: "done" }],
  byCohort: {
    explorer: { characterName: "Lars" },
    pathfinder: { characterName: "Holly" },
    maverick: { characterName: "Aiden" },
  },
};

describe("resolveLessonDefinition rewards", () => {
  it("awards 100 XP and a 50 perfect-streak bonus for every cohort", () => {
    for (const cohort of COHORTS) {
      const resolved = resolveLessonDefinition(SKILL_ONLY_DEFINITION, cohort);
      expect(resolved.rewards.xpReward).toBe(LESSON_COMPLETION_XP);
      expect(resolved.rewards.perfectStreakBonus).toBe(
        LESSON_PERFECT_STREAK_BONUS,
      );
    }
  });

  it("awards the same cash-in on every playable Module 1 lesson", () => {
    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      for (const cohort of COHORTS) {
        const label = `${cohort} lesson ${lessonNumber}`;
        const bundled = loadBundledLessonPayload(1, lessonNumber);
        const explorer = loadExplorerM1Payload(lessonNumber);
        const payload = selectLessonPayload(cohort, bundled, explorer);
        expect(payload, label).toBeTruthy();
        if (!payload) continue;
        const resolved = resolvePayloadLesson(payload, cohort, lessonNumber);
        expect(resolved.rewards.xpReward, label).toBe(LESSON_COMPLETION_XP);
        expect(resolved.rewards.perfectStreakBonus, label).toBe(
          LESSON_PERFECT_STREAK_BONUS,
        );
      }
    }
  });

  it("keeps the design shell at 0 XP", () => {
    const resolved = resolveLessonDefinition(
      DESIGN_SHELL_LESSON_DEFINITION,
      "explorer",
    );
    expect(resolved.rewards.xpReward).toBe(0);
    expect(resolved.rewards.perfectStreakBonus).toBe(0);
  });
});
