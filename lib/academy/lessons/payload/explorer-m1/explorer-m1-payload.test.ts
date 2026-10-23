import { describe, expect, it } from "vitest";
import { getPairSheetImagePath } from "@/lib/academy/illustrations/illustration-registry";
import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import { selectLessonPayload } from "@/lib/academy/lessons/payload/explorer-m1/select-payload";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { moduleCloserGoldSkillLine } from "@/lib/academy/lessons/completion-screen";
import { STORY_CREDIT } from "@/lib/academy/lessons/story-audio/audio-base";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";

describe("explorer module 1 payload", () => {
  it("resolves Mia pose files to the character folder", () => {
    expect(getPairSheetImagePath("mia-thinking.webp")).toBe(
      "/assets/illustrations/characters/mia/Mia-thinking.webp",
    );
    expect(getPairSheetImagePath("Mia-celebrating.webp")).toBe(
      "/assets/illustrations/characters/mia/Mia-celebrating.webp",
    );
  });

  it("keeps Pathfinder on the bundled sheet", () => {
    const bundled = { lessonNumber: 1 } as LessonPayload;
    const explorer = { lessonNumber: 9 } as LessonPayload;
    expect(selectLessonPayload("pathfinder", bundled, explorer)).toBe(bundled);
    expect(selectLessonPayload("maverick", bundled, explorer)).toBe(bundled);
    expect(selectLessonPayload("explorer", bundled, explorer)).toBe(explorer);
    expect(selectLessonPayload("explorer", bundled, undefined)).toBe(bundled);
  });

  it("plays story beats without a bonus and credits the first voice in each lesson", () => {
    const credited = new Set<string>();
    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      const payload = loadExplorerM1Payload(lessonNumber);
      expect(payload, `lesson ${lessonNumber}`).toBeTruthy();
      if (!payload) continue;
      const content = resolvePayloadLesson(payload, "explorer", lessonNumber);
      const beats = content.screens.filter(
        (screen) => screen.type === "narrative-bonus" && screen.audio,
      );
      for (const beat of beats) {
        if (beat.type !== "narrative-bonus") continue;
        expect(beat.bonusXp).toBe(0);
        expect(beat.resolution).toBeUndefined();
        expect(beat.audio?.src.startsWith("/academy-audio/explorer-m1/")).toBe(true);
        if (beat.credit) {
          expect(beat.credit).toBe(STORY_CREDIT);
          credited.add(beat.id);
        }
      }
    }
    expect(credited.has("explorer-m1-l1-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l1-beat2")).toBe(false);
    expect(credited.has("explorer-m1-l6-beat3")).toBe(false);
    expect(credited.has("explorer-m1-l7-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l9-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l9-beat2")).toBe(false);
  });

  it("places between-lesson beats after that lesson's completion screen", () => {
    const afterCompletion = (lessonNumber: number, beatId: string) => {
      const payload = loadExplorerM1Payload(lessonNumber);
      if (!payload) throw new Error(`missing lesson ${lessonNumber}`);
      const screens = resolvePayloadLesson(payload, "explorer", lessonNumber).screens;
      const completion = screens.findIndex((screen) => screen.type === "completion");
      const beat = screens.findIndex((screen) => screen.id === beatId);
      expect(completion).toBeGreaterThanOrEqual(0);
      expect(beat).toBeGreaterThan(completion);
    };
    afterCompletion(6, "explorer-m1-l6-beat3");
    afterCompletion(7, "explorer-m1-l7-beat1");
    afterCompletion(9, "explorer-m1-l9-beat1");
    afterCompletion(9, "explorer-m1-l9-beat2");

    const lesson1 = loadExplorerM1Payload(1);
    if (!lesson1) throw new Error("missing lesson 1");
    const lesson1Screens = resolvePayloadLesson(lesson1, "explorer", 1).screens;
    const firstBeat = lesson1Screens.findIndex((screen) => screen.id === "explorer-m1-l1-beat1");
    const completion = lesson1Screens.findIndex((screen) => screen.type === "completion");
    expect(firstBeat).toBeGreaterThanOrEqual(0);
    expect(firstBeat).toBeLessThan(completion);
  });

  it("lists the three Module 1 gold skills on the explorer lesson 9 close", () => {
    const payload = loadExplorerM1Payload(9);
    if (!payload) throw new Error("missing lesson 9");
    const content = resolvePayloadLesson(payload, "explorer", 9);
    const completion = content.screens.find((screen) => screen.type === "completion");
    expect(completion?.type).toBe("completion");
    expect(moduleCloserGoldSkillLine(1)?.text).toBe(
      "Turned gold: Catch Impulse Spending, Choose Needs Over Wants, Don't Spend Money You Don't Have",
    );
    const bundled = loadBundledLessonPayload(1, 1);
    expect(selectLessonPayload("pathfinder", bundled, payload)?.lessonTitle).toBe(
      bundled.lessonTitle,
    );
  });
});
