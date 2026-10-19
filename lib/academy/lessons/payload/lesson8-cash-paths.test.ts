import { describe, expect, it } from "vitest";

import {
  applyCashUpdate,
  cashMatches,
  fillCashPlaceholder,
  type CashComparison,
  type CashUpdate,
} from "@/lib/academy/lessons/payload/cash-placeholder";
import { implicitNextIndex } from "@/lib/academy/lessons/payload/lesson-graph";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { ScreenConfig } from "@/lib/academy/lessons/types";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

type Choice = {
  label?: string;
  cashUpdate?: CashUpdate;
  goToIndex?: number;
  showWhen?: CashComparison;
};

/**
 * Result-card sentences before the current-cash amount was replaced with {cash}.
 * Prices in the same sentence stay in both versions.
 */
const LEGACY: Record<string, Record<MasteryCohort, string>> = {
  "1-buy": {
    explorer: "Lars buys the phone case for $9. He has $6 left.",
    pathfinder: "Holly buys the phone case for $9. She has $6 left.",
    maverick: "Aiden buys the phone case for $9. He has $6 left.",
  },
  "1-keep": {
    explorer: "Lars leaves the phone case. He still has $15.",
    pathfinder: "Holly leaves the phone case. She still has $15.",
    maverick: "Aiden leaves the phone case. He still has $15.",
  },
  "2-played": {
    explorer: "Lars pays $8 and plays the arcade. He has $7 left.",
    pathfinder: "Holly pays $8 and plays the arcade. She has $7 left.",
    maverick: "Aiden pays $8 and plays the arcade. He has $7 left.",
  },
  "2-kept": {
    explorer: "Lars skips the arcade and keeps his $15.",
    pathfinder: "Holly skips the arcade and keeps her $15.",
    maverick: "Aiden skips the arcade and keeps his $15.",
  },
  "2-short": {
    explorer: "Lars can\u2019t pay the $8. He skips the arcade and keeps his $6.",
    pathfinder: "Holly can\u2019t pay the $8. She skips the arcade and keeps her $6.",
    maverick: "Aiden can\u2019t pay the $8. He skips the arcade and keeps his $6.",
  },
  "4": {
    explorer:
      "Senna has $12 left. After the session, the friend group want to go for lunch. Senna is happy he said yes to the skateboarding, because now he can join the lunch too.",
    pathfinder:
      "Immi has $12 left. After the derby, the friend group want to go for lunch. Immi is happy she said yes to the derby, because now she can join the lunch too.",
    maverick:
      "Dash has $12 left. After the gym session, the friend group want to go for lunch. Dash is happy he said yes to the gym, because now he can join the lunch too.",
  },
  "4-alt": {
    explorer:
      "The next day everyone is talking about how good the skateboard session was, and they all went to lunch after. Senna still has his $20, but he missed all of it.",
    pathfinder:
      "The next day everyone is talking about how good the derby was, and they all went to lunch after. Immi still has her $20, but she missed all of it.",
    maverick:
      "The next day everyone is talking about how good the gym session was, and they all went to lunch after. Dash still has his $20, but he missed all of it.",
  },
  "5-buy": {
    explorer: "Mia buys the water bottle for $9. She has $5 left.",
    pathfinder: "Holly buys the water bottle for $9. She has $5 left.",
    maverick: "Aiden buys the water bottle for $9. He has $5 left.",
  },
  "5-save": {
    explorer: "Mia skips the water bottle. She still has $14.",
    pathfinder: "Holly skips the water bottle. She still has $14.",
    maverick: "Aiden skips the water bottle. He still has $14.",
  },
  "7": {
    explorer:
      "You picked \u201cAsk if the group will switch to a cheaper session she can afford ($5)\u201d. The group said yes. Mia got her water bottle and still went to the cinema with everyone. She has $0 left.",
    pathfinder:
      "You picked \u201cAsk if the group will switch to a cheaper session ($5)\u201d. The group said yes. Holly got her water bottle and still went to the cinema with everyone. She has $0 left.",
    maverick:
      "You picked \u201cAsk if the group will switch to a cheaper session ($5)\u201d. The group said yes. Aiden got his water bottle and still went to the cinema with everyone. He has $0 left.",
  },
  "7-skip": {
    explorer:
      "You picked \u201cSkip the cinema\u201d. Mia has the new water bottle and $5 left, and she missed the cinema.",
    pathfinder:
      "You picked \u201cSkip the cinema\u201d. Holly has the new water bottle and $5 left, and she missed the cinema.",
    maverick:
      "You picked \u201cSkip the cinema\u201d. Aiden has the new water bottle and $5 left, and he missed the cinema.",
  },
  "7-alt": {
    explorer:
      "You picked \u201cGo to the cinema ($8)\u201d. Mia did not buy the bottle, but she joined the group. She has $6 left.",
    pathfinder:
      "You picked \u201cGo to the cinema ($8)\u201d. Holly did not buy the bottle, but she joined the group. She has $6 left.",
    maverick:
      "You picked \u201cGo to the cinema ($8)\u201d. Aiden did not buy the bottle, but he joined the group. He has $6 left.",
  },
  "7-home": {
    explorer:
      "You picked \u201cDon\u2019t go to the cinema and save all her money\u201d. Mia still has $14, and she missed the bottle and the cinema.",
    pathfinder:
      "You picked \u201cDon\u2019t go\u201d. Holly still has $14, and she missed the bottle and the cinema.",
    maverick:
      "You picked \u201cDon\u2019t go\u201d. Aiden still has $14, and he missed the bottle and the cinema.",
  },
};

