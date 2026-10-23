import { describe, expect, it } from "vitest";

import { isNeutralTrueStatement } from "@/lib/academy/lessons/all-of-the-above";
import { presentedCompletionMedals } from "@/lib/academy/lessons/completion-screen";
import {
  applyCashUpdate,
  cashMatches,
  type CashComparison,
  type CashUpdate,
} from "@/lib/academy/lessons/payload/cash-placeholder";
import { implicitNextIndex } from "@/lib/academy/lessons/payload/lesson-graph";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { ScreenConfig } from "@/lib/academy/lessons/types";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const SETTING_LEAK =
  /\b(?:CHOICE\s+[A-Z]|CORRECT|ITEMS|ROUNDS|MEDAL|SOURCE|TARGET|KEEP|TOTAL|AVAILABLE|ORDER|PAIRS|NEED|WANT|SHORT|LONG|STEP\d+|HOLD|FROZEN|BUTTON|CONTINUE|HUB|ICON\s+[A-Z])\s*:/i;
const GO_LEAK = /(?:GO\s+Screen|SET\s+cash)\b/i;
const FILE_LEAK = /\.(?:webp|png|jpe?g)\b/i;
const IMAGE_ID_LEAK = /\b(?:concept|medal-skill|penny)-[a-z0-9-]+\b/i;

type Choice = {
  label?: string;
  isCorrect?: boolean;
  cashUpdate?: CashUpdate;
  goToIndex?: number;
  showWhen?: CashComparison;
  requiresHubSkills?: readonly string[];
};

function choicesOf(screen: ScreenConfig): Choice[] {
  if (!("options" in screen) || !Array.isArray(screen.options)) return [];
  return screen.options.flatMap((option) =>
    option && typeof option === "object" && "label" in option ? [option] : [],
  );
}

function userFacingStrings(screen: ScreenConfig): string[] {
  const texts: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim()) texts.push(value);
  };

  if ("prompt" in screen) push(screen.prompt);
  if ("intro" in screen) push(screen.intro);
  if ("instruction" in screen) push(screen.instruction);
  if ("narrative" in screen) push(screen.narrative);
  if ("narrativeBefore" in screen) push(screen.narrativeBefore);
  if ("narrativeAfter" in screen) push(screen.narrativeAfter);
  if ("holdLabel" in screen) push(screen.holdLabel);
  if ("frozenLabel" in screen) push(screen.frozenLabel);
  if ("scenePrompt" in screen) push(screen.scenePrompt);
  if ("finishLabel" in screen) push(screen.finishLabel);
  if ("meterLabel" in screen) push(screen.meterLabel);
  if ("dropZoneLabel" in screen) push(screen.dropZoneLabel);
  if ("sourceLabel" in screen && screen.type === "drag-to-target") push(screen.sourceLabel);
  if ("targetLabel" in screen) push(screen.targetLabel);
  if ("poolColumnLabel" in screen) push(screen.poolColumnLabel);

  for (const choice of choicesOf(screen)) push(choice.label);
  if ("items" in screen && Array.isArray(screen.items)) {
    for (const item of screen.items) {
      if (item && typeof item === "object" && "label" in item) push(item.label);
    }
  }
  if ("buckets" in screen && Array.isArray(screen.buckets)) {
    for (const bucket of screen.buckets) push(bucket.label);
  }
  if ("rounds" in screen && Array.isArray(screen.rounds)) {
    for (const round of screen.rounds) {
      push(round.prompt);
      push(round.optionA);
      push(round.optionB);
    }
  }
  if ("pairs" in screen && Array.isArray(screen.pairs)) {
    for (const pair of screen.pairs) {
      push(pair.event);
      push(pair.benefit);
    }
  }
  if ("skills" in screen && Array.isArray(screen.skills)) {
    for (const skill of screen.skills) push(skill.label);
  }
  if (screen.type === "word-drop") {
    for (const option of screen.options) push(option);
    for (const blank of screen.blanks ?? []) {
      for (const option of blank.options) push(option);
    }
  }
  return texts;
}

function assertNoLeaks(screen: ScreenConfig, where: string) {
  for (const text of userFacingStrings(screen)) {
    expect(text, where).not.toMatch(SETTING_LEAK);
    expect(text, where).not.toMatch(GO_LEAK);
    expect(text, where).not.toMatch(FILE_LEAK);
    expect(text, where).not.toMatch(IMAGE_ID_LEAK);
  }
}

