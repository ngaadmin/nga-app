import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getPairSheetImagePath } from "@/lib/academy/illustrations/illustration-registry";
import { rehomeBetweenLessonBeats } from "@/lib/academy/lessons/payload/explorer-m1/convert-explorer-workbook";
import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import type { PayloadScreenRow } from "@/lib/academy/lessons/payload/types";
import { selectLessonPayload } from "@/lib/academy/lessons/payload/explorer-m1/select-payload";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { fallbackNextIndex } from "@/lib/academy/lessons/payload/lesson-graph";
import { missingLessonImages } from "@/lib/academy/lessons/payload/validate-lesson-assets";
import { resolveLessonScreenIllustration } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import { moduleCloserGoldSkillLine } from "@/lib/academy/lessons/completion-screen";
import { STORY_CREDIT } from "@/lib/academy/lessons/story-audio/audio-base";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";

function row(gameType: string, screenLabel: string, settings = ""): PayloadScreenRow {
  const copy = { explorer: settings, pathfinder: settings, maverick: settings };
  const text = { explorer: screenLabel, pathfinder: screenLabel, maverick: screenLabel };
  return {
    screenNumber: gameType === "scenario-beat" ? 0 : 1,
    screenLabel,
    gameType,
    text,
    image: text,
    settings: copy,
    error: { explorer: "", pathfinder: "", maverick: "" },
  };
}

describe("between-lesson beat placement", () => {
  it("moves a single trailer onto the next lesson and a wrap in front of the medal", () => {
    const lessons = new Map<number, PayloadScreenRow[]>([
      [
        1,
        [row("word-drop", "1"), row("completion", "8"), row("scenario-beat", "l1-trailer")],
      ],
      [
        7,
        [
          row("drag-to-target", "7"),
          row("completion", "8"),
          row("scenario-beat", "l7-wrap"),
          row("scenario-beat", "l7-open-a"),
          row("scenario-beat", "l7-open-b"),
        ],
      ],
      [8, [row("spotlight-rounds", "1"), row("completion", "8")]],
      [
        9,
        [
          row("skill-hub", "1", "BUTTON: Finish → GO Screen 8 WHEN complete"),
          row("completion", "8"),
          row("scenario-beat", "l9-close-a"),
          row("scenario-beat", "l9-close-b"),
        ],
      ],
    ]);

    rehomeBetweenLessonBeats(lessons);

    expect(lessons.get(1)?.map((screen) => screen.screenLabel)).toEqual(["1", "8"]);
    expect(lessons.get(7)?.map((screen) => screen.screenLabel)).toEqual([
      "l1-trailer",
      "7",
      "l7-wrap",
      "8",
    ]);
    expect(lessons.get(8)?.map((screen) => screen.screenLabel)).toEqual([
      "l7-open-a",
      "l7-open-b",
      "1",
      "8",
    ]);
    expect(lessons.get(9)?.map((screen) => screen.screenLabel)).toEqual([
      "1",
      "l9-close-a",
      "l9-close-b",
      "8",
    ]);
    expect(lessons.get(9)?.[0]?.settings.explorer).toContain("GO Screen l9-close-a");
  });
});

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
    expect(credited).toEqual(
      new Set([
        "explorer-m1-intro-beat1",
        "explorer-m1-l1-beat3",
        "explorer-m1-l2-beat4",
        "explorer-m1-l3-beat3",
        "explorer-m1-l4-beat4",
        "explorer-m1-l5-beat3",
        "explorer-m1-l6-beat3",
        "explorer-m1-l7-beat2",
        "explorer-m1-l9-beat1",
      ]),
    );
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

  it("plays opening beats, then practice, then a closing beat, then the medal", () => {
    const openings: Record<number, readonly string[]> = {
      1: ["explorer-m1-intro-beat1"],
      2: ["explorer-m1-l1-beat3"],
      3: ["explorer-m1-l2-beat4"],
      4: ["explorer-m1-l3-beat3"],
      5: ["explorer-m1-l4-beat4"],
      6: ["explorer-m1-l5-beat3"],
      7: ["explorer-m1-l6-beat3"],
      8: ["explorer-m1-l7-beat2", "explorer-m1-l7-beat3"],
      9: [],
    };
    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      const payload = loadExplorerM1Payload(lessonNumber);
      if (!payload) throw new Error(`missing lesson ${lessonNumber}`);
      const screens = resolvePayloadLesson(payload, "explorer", lessonNumber).screens;
      const labels = screens.map((screen) => screen.sourceLabel ?? screen.id);
      const completion = screens.findIndex((screen) => screen.type === "completion");
      expect(completion, `lesson ${lessonNumber} medal`).toBe(screens.length - 1);
      expect(
        screens.slice(completion + 1).map((screen) => screen.type),
        `lesson ${lessonNumber} after medal`,
      ).toEqual([]);

      const opening = openings[lessonNumber] ?? [];
      expect(
        screens.slice(0, opening.length).map((screen) => screen.id),
        `lesson ${lessonNumber} opening`,
      ).toEqual(opening);
      for (const [offset, beatId] of opening.entries()) {
        const beat = screens[offset];
        expect(beat?.type, beatId).toBe("narrative-bonus");
        const next = fallbackNextIndex(beat!, offset, labels);
        expect(next === undefined || (next > offset && next < completion), `${beatId} advances`).toBe(
          true,
        );
      }

      const closing = [...screens.entries()]
        .reverse()
        .find(([index, screen]) => index < completion && screen.type === "narrative-bonus");
      expect(closing, `lesson ${lessonNumber} closing beat`).toBeTruthy();
      if (!closing) continue;
      const [index, beat] = closing;
      const next = fallbackNextIndex(beat, index, labels);
      const destination = next ?? index + 1;
      expect(screens[destination]?.type, `lesson ${lessonNumber} last beat`).toBe("completion");
    }

    const lesson2 = loadExplorerM1Payload(2);
    if (!lesson2) throw new Error("missing lesson 2");
    const opener = resolvePayloadLesson(lesson2, "explorer", 2).screens[0];
    expect(opener?.type).toBe("narrative-bonus");
    if (opener?.type === "narrative-bonus") {
      expect(opener.narrative.startsWith("Senna's birthday is on Saturday")).toBe(true);
    }
  });

  it("keeps the imageless gelato beat from showing its image brief", () => {
    const payload = loadExplorerM1Payload(5);
    if (!payload) throw new Error("missing lesson 5");
    const beat = resolvePayloadLesson(payload, "explorer", 5).screens.find(
      (screen) => screen.id === "explorer-m1-l5-beat1",
    );
    expect(beat?.type).toBe("narrative-bonus");
    if (beat?.type !== "narrative-bonus") return;
    expect(beat.pairImage).toBe(false);
    expect(beat.illustration).toBeUndefined();
    expect(beat.narrative.startsWith("Lars and Mia share the birthday gelato")).toBe(true);
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