function choicesOf(screen: ScreenConfig): Choice[] {
  if (!("options" in screen) || !Array.isArray(screen.options)) return [];
  return screen.options.flatMap((option) =>
    option && typeof option === "object" && "label" in option ? [option] : [],
  );
}

/** The sentence the player shows for this cash, including a gated prompt. */
function activeCopy(screen: ScreenConfig, cash: number | null): string {
  if ("promptWhen" in screen && screen.promptWhen && cash !== null) {
    const gated = screen.promptWhen.find((item) => cashMatches(item.showWhen, cash));
    if (gated?.text) return gated.text;
  }
  if (screen.type === "narrative-bonus") return screen.narrative;
  if ("prompt" in screen && typeof screen.prompt === "string") return screen.prompt;
  if ("narrative" in screen && typeof screen.narrative === "string") return screen.narrative;
  return "";
}

type Frame = { index: number; cash: number | null; path: string[] };

describe("lesson 8 cash on every branch", () => {
  it("shows the tracked cash on every path, stays non-negative, and finishes", () => {
    for (const cohort of COHORTS) {
      const content = resolvePayloadLesson(loadBundledLessonPayload(1, 8), cohort, 8);
      const screens = content.screens;
      const labels = screens.map((screen) => screen.sourceLabel ?? screen.id);
      const stack: Frame[] = [{ index: 0, cash: null, path: [] }];
      const stale: string[] = [];
      const stuck: string[] = [];
      let completions = 0;
      const counterfactualCash: number[] = [];

      while (stack.length > 0) {
        const frame = stack.pop();
        if (!frame) break;
        const screen = screens[frame.index];
        const label = labels[frame.index] ?? String(frame.index);
        const path = [...frame.path, label];
        if (!screen) {
          stuck.push(path.join(" > "));
          continue;
        }
        if (path.length > 40) {
          stuck.push(path.join(" > "));
          continue;
        }
        if (frame.cash !== null && frame.cash < 0) {
          stuck.push(`${cohort} ${path.join(" > ")} cash ${frame.cash}`);
          continue;
        }

        const template = activeCopy(screen, frame.cash);
        if (template.includes("{cash}")) {
          if (frame.cash === null) {
            stuck.push(`${cohort} ${path.join(" > ")} shows {cash} before cash is set`);
          } else {
            const rendered = fillCashPlaceholder(template, frame.cash);
            expect(rendered, `${cohort} ${label}`).toBe(
              template.split("{cash}").join(`$${frame.cash}`),
            );
            expect(rendered, `${cohort} ${label}`).not.toContain("{cash}");
            const legacy = LEGACY[label]?.[cohort];
            if (legacy && rendered !== legacy) {
              stale.push(
                `${cohort} ${path.join(" > ")}: tracked $${frame.cash}; old text was "${legacy}"; now "${rendered}"`,
              );
            }
          }
        }

        if (label === "2-alt") {
          if (frame.cash !== null) counterfactualCash.push(frame.cash);
          expect(template, cohort).toContain("$15");
          expect(template, cohort).not.toContain("{cash}");
        }

        if (screen.type === "completion") {
          completions += 1;
          continue;
        }

        const jumps = choicesOf(screen).filter(
          (option): option is Choice & { goToIndex: number } =>
            typeof option.goToIndex === "number" && cashMatches(option.showWhen, frame.cash),
        );
        if (jumps.length > 0) {
          for (const option of jumps) {
            const nextCash = option.cashUpdate
              ? applyCashUpdate(frame.cash, option.cashUpdate)
              : frame.cash;
            stack.push({ index: option.goToIndex, cash: nextCash, path });
          }
          continue;
        }

        if (typeof screen.continueToIndex === "number") {
          stack.push({ index: screen.continueToIndex, cash: frame.cash, path });
          continue;
        }

        const next = implicitNextIndex(frame.index, labels);
        if (next === frame.index) {
          stuck.push(path.join(" > "));
          continue;
        }
        stack.push({ index: next, cash: frame.cash, path });
      }

      expect(stuck, cohort).toEqual([]);
      expect(completions, cohort).toBe(32);
      expect(stale, `old fixed cash that does not match the path (${cohort})`).toEqual([]);
      expect(counterfactualCash.every((cash) => cash === 6), cohort).toBe(true);
      expect(counterfactualCash.length, cohort).toBeGreaterThan(0);
    }
  });
});