function assertPlayable(screen: ScreenConfig, where: string) {
  assertNoLeaks(screen, where);
  switch (screen.type) {
    case "word-drop": {
      const blanks =
        screen.blanks && screen.blanks.length > 0
          ? screen.blanks
          : [{ options: screen.options, correctOption: screen.correctOption }];
      expect(blanks.length, where).toBeGreaterThan(0);
      for (const blank of blanks) {
        expect(blank.options.length, where).toBeGreaterThan(0);
        expect(blank.options, where).toContain(blank.correctOption);
      }
      return;
    }
    case "binary-choice":
    case "multiple-choice": {
      if (screen.continueToLabel) {
        expect(typeof screen.continueToIndex, where).toBe("number");
        return;
      }
      const options = choicesOf(screen);
      expect(options.length, where).toBeGreaterThan(0);
      expect(options.every((option) => option.label?.trim()), where).toBe(true);
      if (screen.decisionPath || screen.skillHub) return;
      expect(options.some((option) => option.isCorrect === true), where).toBe(true);
      return;
    }
    case "true-false":
      expect(screen.correctAnswer === "true" || screen.correctAnswer === "false", where).toBe(
        true,
      );
      expect(screen.prompt.trim(), where).not.toBe("");
      return;
    case "tap-reveal":
      expect(screen.items.length, where).toBeGreaterThan(0);
      expect(screen.buckets.length, where).toBeGreaterThan(0);
      expect(
        screen.items.every((item) => screen.buckets.some((bucket) => bucket.id === item.bucket)),
        where,
      ).toBe(true);
      return;
    case "bucket-sort":
      expect(screen.items.length, where).toBeGreaterThan(0);
      expect(screen.buckets.length, where).toBeGreaterThan(0);
      expect(
        screen.items.every((item) => screen.buckets.some((bucket) => bucket.id === item.bucket)),
        where,
      ).toBe(true);
      return;
    case "spotlight-rounds":
      if (screen.decisionPath) {
        const options = choicesOf(screen);
        expect(options.length, where).toBeGreaterThan(1);
        expect(options.every((option) => typeof option.goToIndex === "number"), where).toBe(true);
        return;
      }
      expect(screen.rounds.length, where).toBeGreaterThan(0);
      for (const round of screen.rounds) {
        expect(round.optionA.trim(), where).not.toBe("");
        expect(round.optionB.trim(), where).not.toBe("");
        expect(round.correct === "a" || round.correct === "b", where).toBe(true);
      }
      return;
    case "rank-order":
      expect(screen.items.length, where).toBeGreaterThan(1);
      expect(screen.correctOrder, where).toEqual(
        expect.arrayContaining(screen.items.map((item) => item.id)),
      );
      expect(screen.correctOrder.length, where).toBe(screen.items.length);
      return;
    case "link-match":
      expect(screen.pairs.length, where).toBeGreaterThan(0);
      expect(
        screen.pairs.every((pair) => pair.event.trim() && pair.benefit.trim()),
        where,
      ).toBe(true);
      return;
    case "allocation-slider":
      expect(screen.total, where).toBeGreaterThan(0);
      expect(screen.targetMin, where).toBeGreaterThan(0);
      expect(screen.targetMin, where).toBeLessThan(screen.total);
      return;
    case "budget-select":
      expect(screen.items.length, where).toBeGreaterThan(0);
      expect(screen.correctIds.length, where).toBeGreaterThan(0);
      expect(
        screen.correctIds.every((id) => screen.items.some((item) => item.id === id)),
        where,
      ).toBe(true);
      return;
    case "hold-to-fill":
      expect(screen.holdLabel.trim(), where).not.toBe("");
      expect(screen.narrative.trim(), where).not.toBe("");
      return;
    case "drag-to-target":
      expect(screen.sourceLabel.trim(), where).not.toBe("");
      expect(screen.targetLabel.trim(), where).not.toBe("");
      return;
    case "savings-goal":
      expect(screen.items.length, where).toBeGreaterThan(0);
      expect(screen.targetAmount, where).toBeGreaterThan(0);
      expect(screen.items.every((item) => item.price > 0 && item.label.trim()), where).toBe(true);
      return;
    case "skill-hub":
      expect(screen.skills.length, where).toBeGreaterThan(0);
      expect(screen.finishLabel.trim(), where).not.toBe("");
      expect(typeof screen.finishToIndex, where).toBe("number");
      return;
    case "narrative-bonus":
      expect(screen.narrative.trim(), where).not.toBe("");
      return;
    case "completion":
      return;
    default:
      throw new Error(`${where} has no playable check for ${screen.type}`);
  }
}

type WalkState = { index: number; cash: number | null; done: string };

