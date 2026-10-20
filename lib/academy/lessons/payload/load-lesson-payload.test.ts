import { describe, expect, it } from "vitest";
import { loadBundledLessonPayload, loadLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { hasShippedLesson } from "@/lib/academy/lessons/registry";
import { fillCashPlaceholder } from "@/lib/academy/lessons/payload/cash-placeholder";
import { mapPayloadScreen, resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
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
      "multiple-choice",
      "bucket-sort",
      "spotlight-rounds",
      "multiple-choice",
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

  it("gives each Keep Spare Cash screen its own prompt and options", () => {
    const cohorts = [
      {
        cohort: "explorer" as const,
        round: "Lars saved his money last week so now he can pay his half of the cinema outing.",
        question: /How much does Lars have left after he pays his half/i,
        amounts: ["$6", "$9", "$0"],
        story: "Lars grins and tells Mason “I’m in!”.",
        slide: /Slide to move \$9 from Lars/i,
      },
      {
        cohort: "pathfinder" as const,
        round: "Holly saved her money last week so now she can pay her half of the cinema outing.",
        question: /How much does Holly have left after she pays her half/i,
        amounts: ["$6", "$9", "$0"],
        story: "Holly grins and tells Immi “I’m in!”.",
        slide: /Slide to move \$9 from Holly/i,
      },
      {
        cohort: "maverick" as const,
        round: "Aiden saved his money last week so now he can pay for the cinema outing.",
        question: /How much does Aiden have left after he pays for the cinema/i,
        amounts: ["$12", "$18", "$0"],
        story: "Aiden grins and tells Max “I’m in!”.",
        slide: /Slide to move \$18 of Aiden/i,
      },
    ];

    for (const row of cohorts) {
      const content = resolvePayloadLesson(loadBundledLessonPayload(1, 6), row.cohort, 6);
      const rounds = content.screens[3];
      expect(rounds).toMatchObject({
        type: "spotlight-rounds",
        prompt: "True or False?",
      });
      if (rounds?.type !== "spotlight-rounds") continue;
      expect(rounds.rounds).toHaveLength(3);
      expect(rounds.rounds[0]?.prompt).toBe(row.round);
      expect(rounds.rounds[0]?.prompt).not.toMatch(/gelato/i);
      expect(
        rounds.rounds.every((round) => round.optionA === "True" && round.optionB === "False"),
      ).toBe(true);

      const math = content.screens[4];
      expect(math).toMatchObject({ type: "multiple-choice" });
      if (math?.type !== "multiple-choice") continue;
      expect(math.prompt).toMatch(row.question);
      expect(math.prompt).not.toMatch(/has enough/i);
      expect(math.options?.map((option) => option.label)).toEqual(row.amounts);
      expect(math.options?.map((option) => option.emoji)).toEqual(["💵", "🎟️", "🫙"]);

      const slider = content.screens[6];
      expect(slider).toMatchObject({ type: "allocation-slider" });
      if (slider?.type !== "allocation-slider") continue;
      expect(slider.intro).toBe(row.story);
      expect(slider.instruction).toMatch(row.slide);
      expect(slider.intro).not.toMatch(/^slide/i);
    }
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
      "binary-choice",
      "binary-choice",
      "spotlight-rounds",
      "binary-choice",
      "binary-choice",
      "binary-choice",
      "binary-choice",
      "spotlight-rounds",
      "binary-choice",
      "binary-choice",
      "spotlight-rounds",
      "binary-choice",
      "binary-choice",
      "spotlight-rounds",
      "binary-choice",
      "binary-choice",
      "binary-choice",
      "binary-choice",
      "narrative-bonus",
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
        emoji: "🛍️",
        cashUpdate: { op: "set", amount: 6 },
        goToLabel: "1-buy",
        goToIndex: 1,
      },
      {
        label: "Don’t buy it. He doesn’t need it",
        isCorrect: false,
        emoji: "✋",
        cashUpdate: { op: "set", amount: 15 },
        goToLabel: "1-keep",
        goToIndex: 2,
      },
    ]);

    const arcade = lesson8.screens[3];
    const cinema = lesson8.screens[14];
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

    const keptTheCase = lesson8.screens[7];
    expect(keptTheCase).toMatchObject({
      type: "binary-choice",
      id: "screen-2-alt",
      continueToLabel: "3",
      continueToIndex: 8,
      options: [],
    });
    if (keptTheCase?.type === "binary-choice") {
      expect(keptTheCase.optionA).toBeUndefined();
      expect(keptTheCase.optionB).toBeUndefined();
      expect(keptTheCase.prompt).toContain("bought the case");
    }
    expect(lesson8.screens[9]).toMatchObject({
      continueToLabel: "5",
      continueToIndex: 11,
    });
    expect(lesson8.screens[10]).toMatchObject({
      continueToLabel: "5",
      continueToIndex: 11,
    });
    expect(lesson8.screens[15]).toMatchObject({
      sourceLabel: "7",
      continueToLabel: "8",
      continueToIndex: 19,
    });
    expect(lesson8.screens[17]).toMatchObject({
      sourceLabel: "7-alt",
      continueToLabel: "8",
      continueToIndex: 19,
    });

    const arcadeChoices = lesson8.screens[3];
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
          emoji: "🕹️",
          isCorrect: true,
          cashUpdate: { op: "adjust", delta: -8 },
          goToLabel: "2-played",
          goToIndex: 4,
          showWhen: { op: "gte", amount: 8 },
        },
        {
          label: "Skip the arcade and keep the money",
          emoji: "💰",
          isCorrect: false,
          goToLabel: "2-kept",
          goToIndex: 5,
          showWhen: { op: "gte", amount: 8 },
        },
        {
          label: "See what would have happened if he hadn’t bought the case",
          emoji: "💭",
          isCorrect: false,
          goToLabel: "2-alt",
          goToIndex: 7,
          showWhen: { op: "lt", amount: 8 },
        },
        {
          label: "Skip the arcade",
          emoji: "🚶",
          isCorrect: false,
          goToLabel: "2-short",
          goToIndex: 6,
          showWhen: { op: "lt", amount: 8 },
        },
      ]);
    }

    const cinemaChoices = lesson8.screens[14];
    if (cinemaChoices?.type === "spotlight-rounds") {
      expect(cinemaChoices.options?.map((option) => option.showWhen)).toEqual([
        { op: "eq", amount: 5 },
        { op: "eq", amount: 5 },
        { op: "eq", amount: 14 },
        { op: "eq", amount: 14 },
      ]);
      expect(cinemaChoices.options?.[2]).toMatchObject({
        goToLabel: "7-alt",
        goToIndex: 17,
        cashUpdate: { op: "set", amount: 6 },
      });
    }

    const lowCashPrompt = (cohort: "pathfinder" | "maverick", name: string) => {
      const screen = resolvePayloadLesson(loadBundledLessonPayload(1, 8), cohort, 8).screens.find(
        (item) => item.sourceLabel === "2",
      );
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

    const senna = lesson8.screens[8];
    if (senna?.type === "spotlight-rounds") {
      expect(senna.options?.[1]).toMatchObject({ goToLabel: "4-alt", goToIndex: 10 });
    }

    const water = lesson8.screens[11];
    expect(water).toMatchObject({
      type: "spotlight-rounds",
      decisionPath: true,
      options: [
        {
          label: "Buy the water bottle ($9)",
          emoji: "🧴",
          cashUpdate: { op: "set", amount: 5 },
          goToLabel: "5-buy",
          goToIndex: 12,
        },
        {
          label: "Don’t buy the water bottle",
          emoji: "💰",
          cashUpdate: { op: "set", amount: 14 },
          goToLabel: "5-save",
          goToIndex: 13,
        },
      ],
    });

    const missedAfternoon = (
      cohort: "explorer" | "pathfinder" | "maverick",
      name: "Senna" | "Immi" | "Dash",
      event: string,
    ) => {
      const screen = resolvePayloadLesson(loadBundledLessonPayload(1, 8), cohort, 8).screens.find(
        (item) => item.sourceLabel === "4-alt",
      );
      const possessive = name === "Immi" ? "her" : "his";
      const pronoun = name === "Immi" ? "she" : "he";
      expect(screen).toMatchObject({
        type: "binary-choice",
        sourceLabel: "4-alt",
        prompt: `The next day everyone is talking about how good the ${event} was, and they all went to lunch after. ${name} still has ${possessive} {cash}, but ${pronoun} missed all of it.`,
      });
    };
    missedAfternoon("explorer", "Senna", "skateboard session");
    missedAfternoon("pathfinder", "Immi", "derby");
    missedAfternoon("maverick", "Dash", "gym session");

    const wrapUp = (cohort: "explorer" | "pathfinder" | "maverick", name: string) => {
      const screen = resolvePayloadLesson(loadBundledLessonPayload(1, 8), cohort, 8).screens.find(
        (item) => item.sourceLabel === "8",
      );
      expect(screen).toMatchObject({
        type: "narrative-bonus",
        resolution: true,
        sourceLabel: "8",
        continueToLabel: "9",
        narrative: `Every choice you made shaped ${name}'s day. Spending on things that matter to you, like time with friends, can be worth it. Keeping some money back is smart too. It's about finding the right balance. That's real money thinking!`,
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
      "multiple-choice",
      "savings-goal",
      "binary-choice",
      "multiple-choice",
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
        "🧠 stops and thinks",
        "🛍️ buys it straight away",
        "🙋 asks Mia to pay for it",
      ],
      correctOption: "🧠 stops and thinks",
    });

    const lesson9 = resolvePayloadLesson(loadBundledLessonPayload(1, 9), "explorer", 9);
    const lesson9Drop = lesson9.screens.find((screen) => screen.type === "word-drop");
    expect(lesson9Drop).toMatchObject({
      options: ["💸 afford", "✨ want", "👀 see"],
      correctOption: "💸 afford",
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
      const lead =
        cohort === "explorer" ? "Lars" : cohort === "pathfinder" ? "Holly" : "Aiden";
      expect(thoughts).toMatchObject({
        type: "spotlight-rounds",
        prompt: `Which one helps ${lead} stop and think?`,
        pairImage: false,
      });
      if (thoughts?.type === "spotlight-rounds") {
        expect(
          thoughts.rounds.map((round) => [
            round.optionA,
            round.iconA,
            round.optionB,
            round.iconB,
            round.correct,
          ]),
        ).toEqual([
          [
            "It's a limited time offer - I have to buy it now!",
            "⏰",
            "I can wait and get it cheaper later.",
            "💰",
            "b",
          ],
          [
            "It looks cool, I need it right now!",
            "🔥",
            "I'll sleep on it and decide tomorrow.",
            "😴",
            "b",
          ],
          [
            "Everyone has it, I don't want to be left out.",
            "👥",
            "I'll ask my friends if it's actually any good.",
            "💬",
            "b",
          ],
        ]);
        expect(thoughts.rounds.every((round) => round.error.includes("rushing you"))).toBe(true);
      }
      expect(sign).toMatchObject({
        type: "multiple-choice",
        pairImage: "fishing-rod-sign.webp",
        optionLayout: "radio-list",
      });
      if (sign?.type === "multiple-choice") {
        expect(sign.options?.filter((option) => option.isCorrect)).toHaveLength(3);
        expect(sign.options?.some((option) => option.label === "DON'T MISS OUT!")).toBe(true);
      }
      expect(advice).toMatchObject({ type: "multiple-choice" });
      if (advice?.type === "multiple-choice") {
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

  it("maps a Pick One ROUNDS block into three spotlight rounds", () => {
    const row = loadBundledLessonPayload(1, 2).screens[2];
    expect(row).toBeDefined();
    if (!row) return;
    const screen = mapPayloadScreen(row, "explorer");
    expect(screen).toMatchObject({ type: "spotlight-rounds" });
    if (screen.type !== "spotlight-rounds") return;
    expect(screen.rounds.map((round) => round.correct)).toEqual(["b", "a", "b"]);
    expect(screen.rounds[0]?.optionA).toBe(
      "A new phone case, even though his old one is still fine",
    );
    expect(screen.rounds[0]?.optionB).not.toMatch(/\|/);
  });

  it("maps lesson 3 link-match pairs without inventing hint copy", () => {
    const payload = loadBundledLessonPayload(1, 3);
    const row = payload.screens.find((screen) => screen.gameType === "link-match");
    expect(row).toBeDefined();
    if (!row) return;

    const explorer = mapPayloadScreen(row, "explorer");
    expect(explorer).toMatchObject({
      type: "link-match",
      intro:
        "Holly explains that keeping Spare Cash gives you options. Match the event to what's possible if you have cash:",
      eventColumnLabel: "Events",
      benefitColumnLabel: "Possibilities",
      pairImage: "holly-hands-on-hips-512.webp",
      pairs: [
        {
          event: "I broke my brother's headphones",
          benefit: "I can replace them",
        },
        {
          event: "It's my friend's birthday",
          benefit: "I can buy a gift",
        },
        {
          event: "There's a sale at the game store",
          benefit: "I can buy my favourite game now",
        },
      ],
    });
    if (explorer.type === "link-match") {
      expect(explorer.wrongError).toBeUndefined();
    }

    const pathfinder = mapPayloadScreen(row, "pathfinder");
    if (pathfinder.type === "link-match") {
      expect(pathfinder.intro).toBe(
        "Mia explains that keeping Cash for Emergencies gives you options. Match the event to what's possible if you have cash:",
      );
      expect(pathfinder.pairs[0]?.event).toBe("I broke my sister's headphones");
      expect(pathfinder.wrongError).toBeUndefined();
    }

    const lesson = resolvePayloadLesson(payload, "explorer", 3);
    expect(lesson.screens.map((screen) => screen.type)).toContain("link-match");
  });

  it("keeps lesson 2's true or false statement on its own screen", () => {
    const row = loadBundledLessonPayload(1, 2).screens.find((screen) => screen.screenLabel === "1");
    expect(row).toBeDefined();
    if (!row) return;
    const opening = mapPayloadScreen(row, "explorer");
    expect(opening).toMatchObject({
      type: "true-false",
      correctAnswer: "false",
    });
    if (opening?.type !== "true-false") return;
    expect(opening.prompt).toMatch(/Senna's birthday/i);
    expect(opening.prompt).not.toMatch(/sour worms|headphones|gelato deal/i);
  });

  it("keeps lesson 5 pathfinder settings on the gelato story", () => {
    const lesson = resolvePayloadLesson(loadBundledLessonPayload(1, 5), "pathfinder", 5);
    expect(lesson.screens.map((screen) => screen.type)).toEqual([
      "word-drop",
      "binary-choice",
      "true-false",
      "bucket-sort",
      "spotlight-rounds",
      "rank-order",
      "narrative-bonus",
      "completion",
    ]);
    const drop = lesson.screens[0];
    expect(drop).toMatchObject({
      type: "word-drop",
      options: ["Want", "Need", "Bill"],
      correctOption: "Want",
    });
    const truth = lesson.screens[2];
    expect(truth).toMatchObject({
      type: "true-false",
      correctAnswer: "false",
    });
    if (truth?.type === "true-false") {
      expect(truth.prompt).toMatch(/gelato is a 'need'/i);
      expect(truth.prompt).not.toMatch(/limited time offer - I have to buy/i);
    }
    const rank = lesson.screens[5];
    expect(rank).toMatchObject({ type: "rank-order" });
    if (rank?.type === "rank-order") {
      expect(rank.items.map((item) => item.label).join(" ")).toMatch(/gelato/i);
      expect(rank.items.map((item) => item.label).join(" ")).not.toMatch(/Spend Now/i);
    }
    const celebration = lesson.screens[6];
    expect(celebration).toMatchObject({
      type: "narrative-bonus",
      resolution: true,
      continueToLabel: "8",
      bonusXp: 0,
    });
    if (celebration && "narrative" in celebration) {
      expect(celebration.narrative).toMatch(/share the gelato/i);
    }
  });

  it("shows a wrap-up after every lesson 8 choice before the next scenario", () => {
    const lesson = resolvePayloadLesson(loadBundledLessonPayload(1, 8), "explorer", 8);
    const byLabel = new Map(lesson.screens.map((screen) => [screen.sourceLabel, screen]));

    const phone = byLabel.get("1");
    const arcade = byLabel.get("2");
    const water = byLabel.get("5");
    const senna = byLabel.get("3");
    const cinema = byLabel.get("6");
    expect(phone?.type).toBe("spotlight-rounds");
    expect(arcade?.type).toBe("spotlight-rounds");
    expect(water?.type).toBe("spotlight-rounds");
    if (phone?.type !== "spotlight-rounds" || arcade?.type !== "spotlight-rounds" || water?.type !== "spotlight-rounds") {
      return;
    }
    expect(phone.options?.map((option) => option.goToLabel)).toEqual(["1-buy", "1-keep"]);
    expect(arcade.options?.map((option) => option.goToLabel)).toEqual([
      "2-played",
      "2-kept",
      "2-alt",
      "2-short",
    ]);
    expect(water.options?.map((option) => option.goToLabel)).toEqual(["5-buy", "5-save"]);

    const written = {
      "1-buy": ["Lars buys the phone case for $9. He has {cash} left.", 6],
      "1-keep": ["Lars leaves the phone case. He still has {cash}.", 15],
      "2-played": ["Lars pays $8 and plays the arcade. He has {cash} left.", 7],
      "2-kept": ["Lars skips the arcade and keeps his {cash}.", 15],
      "2-short": ["Lars can’t pay the $8. He skips the arcade and keeps his {cash}.", 6],
      "5-buy": ["Mia buys the water bottle for $9. She has {cash} left.", 5],
      "5-save": ["Mia skips the water bottle. She still has {cash}.", 14],
    } as const;
    for (const [label, [prompt, cash]] of Object.entries(written)) {
      const screen = byLabel.get(label);
      expect(screen?.type).toBe("binary-choice");
      if (screen?.type === "binary-choice") {
        expect(screen.prompt).toBe(prompt);
        expect(fillCashPlaceholder(screen.prompt, cash)).toBe(
          prompt.split("{cash}").join(`$${cash}`),
        );
        expect(screen.continueToLabel).toBeTruthy();
      }
    }

    for (const label of ["4", "4-alt", "7", "7-skip", "7-alt", "7-home", "2-alt"]) {
      const screen = byLabel.get(label);
      expect(screen?.type).toBe("binary-choice");
      if (screen?.type === "binary-choice") {
        expect(screen.continueToLabel).toBeTruthy();
        expect(screen.prompt.trim().length).toBeGreaterThan(0);
      }
    }
    expect(senna?.type).toBe("spotlight-rounds");
    expect(cinema?.type).toBe("spotlight-rounds");
    expect(byLabel.get("1-buy") && "continueToLabel" in byLabel.get("1-buy")!).toBeTruthy();
    expect(byLabel.get("2-played")).toMatchObject({ continueToLabel: "3" });
    expect(byLabel.get("2-short")).toMatchObject({ continueToLabel: "3" });
    expect(byLabel.get("5-buy")).toMatchObject({ continueToLabel: "6" });
    expect(byLabel.get("5-save")).toMatchObject({ continueToLabel: "6" });
  });

  it("maps budget-select totals, tagged items, and correct names", () => {
    const row = {
      screenNumber: 4,
      screenLabel: "4",
      gameType: "budget-select",
      text: {
        explorer: "You have $30 left. Check the boxes to buy what you actually need.",
        pathfinder: "You have $30 left. Check the boxes to buy what you actually need.",
        maverick: "",
      },
      image: { explorer: "not allowed", pathfinder: "not allowed", maverick: "" },
      settings: {
        explorer: `TOTAL: 30
ITEMS:
NEED: 🚍 Bus Pass ($15)
WANT: ⚡Energy Drink ($10)
NEED: 🔌 Phone Cable ($15)
CORRECT: bus,cable`,
        pathfinder: `TOTAL: 30
ITEMS:
NEED: 🚍 Bus Pass ($15)
WANT: ⚡ Energy Drink ($10)
NEED: 🐕 Dog lead ($15)
CORRECT: bus,dog lead`,
        maverick: "",
      },
      error: {
        explorer: "Uncheck the thing you don't really need.",
        pathfinder: "Uncheck the item you don't really 'need'.",
        maverick: "",
      },
    };

    const explorer = mapPayloadScreen(row, "explorer");
    expect(explorer).toMatchObject({
      type: "budget-select",
      total: 30,
      pairImage: false,
      errors: {
        overBudget: "Uncheck the thing you don't really need.",
        wrongSelection: "Uncheck the thing you don't really need.",
      },
    });
    if (explorer.type !== "budget-select") return;
    expect(explorer.errors.itemHints).toBeUndefined();
    expect(explorer.items.map((item) => [item.emoji, item.label, item.price])).toEqual([
      ["🚍", "Bus Pass", 15],
      ["⚡", "Energy Drink", 10],
      ["🔌", "Phone Cable", 15],
    ]);
    expect(explorer.correctIds).toEqual([
      explorer.items[0]?.id,
      explorer.items[2]?.id,
    ]);

    const pathfinder = mapPayloadScreen(row, "pathfinder");
    if (pathfinder.type !== "budget-select") return;
    expect(pathfinder.items.map((item) => item.label)).toEqual([
      "Bus Pass",
      "Energy Drink",
      "Dog lead",
    ]);
    expect(pathfinder.correctIds).toEqual([
      pathfinder.items[0]?.id,
      pathfinder.items[2]?.id,
    ]);
    expect(pathfinder.errors.overBudget).toBe("Uncheck the item you don't really 'need'.");

    const maverick = mapPayloadScreen(row, "maverick");
    if (maverick.type !== "budget-select") return;
    expect(maverick.items.map((item) => item.label)).toEqual([
      "Bus Pass",
      "Energy Drink",
      "Dog lead",
    ]);
    expect(maverick.errors.wrongSelection).toBe("Uncheck the item you don't really 'need'.");
  });

  it("maps lesson 2 budget-select from the CSV for every cohort", () => {
    const row = loadBundledLessonPayload(1, 2).screens.find(
      (screen) => screen.gameType === "budget-select",
    );
    expect(row).toBeDefined();
    if (!row) return;

    const explorer = mapPayloadScreen(row, "explorer");
    const pathfinder = mapPayloadScreen(row, "pathfinder");
    const maverick = mapPayloadScreen(row, "maverick");
    for (const screen of [explorer, pathfinder, maverick]) {
      expect(screen.type).toBe("budget-select");
    }
    if (
      explorer.type !== "budget-select" ||
      pathfinder.type !== "budget-select" ||
      maverick.type !== "budget-select"
    ) {
      return;
    }
    expect(explorer.items.map((item) => item.label)).toEqual([
      "Bus Pass",
      "Energy Drink",
      "Phone Cable",
    ]);
    expect(explorer.correctIds).toEqual([explorer.items[0]?.id, explorer.items[2]?.id]);
    expect(explorer.errors).toEqual({
      overBudget: "Uncheck the thing you don't really need.",
      wrongSelection: "Uncheck the thing you don't really need.",
    });
    expect(pathfinder.items.map((item) => item.label)).toEqual([
      "Bus Pass",
      "Energy Drink",
      "Dog lead",
    ]);
    expect(pathfinder.correctIds).toEqual([
      pathfinder.items[0]?.id,
      pathfinder.items[2]?.id,
    ]);
    expect(maverick.items.map((item) => item.label)).toEqual([
      "Bus Pass",
      "Energy Drink",
      "Phone Cable",
    ]);
    expect(maverick.correctIds).toEqual([maverick.items[0]?.id, maverick.items[2]?.id]);
    expect(pathfinder.errors.overBudget).toBe("Uncheck the item you don't really 'need'.");
    expect(maverick.errors.wrongSelection).toBe("Uncheck the item you don't really 'need'.");
  });

  it("maps lesson 2 gift drag ids onto illustration art", () => {
    const lesson = resolvePayloadLesson(loadBundledLessonPayload(1, 2), "explorer", 2);
    const drag = lesson.screens.find((screen) => screen.type === "drag-to-target");
    expect(drag).toMatchObject({
      type: "drag-to-target",
      sourceIllustrationId: "concept-gift-box",
      sourceLabel: "Gift box",
      targetIllustrationId: "senna-celebrating",
      targetLabel: "Senna",
      showZoneLabels: false,
    });
    expect(`${drag && "sourceLabel" in drag ? drag.sourceLabel : ""} ${drag && "targetLabel" in drag ? drag.targetLabel : ""}`).not.toMatch(
      /[a-z0-9]+-[a-z0-9]|concept-|\/$/,
    );
    const pathfinder = resolvePayloadLesson(loadBundledLessonPayload(1, 2), "pathfinder", 2);
    const pathfinderDrag = pathfinder.screens.find((screen) => screen.type === "drag-to-target");
    const maverick = resolvePayloadLesson(loadBundledLessonPayload(1, 2), "maverick", 2);
    const maverickDrag = maverick.screens.find((screen) => screen.type === "drag-to-target");
    expect(pathfinderDrag).toMatchObject({
      sourceLabel: "Gift box",
      targetIllustrationId: "mia-celebrating",
      targetLabel: "Mia",
    });
    expect(maverickDrag).toMatchObject({
      sourceLabel: "Gift box",
      targetIllustrationId: "aiden-celebrating",
      targetLabel: "Aiden",
    });
    for (const screen of [drag, pathfinderDrag, maverickDrag]) {
      if (!screen || !("sourceLabel" in screen) || !("targetLabel" in screen)) continue;
      expect(screen.sourceLabel).not.toMatch(/[a-z0-9]+-[a-z0-9]|concept-|\//);
      expect(screen.targetLabel).not.toMatch(/[a-z0-9]+-[a-z0-9]|concept-|\//);
    }
  });

  it("maps lesson 3 screen 1 as a three-option multiple-choice with emojis", () => {
    const tracks = [
      {
        cohort: "explorer" as const,
        name: "Mia",
        prompt:
          "Mia spent all her pocket money. She accidentally steps on Holly's headphones and breaks them. Holly crashes out because:",
        wrongError: "Haha, maybe. Try again!",
        pairImage: "holly-mia-sidebyside.webp",
      },
      {
        cohort: "pathfinder" as const,
        name: "Holly",
        prompt:
          "Holly spent all her pocket money. She accidentally steps on Mia's headphones and breaks them. Mia crashes out because:",
        wrongError: "Haha, maybe. But let's try again.",
        pairImage: "holly-mia-chatting.webp",
      },
      {
        cohort: "maverick" as const,
        name: "Dash",
        prompt:
          "Dash spent all his money. He accidentally steps on Aiden's headphones and breaks them. Aiden crashes out because:",
        wrongError: "Haha, maybe. But let's try again.",
        pairImage: "aiden-dash-chatting.webp",
      },
    ];

    for (const track of tracks) {
      const lesson = resolvePayloadLesson(loadBundledLessonPayload(1, 3), track.cohort, 3);
      const screen = lesson.screens.find((item) => item.sourceLabel === "1");
      expect(screen?.type, track.cohort).toBe("multiple-choice");
      if (screen?.type !== "multiple-choice") continue;
      expect(screen.prompt, track.cohort).toBe(track.prompt);
      expect(screen.wrongError, track.cohort).toBe(track.wrongError);
      expect(screen.pairImage, track.cohort).toBe(track.pairImage);
      expect(screen.successMessage, track.cohort).toBeUndefined();
      expect(screen.optionLayout, track.cohort).toBeUndefined();
      expect(screen.options, track.cohort).toEqual([
        {
          label: `${track.name} has no money to buy a new pair`,
          isCorrect: true,
          emoji: "💸",
        },
        {
          label: `${track.name} tries to fix them with sticky tape and now they're even worse`,
          isCorrect: false,
          emoji: "🩹",
        },
        {
          label: "the dog runs off with one of the pieces",
          isCorrect: false,
          emoji: "🐶",
        },
      ]);
    }
  });

  it("maps lesson 3 screen 5 as emoji multiple-choice and keeps the wording", () => {
    const tracks = [
      {
        cohort: "explorer" as const,
        prompt:
          "Mia has $40 Spare Cash to replace the headphones. She sees a $10 toy she wants and thinks: \"I'll spend this $10 now, and I'll just save more next week to buy the headphones.\" What should Mia do?",
        options: [
          "Buy the toy and save $10 more next week.",
          "Buy the headphones to fix what she broke first.",
          "Buy the toy and hope the headphones don't cost $40.",
        ],
      },
      {
        cohort: "pathfinder" as const,
        prompt:
          "Holly has $40 Cash for Emergencies to replace the headphones. She sees a $10 craft bundle she wants and thinks: \"I'll spend this $10 now, and I'll just save more next week to buy the headphones.\" What should Holly do?",
        options: [
          "Buy the craft bundle and save $10 more next week.",
          "Buy the headphones to fix what she broke first.",
          "Buy the craft bundle and hope the headphones don't cost $40.",
        ],
      },
      {
        cohort: "maverick" as const,
        prompt:
          "Aiden has $40 Cash to replace the headphones. He sees a $20 game he wants and thinks: \"I'll spend this $20 now, and I'll just save more next week to buy the headphones.\" What should Aiden do?",
        options: [
          "Buy the game and save $20 more next week.",
          "Buy the headphones to fix what he broke first.",
          "Buy the game and hope the headphones don't cost $40.",
        ],
      },
    ];

    for (const track of tracks) {
      const lesson = resolvePayloadLesson(loadBundledLessonPayload(1, 3), track.cohort, 3);
      const screen = lesson.screens.find((item) => item.sourceLabel === "5");
      expect(screen?.type, track.cohort).toBe("multiple-choice");
      if (screen?.type !== "multiple-choice") continue;
      expect(screen.prompt, track.cohort).toBe(track.prompt);
      expect(screen.wrongError, track.cohort).toBe(
        "That's a trap! Stick to the plan to avoid stress later.",
      );
      expect(screen.options, track.cohort).toEqual([
        { label: track.options[0], isCorrect: false, emoji: "🛍️" },
        { label: track.options[1], isCorrect: true, emoji: "🎧" },
        { label: track.options[2], isCorrect: false, emoji: "🤞" },
      ]);
    }
  });

  it("maps lesson 3 spent totals and the three-blank sentence", () => {
    const lesson = resolvePayloadLesson(loadBundledLessonPayload(1, 3), "explorer", 3);
    const spent = lesson.screens[1];
    expect(spent).toMatchObject({
      type: "bucket-sort",
      layout: "spent-total",
      targetTotal: 40,
      buckets: [{ id: "spent", label: "Spent" }],
    });
    expect(spent?.type).toBe("bucket-sort");
    if (spent?.type === "bucket-sort") {
      expect(spent.items).toHaveLength(3);
      expect(spent.items.map((item) => [item.emoji, item.label, item.price, item.bucket])).toEqual([
        ["🧸", "Squishy toy", 25, "spent"],
        ["🫧", "Slime", 8, "spent"],
        ["🍫", "Snacks", 7, "spent"],
      ]);
    }
    const maverickSpent = resolvePayloadLesson(loadBundledLessonPayload(1, 3), "maverick", 3)
      .screens[1];
    expect(maverickSpent?.type).toBe("bucket-sort");
    if (maverickSpent?.type === "bucket-sort") {
      expect(maverickSpent.items).toHaveLength(3);
      expect(maverickSpent.targetTotal).toBe(40);
      expect(maverickSpent.buckets).toEqual([{ id: "spent", label: "Spent" }]);
    }
    const sentence = lesson.screens[5];
    expect(sentence).toMatchObject({
      type: "word-drop",
      prompt:
        "Because I didn't [blank] everything, I had [blank] to [blank] the headphones immediately.",
      options: [
        "🫙 save",
        "🛍️ spend",
        "💵 cash for emergencies",
        "🤝 borrowed money",
        "🎧 replace",
        "🗑️ throw away",
      ],
      blanks: [
        { correctOption: "🛍️ spend" },
        { correctOption: "💵 cash for emergencies" },
        { correctOption: "🎧 replace" },
      ],
    });
  });

  it("maps lesson 3 screen 7 as a five-option emoji multiple-choice", () => {
    const tracks = [
      {
        cohort: "explorer" as const,
        prompt:
          "Mia could fix the problem because she had cash for emergencies. What are the other benefits of not spending all of your money? Select the best answer:",
      },
      {
        cohort: "pathfinder" as const,
        prompt:
          "Holly could fix the problem because she had cash for emergencies. What are the other benefits of not spending all of your money? Select the best answer:",
      },
      {
        cohort: "maverick" as const,
        prompt:
          "Aiden could fix the problem because he had Cash for Emergencies. What are the other benefits of not spending all of your money? Select the best answer:",
      },
    ];
    const labels = [
      "If I lose something, I can replace it myself.",
      "I won't have to ask my parents for money if I need something.",
      "I can save for a big goal instead of wasting it on small stuff that doesn't last.",
      "I worry less if I can afford things that I want, or have to buy.",
      "All of the above.",
    ];

    for (const track of tracks) {
      const lesson = resolvePayloadLesson(loadBundledLessonPayload(1, 3), track.cohort, 3);
      const screen = lesson.screens.find((item) => item.sourceLabel === "7");
      expect(screen?.type, track.cohort).toBe("multiple-choice");
      if (screen?.type !== "multiple-choice") continue;
      expect(screen.prompt, track.cohort).toBe(track.prompt);
      expect(screen.wrongError, track.cohort).toBe(
        "Yes, but take a look at the other options and see if there's a better answer.",
      );
      expect(screen.pairImage, track.cohort).toBe(false);
      expect(screen.optionLayout, track.cohort).toBeUndefined();
      expect(screen.options, track.cohort).toEqual([
        { label: labels[0], isCorrect: false, emoji: "🔄" },
        { label: labels[1], isCorrect: false, emoji: "🙋" },
        { label: labels[2], isCorrect: false, emoji: "🎯" },
        { label: labels[3], isCorrect: false, emoji: "😌" },
        { label: labels[4], isCorrect: true, emoji: "✅" },
      ]);
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
