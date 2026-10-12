import { describe, expect, it } from "vitest";
import { loadBundledLessonPayload, loadLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { hasShippedLesson } from "@/lib/academy/lessons/registry";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { resolveLessonScreenIllustration } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import {
  LESSON_COMPLETION_XP,
  LESSON_PERFECT_STREAK_BONUS,
} from "@/lib/academy/lessons/completion-xp";

const DETAILS_CSV = `Module Number,Lesson Number,Field,Value
1,1,Lesson Title,The spending spree
1,1,Level,1
1,1,Pathfinder Character,Holly
1,1,Explorer Character,Lars
1,1,Maverick Character,Aiden
1,1,Support Character,
1,1,Skill Name,Stop & Think
1,1,Skill ID,stop-and-think
`;

const SCREENS_CSV = `Module Number,Lesson Number,Screen,Game Type,Explorer Text,Pathfinder Text,Maverick Text,Explorer Image,Pathfinder Image,Maverick Image,Explorer Settings,Game Settings,Maverick Settings,Error Explorer,Error Pathfinder,Error Maverick,Notes
1,1,1,word-drop,Lars must be ______ right away!,Holly must be ______ right away!,Aiden must be ______ right away!,lars-thinking.webp,Holly-thinking.webp,Aiden-thinking.webp,,"OPTIONS: Spent | Saved | Hidden
CORRECT: Spent",,Not quite Lars,Not quite Holly,Not quite Aiden,
`;

describe("lesson payload loader", () => {
  it("reads Lesson 1 from the attached workbook and details csv", () => {
    const payload = loadBundledLessonPayload(1, 1);
    expect(payload.lessonTitle).toBe("The spending spree");
    expect(payload.skillId).toBe("stop-and-think");
    expect(payload.characters.explorer).toBe("Lars");
    expect(payload.screens.map((screen) => screen.gameType)).toEqual([
      "word-drop",
      "binary-choice",
      "tap-reveal",
      "bucket-sort",
      "spotlight-rounds",
      "hold-to-fill",
      "binary-choice",
      "completion",
    ]);
  });

  it("reads the same columns from CSV", () => {
    const payload = loadLessonPayload({
      moduleNumber: 1,
      lessonNumber: 1,
      screens: { filename: "Screens.csv", text: SCREENS_CSV },
      lessonDetails: { filename: "Lesson-Details.csv", text: DETAILS_CSV },
    });
    expect(payload.screens).toHaveLength(1);
    expect(payload.screens[0]?.settings.pathfinder).toContain("CORRECT: Spent");
  });

  it("maps Lesson 1 explorer copy onto the existing templates", () => {
    const content = resolvePayloadLesson(loadBundledLessonPayload(1, 1), "explorer", 1);
    expect(content.meta.lessonTitle).toBe("The spending spree");
    expect(content.meta.totalScreens).toBe(8);
    expect(content.characterName).toBe("Lars");
    expect(content.rewards).toMatchObject({
      skillSlug: "stop-and-think",
      achievementSkillSlug: "stop-and-think",
      xpReward: LESSON_COMPLETION_XP,
      perfectStreakBonus: LESSON_PERFECT_STREAK_BONUS,
    });

    const [wordDrop, binary, tap, sort, spotlight, hold, , completion] = content.screens;
    expect(wordDrop).toMatchObject({
      type: "word-drop",
      narrativeBefore: expect.stringContaining("Lars just got $20"),
      narrativeAfter: "right away!",
      options: ["Spent", "Saved", "Hidden"],
      correctOption: "Spent",
      pairImage: "lars-thinking.webp",
    });
    expect(binary).toMatchObject({
      type: "binary-choice",
      id: "short-fun-reality",
      optionA: { isCorrect: true },
      pairImage: "lars-questioning.webp",
    });
    expect(tap).toMatchObject({
      type: "tap-reveal",
      pairImage: false,
    });
    if (tap?.type === "tap-reveal") {
      expect(tap.items[0]).toMatchObject({
        label: "Sour Worms",
        bucket: "short",
        emoji: "🍬",
      });
    }
    expect(sort).toMatchObject({
      type: "bucket-sort",
    });
    expect(sort && "pairImage" in sort ? sort.pairImage : undefined).toBeUndefined();
    expect(spotlight).toMatchObject({
      type: "spotlight-rounds",
      rounds: [
        expect.objectContaining({
          optionA: "To trick his brain into buying fast.",
          correct: "a",
        }),
      ],
    });
    expect(hold).toMatchObject({
      type: "hold-to-fill",
      holdLabel: "❄️ HOLD TO FREEZE ❄️",
      frozenLabel: "❄️ FROZEN ❄️",
    });
    expect(completion).toEqual({
      type: "completion",
      id: "screen-8",
      useStandardPane: true,
      medalId: "medal-skill1-bronze",
      authoredMedal: true,
      medalTier: "bronze",
      skillName: "Stop & Think",
    });
    expect(content.meta.skillName).toBe("Stop & Think");
  });

  it("loads lesson 6 so it can open after lesson 5", () => {
    expect(hasShippedLesson(6)).toBe(true);
    const content = resolvePayloadLesson(loadBundledLessonPayload(1, 6), "explorer", 6);
    expect(content.meta.lessonTitle).toBe("Keep Spare Cash");
    expect(content.screens.map((screen) => screen.type)).toEqual([
      "binary-choice",
      "binary-choice",
      "bucket-sort",
      "spotlight-rounds",
      "binary-choice",
      "rank-order",
      "allocation-slider",
      "completion",
    ]);
    expect(content.screens[0]).toMatchObject({
      type: "binary-choice",
      optionA: { label: "True", isCorrect: true },
      optionB: { label: "False", isCorrect: false },
    });
  });

  it("splits choice labels out of packed settings cells", () => {
    const lesson7 = resolvePayloadLesson(loadBundledLessonPayload(1, 7), "explorer", 7);
    expect(lesson7.screens[1]).toMatchObject({
      type: "binary-choice",
      options: [
        { label: "Want", isCorrect: false },
        { label: "Need", isCorrect: true },
      ],
    });

    const lesson8 = resolvePayloadLesson(loadBundledLessonPayload(1, 8), "explorer", 8);
    const phoneCase = lesson8.screens[0];
    expect(phoneCase).toMatchObject({ type: "binary-choice" });
    if (phoneCase?.type !== "binary-choice") return;
    expect(phoneCase.options?.map((option) => option.label)).toEqual([
      "Buy it. He wants it and will have money left over",
      "Don’t buy it. He doesn’t need it",
    ]);
    const labels = phoneCase.options?.map((option) => option.label).join(" ") ?? "";
    expect(labels).not.toMatch(/CHOICE|CORRECT|→|SET cash|GO Screen/);
  });

  it("maps YES and NO rows into a bucket-sort", () => {
    const lesson6 = resolvePayloadLesson(loadBundledLessonPayload(1, 6), "explorer", 6);
    const sort = lesson6.screens.find(
      (screen) =>
        screen.type === "bucket-sort" &&
        screen.intro.includes("Sort what Lars can do"),
    );
    expect(sort).toMatchObject({
      type: "bucket-sort",
      buckets: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
      ],
    });
    if (sort?.type !== "bucket-sort") return;
    expect(sort.items.map((item) => [item.emoji, item.label, item.bucket])).toEqual([
      ["🎟️", "Pay his half for the cinema", "yes"],
      ["💰", "Use the money for something else this weekend", "yes"],
      ["🎯", "Buy the dart blaster and go to the cinema", "no"],
      ["🚫", "Never spend any money", "no"],
    ]);
    expect(sort.pairImage).toBeUndefined();
    expect(resolveLessonScreenIllustration(sort)).toBeUndefined();
    expect(
      resolveLessonScreenIllustration({
        ...sort,
        pairImage: "concept-wallet.webp",
      })?.src,
    ).toContain("concept-wallet.webp");
  });

  it("leaves bucket-sort image cells blank instead of not allowed", () => {
    for (const lessonNumber of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      let payload;
      try {
        payload = loadBundledLessonPayload(1, lessonNumber);
      } catch {
        continue;
      }
      for (const screen of payload.screens) {
        if (screen.gameType !== "bucket-sort") continue;
        for (const value of [
          screen.image.explorer,
          screen.image.pathfinder,
          screen.image.maverick,
        ]) {
          expect(value.trim().toLowerCase()).not.toBe("not allowed");
        }
      }
    }
  });

  it("counts lesson 7 savings down from the available amount", () => {
    const lesson7 = resolvePayloadLesson(loadBundledLessonPayload(1, 7), "explorer", 7);
    const savings = lesson7.screens[2];
    expect(savings).toMatchObject({
      type: "savings-goal",
      meterLabel: "Remaining",
      showsRemaining: true,
      targetAmount: 45,
    });
    if (savings?.type !== "savings-goal") return;
    expect(savings.items.map((item) => [item.label, item.price])).toEqual([
      ["Headphones", 40],
      ["Gelato", 5],
    ]);
  });

  it("splits a one-line OPTIONS and CORRECT pair on word-drop screens", () => {
    const lesson7 = resolvePayloadLesson(loadBundledLessonPayload(1, 7), "explorer", 7);
    expect(lesson7.screens[0]).toMatchObject({
      type: "word-drop",
      options: [
        "stops and thinks",
        "buys it straight away",
        "asks Mia to pay for it",
      ],
      correctOption: "stops and thinks",
    });

    const lesson9 = resolvePayloadLesson(loadBundledLessonPayload(1, 9), "explorer", 9);
    const lesson9Drop = lesson9.screens.find((screen) => screen.type === "word-drop");
    expect(lesson9Drop).toMatchObject({
      options: ["afford", "want", "see"],
      correctOption: "afford",
    });
  });

  it("uses pathfinder settings when the explorer settings cell is empty", () => {
    const content = resolvePayloadLesson(loadBundledLessonPayload(1, 1), "pathfinder", 1);
    const wordDrop = content.screens[0];
    expect(wordDrop).toMatchObject({
      type: "word-drop",
      narrativeBefore: expect.stringContaining("Holly made $25"),
      correctOption: "Spent",
    });
  });
});