function withSkill(done: string, skill: string | undefined, enteringHub: boolean): string {
  if (!enteringHub || !skill) return done;
  const skills = done ? done.split("|") : [];
  if (!skills.includes(skill)) skills.push(skill);
  return skills.sort().join("|");
}

/** Every choice and fall-through, including cash gates and the lesson 9 hub lock. */
function walkLesson(screens: readonly ScreenConfig[]): {
  visited: Set<number>;
  completions: number;
  stuck: string[];
} {
  const labels = screens.map((screen) => screen.sourceLabel ?? screen.id);
  const seen = new Set<string>();
  const visited = new Set<number>();
  const stack: WalkState[] = [{ index: 0, cash: null, done: "" }];
  let completions = 0;
  const stuck: string[] = [];

  while (stack.length > 0) {
    const state = stack.pop();
    if (!state) break;
    const key = `${state.index}|${state.cash ?? "x"}|${state.done}`;
    if (seen.has(key)) continue;
    seen.add(key);
    visited.add(state.index);
    const screen = screens[state.index];
    if (!screen) {
      stuck.push(key);
      continue;
    }
    if (screen.type === "completion") {
      completions += 1;
      continue;
    }

    const options = choicesOf(screen).filter((option) =>
      cashMatches(option.showWhen, state.cash),
    );
    const jumps = options.filter(
      (option): option is Choice & { goToIndex: number } =>
        typeof option.goToIndex === "number",
    );
    if (jumps.length > 0) {
      let pushed = 0;
      for (const option of jumps) {
        const doneSkills = state.done ? state.done.split("|") : [];
        if (option.requiresHubSkills?.some((skill) => !doneSkills.includes(skill))) {
          continue;
        }
        const dest = screens[option.goToIndex];
        stack.push({
          index: option.goToIndex,
          cash: option.cashUpdate
            ? applyCashUpdate(state.cash, option.cashUpdate)
            : state.cash,
          done: withSkill(state.done, screen.hubSkillKey, Boolean(dest?.skillHub)),
        });
        pushed += 1;
      }
      if (pushed === 0) stuck.push(labels[state.index] ?? key);
      continue;
    }

    if (typeof screen.continueToIndex === "number") {
      const dest = screens[screen.continueToIndex];
      stack.push({
        index: screen.continueToIndex,
        cash: state.cash,
        done: withSkill(state.done, screen.hubSkillKey, Boolean(dest?.skillHub)),
      });
      continue;
    }

    const next = implicitNextIndex(state.index, labels);
    if (next === state.index) {
      stuck.push(labels[state.index] ?? key);
      continue;
    }
    stack.push({ index: next, cash: state.cash, done: state.done });
  }

  return { visited, completions, stuck };
}

