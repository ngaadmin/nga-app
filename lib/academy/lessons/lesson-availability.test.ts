import { describe, expect, it } from "vitest";
import {
  BUNDLED_PAYLOAD_MILESTONE_IDS,
  bundledPayloadMilestone,
  canLaunchAcademyLesson,
  DEFINITION_MILESTONE_IDS,
  hasShippedLesson,
  isExplorerPreviewLessonUnlock,
  listPlayableLessonMilestoneIds,
  type VercelDeployEnv,
} from "@/lib/academy/lessons/lesson-availability";
import { getLessonDefinition, LESSON_DEFINITIONS } from "@/lib/academy/lessons/registry";

const production: VercelDeployEnv = { publicVercelEnv: "production" };
const preview: VercelDeployEnv = { publicVercelEnv: "preview" };
const development: VercelDeployEnv = { vercelEnv: "development" };
const unset: VercelDeployEnv = {};

describe("lesson availability", () => {
  it("matches the hard-coded lesson files", () => {
    expect(
      Object.keys(LESSON_DEFINITIONS)
        .map((key) => Number(key))
        .sort((left, right) => left - right),
    ).toEqual([...DEFINITION_MILESTONE_IDS]);
  });

  it("lists every playable milestone once", () => {
    expect(listPlayableLessonMilestoneIds()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const id of BUNDLED_PAYLOAD_MILESTONE_IDS) {
      expect(hasShippedLesson(id)).toBe(true);
    }
    expect(hasShippedLesson(10)).toBe(false);
  });

  it("plays lessons 1–9 from the CSV and does not register the old files", () => {
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(bundledPayloadMilestone(id)).toEqual({
        moduleNumber: 1,
        lessonNumber: id,
      });
      expect(getLessonDefinition(id)).toBeNull();
      expect(hasShippedLesson(id)).toBe(true);
    }
  });
});

describe("isExplorerPreviewLessonUnlock", () => {
  it("unlocks only preview and development", () => {
    expect(isExplorerPreviewLessonUnlock(preview)).toBe(true);
    expect(isExplorerPreviewLessonUnlock(development)).toBe(true);
    expect(isExplorerPreviewLessonUnlock({ vercelEnv: "preview" })).toBe(true);
    expect(isExplorerPreviewLessonUnlock(production)).toBe(false);
    expect(isExplorerPreviewLessonUnlock(unset)).toBe(false);
    expect(isExplorerPreviewLessonUnlock({ publicVercelEnv: "" })).toBe(false);
  });

  it("lets the public env override a preview server env", () => {
    expect(
      isExplorerPreviewLessonUnlock({
        publicVercelEnv: "production",
        vercelEnv: "preview",
      }),
    ).toBe(false);
    expect(
      isExplorerPreviewLessonUnlock({
        publicVercelEnv: "preview",
        vercelEnv: "production",
      }),
    ).toBe(true);
  });
});

describe("canLaunchAcademyLesson sequential gate", () => {
  it("keeps locked Explorer lessons closed in production", () => {
    for (const lesson of [2, 5, 9]) {
      expect(
        canLaunchAcademyLesson(lesson, "locked", "explorer", production),
      ).toBe(false);
    }
    expect(canLaunchAcademyLesson(1, "active", "explorer", production)).toBe(
      true,
    );
    expect(
      canLaunchAcademyLesson(1, "completed", "explorer", production),
    ).toBe(true);
  });

  it("keeps locked Explorer lessons closed when the deploy env is unset", () => {
    expect(canLaunchAcademyLesson(5, "locked", "explorer", unset)).toBe(false);
    expect(canLaunchAcademyLesson(9, "locked", "explorer", unset)).toBe(false);
  });

  it("opens Explorer lessons 1–9 on a preview deploy without changing status", () => {
    for (const lesson of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(
        canLaunchAcademyLesson(lesson, "locked", "explorer", preview),
      ).toBe(true);
    }
  });

  it("opens Explorer lessons 1–9 on a development deploy", () => {
    expect(canLaunchAcademyLesson(5, "locked", "explorer", development)).toBe(
      true,
    );
    expect(canLaunchAcademyLesson(9, "locked", "explorer", development)).toBe(
      true,
    );
  });

  it("does not open an unshipped lesson or another cohort", () => {
    expect(canLaunchAcademyLesson(10, "locked", "explorer", preview)).toBe(
      false,
    );
    expect(canLaunchAcademyLesson(5, "locked", "pathfinder", preview)).toBe(
      false,
    );
    expect(canLaunchAcademyLesson(9, "locked", "maverick", preview)).toBe(
      false,
    );
    expect(canLaunchAcademyLesson(5, "locked", "pathfinder", production)).toBe(
      false,
    );
  });
});
