import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import { implicitNextIndex } from "@/lib/academy/lessons/payload/lesson-graph";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import {
  applyCashUpdate,
  cashMatches,
  displayCashText,
  unresolvedPlaceholders,
  type CashComparison,
  type CashUpdate,
} from "@/lib/academy/lessons/payload/cash-placeholder";
import type { ScreenConfig } from "@/lib/academy/lessons/types";

type Choice = {
  label?: string;
  cashUpdate?: CashUpdate;
  goToIndex?: number;
  showWhen?: CashComparison;
};

const KNOWN_PLACEHOLDER = "{cash}";

function choicesOf(screen: ScreenConfig): Choice[] {
  if (!("options" in screen) || !Array.isArray(screen.options)) return [];
  return screen.options.flatMap((option) =>
    option && typeof option === "object" && "label" in option ? [option] : [],
  );
}

/** Copy the player can read on this screen, before `{cash}` is filled in. */
function visibleTemplates(screen: ScreenConfig, cash: number | null): string[] {
  const lines: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim()) lines.push(value);
  };

  if ("promptWhen" in screen && screen.promptWhen && cash !== null) {
    const gated = screen.promptWhen.find((item) => cashMatches(item.showWhen, cash));
    if (gated?.text) push(gated.text);
  }
  if ("prompt" in screen) push(screen.prompt);
  if ("narrative" in screen) push(screen.narrative);
  if ("intro" in screen) push(screen.intro);
  if ("instruction" in screen) push(screen.instruction);
  if ("successMessage" in screen) push(screen.successMessage);
  if ("scenePrompt" in screen) push(screen.scenePrompt);
  if ("narrativeBefore" in screen) push(screen.narrativeBefore);
  if ("narrativeAfter" in screen) push(screen.narrativeAfter);
  if ("wrongError" in screen) push(screen.wrongError);
  if ("rounds" in screen && Array.isArray(screen.rounds)) {
    for (const round of screen.rounds) {
      push(round.prompt);
      push(round.optionA);
      push(round.optionB);
      push(round.error);
    }
  }
  for (const option of choicesOf(screen)) {
    if (!cashMatches(option.showWhen, cash)) continue;
    push(option.label);
  }
  return lines;
}

function assertFilled(template: string, cash: number | null, where: string): string {
  const unknown = unresolvedPlaceholders(template).filter((token) => token !== KNOWN_PLACEHOLDER);
  expect(unknown, `${where} has an unknown placeholder`).toEqual([]);
  const rendered = displayCashText(template, cash);
  expect(unresolvedPlaceholders(rendered), where).toEqual([]);
  if (template.includes(KNOWN_PLACEHOLDER)) {
    expect(cash, `${where} shows {cash} before a choice sets it`).not.toBeNull();
    expect(rendered, where).toContain(`$${cash}`);
    expect(rendered, where).not.toMatch(/\bcash\b/i);
  }
  return rendered;
}

describe("unresolved placeholders", () => {
  it("treats {cash} and $cash as tokens, and $10 as money", () => {
    expect(unresolvedPlaceholders("still has {cash}")).toEqual(["{cash}"]);
    expect(unresolvedPlaceholders("still has $cash")).toEqual(["$cash"]);
    expect(unresolvedPlaceholders("still has {amount} and {coins}")).toEqual([
      "{amount}",
      "{coins}",
    ]);
    expect(unresolvedPlaceholders("He still has $10.")).toEqual([]);
    expect(displayCashText("Lars joins in and still has {cash}.", 4)).toBe(
      "Lars joins in and still has $4.",
    );
    expect(displayCashText("He has {cash} left.", 10)).toBe("He has $10 left.");
  });

  it("fills every Explorer lesson 1–9 path, including both Lesson 8 endings", () => {
    const games = new Set<string>();
    const bowling = new Set<string>();

    for (let lesson = 1; lesson <= 9; lesson += 1) {
      const payload = loadExplorerM1Payload(lesson);
      expect(payload, `lesson ${lesson}`).toBeTruthy();
      if (!payload) continue;
      const content = resolvePayloadLesson(payload, "explorer", lesson);
      const labels = content.screens.map((screen) => screen.sourceLabel ?? screen.id);
      const stack: { index: number; cash: number | null; seen: string }[] = [
        { index: 0, cash: null, seen: "" },
      ];

      while (stack.length > 0) {
        const frame = stack.pop();
        if (!frame) break;
        const screen = content.screens[frame.index];
        const label = labels[frame.index] ?? String(frame.index);
        const visit = `${frame.index}:${frame.cash ?? "unset"}`;
        if (!screen || frame.seen.split("|").includes(visit)) continue;
        const seen = frame.seen ? `${frame.seen}|${visit}` : visit;
        if (seen.split("|").length > 40) {
          throw new Error(`Lesson ${lesson} path is too long at ${label}`);
        }

        for (const template of visibleTemplates(screen, frame.cash)) {
          const rendered = assertFilled(template, frame.cash, `L${lesson} ${label}`);
          if (lesson === 8 && label === "7-games" && template.includes(KNOWN_PLACEHOLDER)) {
            games.add(rendered);
          }
          if (lesson === 8 && label === "7" && template.includes(KNOWN_PLACEHOLDER)) {
            bowling.add(rendered);
          }
        }

        if (screen.type === "completion") continue;

        const jumps = choicesOf(screen).filter(
          (option): option is Choice & { goToIndex: number } =>
            typeof option.goToIndex === "number" && cashMatches(option.showWhen, frame.cash),
        );
        if (jumps.length > 0) {
          for (const option of jumps) {
            stack.push({
              index: option.goToIndex,
              cash: option.cashUpdate ? applyCashUpdate(frame.cash, option.cashUpdate) : frame.cash,
              seen,
            });
          }
          continue;
        }

        if (typeof screen.continueToIndex === "number") {
          stack.push({ index: screen.continueToIndex, cash: frame.cash, seen });
          continue;
        }

        const next = implicitNextIndex(frame.index, labels);
        if (next !== frame.index) stack.push({ index: next, cash: frame.cash, seen });
      }
    }

    expect([...games].sort()).toEqual([
      "The group happily agrees, and Mason's mom makes popcorn. Lars joins in and still has $0.",
      "The group happily agrees, and Mason's mom makes popcorn. Lars joins in and still has $1.",
      "The group happily agrees, and Mason's mom makes popcorn. Lars joins in and still has $4.",
    ]);
    expect([...bowling].sort()).toEqual([
      "Lars bowls with the whole group. He has $0 left.",
      "Lars bowls with the whole group. He has $1 left.",
      "Lars bowls with the whole group. He has $5 left.",
    ]);
  });

  it("fills the closing story card from the same helper the screen renders", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/academy/lesson/screens/narrative-bonus-screen.tsx"),
      "utf8",
    );
    expect(source).toContain("displayCashText(screen.narrative, cash)");
    expect(source).toContain("displayCashText(screen.successMessage, cash)");
  });
});
