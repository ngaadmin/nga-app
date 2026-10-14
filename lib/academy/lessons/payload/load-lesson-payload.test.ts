import { describe, expect, it } from "vitest";
import { loadBundledLessonPayload, loadLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { hasShippedLesson } from "@/lib/academy/lessons/registry";
import { fillCashPlaceholder } from "@/lib/academy/lessons/payload/cash-placeholder";
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
      pairImage: "lars-thinking-512.webp",
    });
    expect(binary).toMatchObject({
      type: "binary-choice",
      id: "short-fun-reality",
      optionA: { isCorrect: true },
      pairImage: "lars-sitting-512.webp",
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
      sourceLabel: "8",
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
    expect(hasShippedLesson(7)).toBe(true);
    expect(hasShippedLesson(8)).toBe(true);
    expect(hasShippedLesson(9)).toBe(true);
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
    expect(lesson8.screens.map((screen) => screen.type)).toEqual([
      "spotlight-rounds",
      "spotlight-rounds",
      "binary-choice",
      "spotlight-rounds",
      "binary-choice",
      "binary-choice",
      "spotlight-rounds",
      "spotlight-rounds",
      "binary-choice",
      "binary-choice",
      "binary-choice",
      "binary-choice",
      "binary-choice",
      "completion",
    ]);
    const phoneCase = lesson8.screens[0];
    expect(phoneCase).toMatchObject({ type: "spotlight-rounds" });
    if (phoneCase?.type !== "spotlight-rounds") return;
    expect(phoneCase.options?.map((option) => option.label)).toEqual([
      "Buy it. He wants it and will have money left over",
      "Don’t buy it. He doesn’t need it",
    ]);
    const labels = phoneCase.options?.map((option) => option.label).join(" ") ?? "";
    expect(labels).not.toMatch(/CHOICE|CORRECT|→|SET cash|GO Screen/);
    expect(phoneCase.decisionPath).toBe(true);
    expect(phoneCase.options).toEqual([
      {
        label: "Buy it. He wants it and will have money left over",
        isCorrect: true,
        cashUpdate: { op: "set", amount: 6 },
        goToLabel: "2",
        goToIndex: 1,
      },
      {
        label: "Don’t buy it. He doesn’t need it",
        isCorrect: false,
        cashUpdate: { op: "set", amount: 15 },
        goToLabel: "2",
        goToIndex: 1,
      },
    ]);

    const arcade = lesson8.screens[1];
    const cinema = lesson8.screens[7];
    expect(arcade).toMatchObject({ type: "spotlight-rounds" });
    expect(cinema).toMatchObject({ type: "spotlight-rounds" });
    if (arcade?.type !== "spotlight-rounds" || cinema?.type !== "spotlight-rounds") return;
    expect(arcade.options?.[0]?.cashUpdate).toEqual({ op: "adjust", delta: -8 });
    expect(arcade.prompt).toContain("{cash}");
    expect(cinema.prompt).toContain("{cash}");
    expect(fillCashPlaceholder(arcade.prompt, 6)).toBe(arcade.prompt.split("{cash}").join("$6"));
    expect(fillCashPlaceholder(arcade.prompt, 15)).toBe(arcade.prompt.split("{cash}").join("$15"));
    expect(fillCashPlaceholder(arcade.prompt, 6)).toContain("Lars has $6 left");
    expect(fillCashPlaceholder(arcade.prompt, 15)).toContain("Lars has $15 left");
    expect(fillCashPlaceholder(cinema.prompt, 5)).toContain("Mia has $5 left");
    expect(fillCashPlaceholder(cinema.prompt, 14)).toContain("Mia has $14 left");
    expect(fillCashPlaceholder(arcade.prompt, 6)).not.toContain("{cash}");
    expect(fillCashPlaceholder(cinema.prompt, 14)).not.toContain("{cash}");

    const keptTheCase = lesson8.screens[2];
    expect(keptTheCase).toMatchObject({
      type: "binary-choice",
      id: "screen-2-alt",
      continueToLabel: "3",
      continueToIndex: 3,
      options: [],
    });
    if (keptTheCase?.type === "binary-choice") {
      expect(keptTheCase.optionA).toBeUndefined();
      expect(keptTheCase.optionB).toBeUndefined();
      expect(keptTheCase.prompt).toContain("bought the case");
    }
    expect(lesson8.screens[4]).toMatchObject({
      continueToLabel: "5",
      continueToIndex: 6,
    });
    expect(lesson8.screens[5]).toMatchObject({
      continueToLabel: "5",
      continueToIndex: 6,
    });
    expect(lesson8.screens[8]).toMatchObject({
      sourceLabel: "7",
      continueToLabel: "8",
      continueToIndex: 12,
    });
    expect(lesson8.screens[10]).toMatchObject({
      sourceLabel: "7-alt",
      continueToLabel: "8",
      continueToIndex: 12,
    });

    const arcadeChoices = lesson8.screens[1];
    expect(arcadeChoices).toMatchObject({ type: "spotlight-rounds", decisionPath: true });
    if (arcadeChoices?.type === "spotlight-rounds") {
      expect(arcadeChoices.prompt).toContain("An arcade game card is $8");
      expect(arcadeChoices.promptWhen).toEqual([
        {
          text: "Lars has {cash} left. The arcade card is $8, so he can’t pay. What do you want Lars to do?",
          showWhen: { op: "lt", amount: 8 },
        },
      ]);
      expect(arcadeChoices.options).toEqual([
        {
          label: "Pay $8",
          isCorrect: true,
          cashUpdate: { op: "adjust", delta: -8 },
          goToLabel: "3",
          goToIndex: 3,
          showWhen: { op: "gte", amount: 8 },
        },
        {
          label: "Skip the arcade and keep the money",
          isCorrect: false,
          goToLabel: "3",
          goToIndex: 3,
          showWhen: { op: "gte", amount: 8 },
        },
        {
          label: "See what would have happened if he hadn’t bought the case",
          isCorrect: false,
          goToLabel: "2-alt",
          goToIndex: 2,
          showWhen: { op: "lt", amount: 8 },
        },
        {
          label: "Skip the arcade",
          isCorrect: false,
          goToLabel: "3",
          goToIndex: 3,
          showWhen: { op: "lt", amount: 8 },
        },
      ]);
    }

    const cinemaChoices = lesson8.screens[7];
    if (cinemaChoices?.type === "spotlight-rounds") {
      expect(cinemaChoices.options?.map((option) => option.showWhen)).toEqual([
        { op: "eq", amount: 5 },
        { op: "eq", amount: 5 },
        { op: "eq", amount: 14 },
        { op: "eq", amount: 14 },
      ]);
      expect(cinemaChoices.options?.[2]).toMatchObject({
        goToLabel: "7-alt",
        goToIndex: 10,
        cashUpdate: { op: "set", amount: 6 },
      });
    }

    const lowCashPrompt = (cohort: "pathfinder" | "maverick", name: string) => {
      const screen = resolvePayloadLesson(loadBundledLessonPayload(1, 8), cohort, 8).screens[1];
      expect(screen).toMatchObject({ type: "spotlight-rounds" });
      if (screen?.type !== "spotlight-rounds") return;
      expect(screen.prompt).toContain("An arcade game card is $8");
      expect(screen.promptWhen?.[0]?.text).toBe(
        `${name} has {cash} left. The arcade card is $8, so ${name === "Holly" ? "she" : "he"} can’t pay. What do you want ${name} to do?`,
      );
      expect(screen.options?.map((option) => option.label)).toEqual([
        "Pay $8",
        "Skip the arcade and keep the money",
        `See what would have happened if ${name === "Holly" ? "she" : "he"} hadn’t bought the case`,
        "Skip the arcade",
      ]);
    };
    lowCashPrompt("pathfinder", "Holly");
    lowCashPrompt("maverick", "Aiden");

    const senna = lesson8.screens[3];
    if (senna?.type === "spotlight-rounds") {
      expect(senna.options?.[1]).toMatchObject({ goToLabel: "4-alt", goToIndex: 5 });
    }

    const water = lesson8.screens[6];
    expect(water).toMatchObject({
      type: "spotlight-rounds",
      decisionPath: true,
      options: [
        {
          label: "Buy the water bottle ($9)",
          cashUpdate: { op: "set", amount: 5 },
          goToLabel: "6",
          goToIndex: 7,
        },
        {
          label: "Don’t buy the water bottle",
          cashUpdate: { op: "set", amount: 14 },
          goToLabel: "6",
          goToIndex: 7,
        },
      ],
    });

    const missedAfternoon = (
      cohort: "explorer" | "pathfinder" | "maverick",
      name: "Senna" | "Immi" | "Dash",
      event: string,
    ) => {
      const screen = resolvePayloadLesson(loadBundledLessonPayload(1, 8), cohort, 8).screens[5];
      const possessive = name === "Immi" ? "her" : "his";
      const pronoun = name === "Immi" ? "she" : "he";
      expect(screen).toMatchObject({
        type: "binary-choice",
        sourceLabel: "4-alt",
        prompt: `The next day everyone is talking about how good the ${event} was, and they all went to lunch after. ${name} still has ${possessive} $20, but ${pronoun} missed all of it.`,
      });
    };
    missedAfternoon("explorer", "Senna", "skateboard session");
    missedAfternoon("pathfinder", "Immi", "derby");
    missedAfternoon("maverick", "Dash", "gym session");

    const wrapUp = (cohort: "explorer" | "pathfinder" | "maverick", name: string) => {
      const screen = resolvePayloadLesson(loadBundledLessonPayload(1, 8), cohort, 8).screens[12];
      expect(screen).toMatchObject({
        type: "binary-choice",
        sourceLabel: "8",
        continueToLabel: "9",
        prompt: `Every choice you made shaped ${name}'s day. Spending on things that matter to you, like time with friends, can be worth it. Keeping some money back is smart too. It's about finding the right balance. That's real money thinking!`,
      });
    };
    wrapUp("explorer", "Senna");
    wrapUp("pathfinder", "Immi");
    wrapUp("maverick", "Dash");
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

  it("loads lesson 7 as eight screens with the skill nominations", () => {
    const lesson7 = resolvePayloadLesson(loadBundledLessonPayload(1, 7), "explorer", 7);
    expect(lesson7.screens.map((screen) => screen.type)).toEqual([
      "word-drop",
      "binary-choice",
      "binary-choice",
      "savings-goal",
      "binary-choice",
      "binary-choice",
      "drag-to-target",
      "completion",
    ]);
    expect(lesson7.screens[1]).toMatchObject({
      prompt: "Lars remembers he still needs to pay for Senna's headphones that he broke. Replacing Senna's headphones is a...",
      options: [
        { label: "Want", isCorrect: false },
        { label: "Need", isCorrect: true },
      ],
    });
    expect(lesson7.screens[2]).toMatchObject({
      prompt: "Replacing Senna's headphones comes before the gelato. Which skill is that?",
      options: [
        { label: "Stop & Think", isCorrect: false },
        { label: "Put Needs First", isCorrect: true },
        { label: "Keep Spare Cash", isCorrect: false },
      ],
    });
    expect(lesson7.screens[5]).toMatchObject({
      prompt:
        "Sharing the gelato leaves Lars some money. Buying his own leaves $0. Which skill is he using when he shares?",
      options: [
        { label: "Stop & Think", isCorrect: false },
        { label: "Put Needs First", isCorrect: false },
        { label: "Keep Spare Cash", isCorrect: true },
      ],
    });

    const pathfinder = resolvePayloadLesson(loadBundledLessonPayload(1, 7), "pathfinder", 7);
    expect(pathfinder.screens[2]).toMatchObject({
      prompt: "Replacing Mia's headphones comes before the gelato. Which skill is that?",
    });
    expect(pathfinder.screens[5]).toMatchObject({
      prompt:
        "Sharing the gelato leaves Holly some money. Buying her own leaves $0. Which skill is she using when she shares?",
    });

    const maverick = resolvePayloadLesson(loadBundledLessonPayload(1, 7), "maverick", 7);
    expect(maverick.screens[2]).toMatchObject({
      prompt: "Replacing Dash's headphones comes before the energy drink. Which skill is that?",
    });
    expect(maverick.screens[5]).toMatchObject({
      prompt:
        "Splitting the 2-for-1 energy drink leaves Aiden some money. Buying one at full price leaves $0. Which skill is he using?",
    });
  });

  it("counts lesson 7 savings down from the available amount", () => {
    const lesson7 = resolvePayloadLesson(loadBundledLessonPayload(1, 7), "explorer", 7);
    const savings = lesson7.screens[3];
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

  it("updates the lesson 4 phone screens for every cohort", () => {
    for (const cohort of ["explorer", "pathfinder", "maverick"] as const) {
      const lesson = resolvePayloadLesson(loadBundledLessonPayload(1, 4), cohort, 4);
      const sign = lesson.screens[3];
      const advice = lesson.screens[4];
      const swipe = lesson.screens[5];
      const savings = lesson.screens[6];
      const sequence = lesson.screens[1];
      const thoughts = lesson.screens[2];
      expect(sequence).toMatchObject({ type: "bucket-sort", layout: "steps-row" });
      if (sequence?.type === "bucket-sort") {
        expect(sequence.items).toHaveLength(4);
        expect(sequence.buckets.map((bucket) => bucket.label)).toEqual([
          "Step 1",
          "Step 2",
          "Step 3",
          "Step 4",
        ]);
      }
      expect(thoughts).toMatchObject({ type: "bucket-sort", layout: "statement-sort" });
      if (thoughts?.type === "bucket-sort") {
        expect(thoughts.items).toHaveLength(6);
        expect(thoughts.buckets.map((bucket) => bucket.id)).toEqual(["rushing", "thinking"]);
      }
      expect(sign).toMatchObject({
        type: "binary-choice",
        pairImage: "fishing-rod-sign.webp",
        optionLayout: "radio-list",
      });
      if (sign?.type === "binary-choice") {
        expect(sign.options?.filter((option) => option.isCorrect)).toHaveLength(3);
        expect(sign.options?.some((option) => option.label === "DON'T MISS OUT!")).toBe(true);
      }
      expect(advice).toMatchObject({ type: "binary-choice" });
      if (advice?.type === "binary-choice") {
        expect(advice.prompt).toMatch(/limited-time offer for extra lives/i);
        expect(advice.options?.map((option) => option.label)).toEqual([
          "Do I really need this?",
          "Do I want it now, or is something rushing me?",
          "Will I have enough left for my goals?",
          "CLICK HERE TO BUY NOW!",
        ]);
        expect(advice.options?.filter((option) => option.isCorrect)).toHaveLength(3);
        expect(advice.options?.[3]?.isCorrect).toBe(false);
      }
      expect(swipe).toMatchObject({
        type: "drag-to-target",
        sourceLabel: "Spend Now",
        targetLabel: "Save for Later",
        sourceImageFile: "money-coin.webp",
        targetImageFile: "piggy-bank.webp",
        coinCount: 1,
      });
      expect(savings).toMatchObject({
        type: "savings-goal",
        targetAmount: 20,
        showsRemaining: false,
        meterLabel: "Savings",
      });
      if (savings?.type !== "savings-goal") continue;
      expect(savings.intro).toMatch(/\$20/);
      expect(savings.items.reduce((sum, item) => sum + item.price, 0)).toBe(20);
      expect(savings.dropZoneLabel).toMatch(/didn't buy/i);
    }
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
