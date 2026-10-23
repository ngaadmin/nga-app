import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getPairSheetImagePath } from "@/lib/academy/illustrations/illustration-registry";
import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import { selectLessonPayload } from "@/lib/academy/lessons/payload/explorer-m1/select-payload";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { missingLessonImages } from "@/lib/academy/lessons/payload/validate-lesson-assets";
import { resolveLessonScreenIllustration } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
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
    expect(credited.has("explorer-m1-intro-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l1-beat1")).toBe(false);
    expect(credited.has("explorer-m1-l1-beat2")).toBe(false);
    expect(credited.has("explorer-m1-l6-beat3")).toBe(false);
    expect(credited.has("explorer-m1-l7-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l9-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l9-beat2")).toBe(false);
  });

  it("opens lesson 1 with the module intro before the first practice screen", () => {
    const payload = loadExplorerM1Payload(1);
    if (!payload) throw new Error("missing lesson 1");
    const screens = resolvePayloadLesson(payload, "explorer", 1).screens;
    const intro = screens[0];
    expect(intro?.type).toBe("narrative-bonus");
    if (intro?.type !== "narrative-bonus") return;
    expect(intro.id).toBe("explorer-m1-intro-beat1");
    expect(intro.narrative).toBe(
      "Meet Lars. He's 11, loves riding his bike and he lives with Mom, Dad and his big brother Senna. Lars spends every dollar the minute it lands in his hands. Follow along with Lars as he goes from being broke, to earning and having money to buy what he really wants. You'll learn the same moves right alongside him.",
    );
    expect(intro.successMessage).toBe("Are you ready? Let's go!");
    expect(intro.credit).toBe(STORY_CREDIT);
    expect(intro.audio).toEqual({
      src: "/academy-audio/explorer-m1/explorer-m1-intro-beat1-6a9361ab.mp3",
      durationMs: 19226,
    });
    const brief =
      "Lars at home, grinning beside his bike, with Mom, Dad and his big brother Senna in the background, coins and a bill slipping through his fingers.";
    const introSource = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "lib/academy/lessons/payload/source/explorer-m1/intro.json"),
        "utf8",
      ),
    ) as { image?: string };
    expect(introSource.image).toBe("lemonade-family-scene-r10.webp");
    expect(payload.screens[0]?.image).toEqual({
      explorer: introSource.image,
      pathfinder: introSource.image,
      maverick: introSource.image,
    });
    expect(intro.pairImage).toBe(introSource.image);
    expect(intro.illustration).toEqual({ label: brief, alt: brief });
    expect(resolveLessonScreenIllustration(intro)).toEqual({
      src: "/assets/illustrations/characters/pairs/lemonade-family-scene-r10.webp",
      alt: brief,
      label: brief,
    });
    expect(missingLessonImages(payload)).toEqual([]);
    expect(screens[1]?.type).toBe("word-drop");
    const firstLessonBeat = screens.find((screen) => screen.id === "explorer-m1-l1-beat1");
    expect(firstLessonBeat?.type).toBe("narrative-bonus");
    if (firstLessonBeat?.type !== "narrative-bonus") return;
    expect(firstLessonBeat.credit).toBeUndefined();
    expect(firstLessonBeat.audio?.src).toContain("explorer-m1-l1-beat1-76bfc19a.mp3");
    expect(firstLessonBeat.pairImage).toBe("em1-02-l1r7-senna-coins-r3.webp");
    expect(resolveLessonScreenIllustration(firstLessonBeat)).toMatchObject({
      src: "/assets/illustrations/characters/pairs/em1-02-l1r7-senna-coins-r3.webp",
    });
    const secondLessonBeat = screens.find((screen) => screen.id === "explorer-m1-l1-beat2");
    expect(secondLessonBeat?.type).toBe("narrative-bonus");
    if (secondLessonBeat?.type !== "narrative-bonus") return;
    expect(secondLessonBeat.credit).toBeUndefined();
    expect(secondLessonBeat.pairImage).toBe("em1-03-l1r11-lars-lemonade-r3.webp");
    expect(resolveLessonScreenIllustration(secondLessonBeat)).toMatchObject({
      src: "/assets/illustrations/characters/pairs/em1-03-l1r11-lars-lemonade-r3.webp",
    });
    const numbered = screens.filter((screen) => screen.type !== "narrative-bonus");
    expect(numbered.some((screen) => "pairImage" in screen && screen.pairImage === "em1-02-l1r7-senna-coins-r3.webp")).toBe(false);
    expect(numbered.some((screen) => "pairImage" in screen && screen.pairImage === "em1-03-l1r11-lars-lemonade-r3.webp")).toBe(false);

    const lesson2 = loadExplorerM1Payload(2);
    if (!lesson2) throw new Error("missing lesson 2");
    expect(missingLessonImages(lesson2)).toEqual([]);
    const lesson2Screens = resolvePayloadLesson(lesson2, "explorer", 2).screens;
    const bikeBeat = lesson2Screens.find((screen) => screen.id === "explorer-m1-l2-beat1");
    expect(bikeBeat?.type).toBe("narrative-bonus");
    if (bikeBeat?.type !== "narrative-bonus") return;
    expect(bikeBeat.pairImage).toBe("em1-04-l2r20-lars-mom-bike-note-r3.webp");
    expect(resolveLessonScreenIllustration(bikeBeat)).toMatchObject({
      src: "/assets/illustrations/characters/pairs/em1-04-l2r20-lars-mom-bike-note-r3.webp",
    });
    expect(
      lesson2Screens.some(
        (screen) =>
          screen.type !== "narrative-bonus" &&
          "pairImage" in screen &&
          screen.pairImage === "em1-04-l2r20-lars-mom-bike-note-r3.webp",
      ),
    ).toBe(false);
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