describe("module 1 screens from Screens1.csv", () => {
  it("maps every row for every cohort into a playable screen", () => {
    for (const lessonNumber of LESSONS) {
      const payload = loadBundledLessonPayload(1, lessonNumber);
      expect(payload.screens.length, `lesson ${lessonNumber} rows`).toBeGreaterThan(0);
      for (const cohort of COHORTS) {
        const content = resolvePayloadLesson(payload, cohort, lessonNumber);
        expect(content.screens.length, `L${lessonNumber} ${cohort}`).toBe(
          payload.screens.length,
        );
        content.screens.forEach((screen, index) => {
          const row = payload.screens[index];
          const where = `L${lessonNumber} ${cohort} screen ${row?.screenLabel ?? index} (${screen.type})`;
          assertPlayable(screen, where);
          const csvError = (row ? row.error[cohort].trim() || row.error.pathfinder.trim() : "");
          if (
            csvError &&
            screen.type !== "completion" &&
            screen.type !== "narrative-bonus" &&
            screen.type !== "tap-reveal" &&
            screen.type !== "skill-hub"
          ) {
            expect(JSON.stringify(screen), where).toContain(csvError);
          }
        });
        const walk = walkLesson(content.screens);
        expect(walk.stuck, `L${lessonNumber} ${cohort} stuck`).toEqual([]);
        expect(walk.completions, `L${lessonNumber} ${cohort} completion`).toBeGreaterThan(0);
        expect(walk.visited.size, `L${lessonNumber} ${cohort} visited`).toBe(
          content.screens.length,
        );
      }
    }
  });

  it("reaches lesson 8 completion on every cash branch", () => {
    for (const cohort of COHORTS) {
      const content = resolvePayloadLesson(loadBundledLessonPayload(1, 8), cohort, 8);
      const decisions = content.screens.filter(
        (screen) => screen.type === "spotlight-rounds" && screen.decisionPath,
      );
      expect(decisions.length).toBeGreaterThan(1);
      const walk = walkLesson(content.screens);
      expect(walk.stuck).toEqual([]);
      expect(walk.completions).toBeGreaterThan(1);
      expect(content.screens.at(-1)).toMatchObject({
        type: "completion",
        suppressMedal: true,
      });
    }
  });

  it("unlocks lesson 9 Finish only after every skill path returns", () => {
    for (const cohort of COHORTS) {
      const content = resolvePayloadLesson(loadBundledLessonPayload(1, 9), cohort, 9);
      const hub = content.screens[0];
      expect(hub?.type).toBe("skill-hub");
      if (hub?.type !== "skill-hub") continue;
      const finish = choicesOf(hub).find((option) => option.requiresHubSkills);
      expect(finish?.requiresHubSkills).toEqual(["2", "4", "6"]);
      expect(hub.skills.map((skill) => skill.hubSkillKey)).toEqual(["2", "4", "6"]);
      const walk = walkLesson(content.screens);
      expect(walk.stuck).toEqual([]);
      expect(walk.visited.size).toBe(content.screens.length);
      const completion = content.screens.at(-1);
      expect(completion?.type).toBe("completion");
      expect(
        presentedCompletionMedals({
          lessonNumber: 9,
          moduleNumber: 1,
          skillMedalTier: completion?.type === "completion" ? completion.medalTier : "gold",
          suppressMedal: completion?.type === "completion" ? completion.suppressMedal : false,
        }).map((medal) => medal.medalId),
      ).toEqual(["medal-skill1-gold"]);
    }
  });

  it("gives bronze, silver, and no medal on the lesson ladder", () => {
    const expected: Record<number, { tier?: string; medalId?: string; suppress?: boolean }> = {
      1: { tier: "bronze", medalId: "medal-skill1-bronze" },
      2: { tier: "bronze", medalId: "medal-skill2-bronze" },
      3: { tier: "bronze", medalId: "medal-skill3-bronze" },
      4: { tier: "silver", medalId: "medal-skill1-silver" },
      5: { tier: "silver", medalId: "medal-skill2-silver" },
      6: { tier: "silver", medalId: "medal-skill3-silver" },
      7: { suppress: true },
      8: { suppress: true },
    };
    for (const cohort of COHORTS) {
      for (const [lesson, medal] of Object.entries(expected)) {
        const lessonNumber = Number(lesson);
        const content = resolvePayloadLesson(
          loadBundledLessonPayload(1, lessonNumber),
          cohort,
          lessonNumber,
        );
        const screen = content.screens.at(-1);
        expect(screen?.type, `L${lesson} ${cohort}`).toBe("completion");
        if (screen?.type !== "completion") continue;
        const shown = presentedCompletionMedals({
          lessonNumber,
          moduleNumber: 1,
          skillMedalTier: medal.suppress ? "bronze" : screen.medalTier,
          medalId: screen.medalId,
          authoredMedal: screen.authoredMedal,
          suppressMedal: screen.suppressMedal,
        });
        if (medal.suppress) {
          expect(screen.suppressMedal, `L${lesson} ${cohort}`).toBe(true);
          expect(screen.medalTier, `L${lesson} ${cohort}`).toBeUndefined();
          expect(shown, `L${lesson} ${cohort}`).toEqual([]);
        } else {
          expect(screen.medalTier, `L${lesson} ${cohort}`).toBe(medal.tier);
          expect(shown.map((item) => item.medalId), `L${lesson} ${cohort}`).toEqual([
            medal.medalId,
          ]);
        }
      }
    }
  });

  it("keeps all-of-the-above statements neutral until the catch-all", () => {
    for (const cohort of COHORTS) {
      const content = resolvePayloadLesson(loadBundledLessonPayload(1, 3), cohort, 3);
      const screen = content.screens.find((item) => item.sourceLabel === "7");
      expect(screen?.type).toBe("multiple-choice");
      if (screen?.type !== "multiple-choice") continue;
      const options = choicesOf(screen).map((option, index) => ({
        key: String(index),
        label: option.label ?? "",
        isCorrect: option.isCorrect === true,
      }));
      const catchAll = options.findIndex((option) => option.isCorrect);
      expect(catchAll).toBe(options.length - 1);
      expect(isNeutralTrueStatement(options, String(catchAll))).toBe(false);
      for (const option of options) {
        if (option.isCorrect) continue;
        expect(isNeutralTrueStatement(options, option.key)).toBe(true);
      }
      expect(screen.wrongError.toLowerCase()).toContain("better answer");
    }
  });

  it("keeps authored slider, savings, and drag errors and leaves blank cells blank", () => {
    const explorer = (lesson: number) =>
      resolvePayloadLesson(loadBundledLessonPayload(1, lesson), "explorer", lesson);
    const slider = explorer(6).screens.find((screen) => screen.sourceLabel === "7");
    const savings = explorer(7).screens.find((screen) => screen.sourceLabel === "4");
    const drag = explorer(7).screens.find((screen) => screen.type === "drag-to-target");
    const rank = explorer(2).screens.find((screen) => screen.sourceLabel === "6");
    const hold = explorer(1).screens.find((screen) => screen.sourceLabel === "6");
    const bucket = explorer(1).screens.find((screen) => screen.sourceLabel === "4");
    expect(slider).toMatchObject({
      type: "allocation-slider",
      total: 15,
      targetMin: 9,
      sliderError: "Slide until $9 is set aside for the cinema. $6 stays in the jar.",
    });
    expect(savings).toMatchObject({
      type: "savings-goal",
      showsRemaining: true,
      wrongError: "Check the total against the $45.",
    });
    expect(drag).toMatchObject({
      type: "drag-to-target",
      wrongError: "Drag the gelato to share it with Mia.",
    });
    expect(rank).toMatchObject({ type: "rank-order", errors: {} });
    expect(hold).toMatchObject({ type: "hold-to-fill" });
    expect(hold && "releaseHint" in hold ? hold.releaseHint : undefined).toBeUndefined();
    expect(bucket && "wrongError" in bucket ? bucket.wrongError : undefined).toBeUndefined();
  });

  it("keeps the piggy-bank empty line on the sheet and leaves the gift screen blank", () => {
    for (const cohort of COHORTS) {
      const bank = resolvePayloadLesson(loadBundledLessonPayload(1, 4), cohort, 4).screens.find(
        (screen) => screen.type === "drag-to-target",
      );
      expect(bank).toMatchObject({
        type: "drag-to-target",
        sourceEmptyMessage: "Coins saved!",
      });
    }
    const gift = resolvePayloadLesson(loadBundledLessonPayload(1, 2), "explorer", 2).screens.find(
      (screen) => screen.type === "drag-to-target",
    );
    expect(gift).toMatchObject({ type: "drag-to-target", sourceEmptyMessage: "" });
  });

  it("gives every lesson 2 lightning round an emoji on each side", () => {
    const roundsFor = (cohort: MasteryCohort) => {
      const screen = resolvePayloadLesson(loadBundledLessonPayload(1, 2), cohort, 2).screens.find(
        (item) => item.type === "spotlight-rounds",
      );
      expect(screen?.type).toBe("spotlight-rounds");
      if (screen?.type !== "spotlight-rounds") return [];
      return screen.rounds;
    };

    const explorerRounds = [
      {
        iconA: "📱",
        optionA: "A new phone case, even though his old one is still fine",
        iconB: "🎁",
        optionB: "A new phone case he promised his brother",
        correct: "b",
        error: "",
      },
      {
        iconA: "💡",
        optionA: "A light for his bike to be seen in the dark",
        iconB: "🖱️",
        optionB: "A new gaming mouse with lights (his old one still works)",
        correct: "a",
        error: "",
      },
      {
        iconA: "🍱",
        optionA: "Buy lunch for all his friends and have nothing left",
        iconB: "🚍",
        optionB: "A bus pass to get him to school",
        correct: "b",
        error: "",
      },
    ];

    expect(roundsFor("explorer")).toEqual(explorerRounds);
    expect(roundsFor("maverick")).toEqual([
      {
        ...explorerRounds[0],
        optionB: "A new phone case he promised his friend",
      },
      explorerRounds[1],
      explorerRounds[2],
    ]);
    expect(roundsFor("pathfinder")).toEqual([
      {
        iconA: "📱",
        optionA: "A new phone case, even though her old one is still fine",
        iconB: "🎁",
        optionB: "A new phone case she promised her sister",
        correct: "b",
        error: "",
      },
      {
        iconA: "🐕",
        optionA: "A new lead for her dog as the old one broke",
        iconB: "🧥",
        optionB: "A new hoodie that everyone at school has",
        correct: "a",
        error: "",
      },
      {
        iconA: "🍱",
        optionA: "Buy lunch for all her friends and have nothing left",
        iconB: "🥪",
        optionB: "Buy lunch at school with her tuckshop money",
        correct: "b",
        error: "",
      },
    ]);
  });
});
