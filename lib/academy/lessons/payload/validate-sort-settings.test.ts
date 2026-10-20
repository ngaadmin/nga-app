import { describe, expect, it } from "vitest";

import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { mapPayloadScreen } from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { PayloadScreenRow } from "@/lib/academy/lessons/payload/types";
import {
  assertSortAuthoring,
  isLegacySortAuthoringIssue,
  sortAuthoringIssues,
  type SortAuthoringIssue,
} from "@/lib/academy/lessons/payload/validate-sort-settings";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

const STEP_REORDER = `ITEMS:
STEP1: 💵 Get your pocket money.
STEP2: 🫙 Move a small amount to your Emergencies jar.
STEP3: 🎮 Spend what is left on fun.`;

function rowFor(gameType: string, settings: string, screenLabel = "4"): PayloadScreenRow {
  const copy = { explorer: settings, pathfinder: settings, maverick: settings };
  const blank = { explorer: "", pathfinder: "", maverick: "" };
  return {
    screenNumber: Number.parseInt(screenLabel, 10) || 1,
    screenLabel,
    gameType,
    text: { explorer: "Put these in order.", pathfinder: "Put these in order.", maverick: "Put these in order." },
    image: blank,
    settings: copy,
    error: blank,
  };
}

function module1SortIssues(): SortAuthoringIssue[] {
  const issues: SortAuthoringIssue[] = [];
  for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
    const payload = loadBundledLessonPayload(1, lessonNumber);
    for (const row of payload.screens) {
      if (row.gameType !== "rank-order" && row.gameType !== "bucket-sort") continue;
      for (const cohort of COHORTS) {
        const screen = mapPayloadScreen(row, cohort, { lessonNumber });
        const itemCount = "items" in screen ? screen.items.length : 0;
        const own = row.settings[cohort].trim();
        issues.push(
          ...sortAuthoringIssues({
            lessonNumber,
            screenLabel: row.screenLabel,
            cohort,
            gameType: row.gameType,
            raw: own || row.settings.pathfinder,
            itemCount,
          }),
        );
      }
    }
  }
  return issues;
}

describe("sort screen authoring", () => {
  it("fails a reorder that uses STEP lines and parses no items", () => {
    const row = rowFor("rank-order", STEP_REORDER);
    expect(() => mapPayloadScreen(row, "pathfinder", { lessonNumber: 3 })).toThrow(
      /no parsed items/,
    );
    expect(() => mapPayloadScreen(row, "pathfinder", { lessonNumber: 3 })).toThrow(
      /unrecognised line "STEP1: 💵 Get your pocket money\."/,
    );
    expect(() => mapPayloadScreen(row, "explorer", { lessonNumber: 3 })).toThrow(/cannot ship/);
  });

  it("fails a bucket screen with no parsed items", () => {
    const row = rowFor("bucket-sort", "ITEMS:\n");
    expect(() => mapPayloadScreen(row, "explorer", { lessonNumber: 1 })).toThrow(
      /screen 4 \(bucket-sort, explorer\) cannot ship: no parsed items/,
    );
  });

  it("fails a new bucket screen that still uses STEP lines", () => {
    const row = rowFor("bucket-sort", "ITEMS:\nSTEP1: Wait.\nSTEP2: Buy.", "2");
    expect(() => mapPayloadScreen(row, "maverick", { lessonNumber: 9 })).toThrow(
      /unrecognised line "STEP1: Wait\."/,
    );
  });

  it("keeps the lesson 4 screen 2 reorder and flags no other Module 1 screen", () => {
    const issues = module1SortIssues();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every(isLegacySortAuthoringIssue)).toBe(true);
    const flagged = [
      ...new Set(issues.map((issue) => `L${issue.lessonNumber} s${issue.screenLabel} ${issue.cohort}`)),
    ];
    expect(flagged).toEqual([
      "L4 s2 explorer",
      "L4 s2 pathfinder",
      "L4 s2 maverick",
    ]);
    expect(assertSortAuthoring(issues)).toBeUndefined();
    const fresh = sortAuthoringIssues({
      lessonNumber: 9,
      screenLabel: "2",
      cohort: "explorer",
      gameType: "bucket-sort",
      raw: "STEP1: Wait.",
      itemCount: 1,
    });
    expect(() => assertSortAuthoring(fresh)).toThrow(/cannot ship/);
  });
});
