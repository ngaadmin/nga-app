import { describe, expect, it } from "vitest";
import {
  BUNDLED_PAYLOAD_MILESTONE_IDS,
  DEFINITION_MILESTONE_IDS,
  hasShippedLesson,
  listPlayableLessonMilestoneIds,
} from "@/lib/academy/lessons/lesson-availability";
import { LESSON_DEFINITIONS } from "@/lib/academy/lessons/registry";

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
});
