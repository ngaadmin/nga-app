import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { lessonAnswerEmojiClass } from "@/components/academy/lesson/lesson-shared-styles";

/**
 * Files that paint an emoji on an answer, option, item, or chip.
 * Multiple-choice and binary-choice share the choice button.
 * Two-column lightning rounds paint through LessonIconOption in lesson-ui.
 */
const EMOJI_TEMPLATE_FILES = [
  "components/academy/lesson/lesson-choice-button.tsx",
  "components/academy/lesson/lesson-ui.tsx",
  "components/academy/lesson/lesson-bucket-sort-game.tsx",
  "components/academy/lesson/lesson-budget-select-game.tsx",
  "components/academy/lesson/lesson-rank-order-game.tsx",
  "components/academy/lesson/lesson-link-match-game.tsx",
  "components/academy/lesson/lesson-word-drop-game.tsx",
  "components/academy/lesson/lesson-drag-to-target-game.tsx",
  "components/academy/lesson/lesson-savings-goal-game.tsx",
  "components/academy/lesson/paired-zone-sort.tsx",
  "components/academy/lesson/screens/allocation-slider-screen.tsx",
  "components/academy/lesson/screens/skill-hub-screen.tsx",
  "components/academy/lesson/screens/hold-to-fill-screen.tsx",
] as const;

/** These screens paint through a shared control that uses AnswerEmoji. */
const DELEGATED_TEMPLATES = [
  {
    file: "components/academy/lesson/screens/multiple-choice-screen.tsx",
    via: "LessonChoiceButton",
  },
  {
    file: "components/academy/lesson/screens/spotlight-rounds-screen.tsx",
    via: "LessonChoiceButton",
  },
  {
    file: "components/academy/lesson/screens/spotlight-rounds-screen.tsx",
    via: "LessonIconOption",
  },
] as const;

/** Sizes that used to be set per template. The shared token replaces them. */
const PRIVATE_EMOJI_SIZES = [
  "text-[32px]",
  "text-[1.25rem]",
  "text-[1.35rem]",
  "text-[2.4rem]",
  "text-[22px] leading-none",
  "text-[40px] leading-[46px]",
  "text-2xl leading-none",
  "text-5xl",
  "text-4xl",
  "text-[12px]",
];

function source(file: string): string {
  return readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("shared answer emoji size", () => {
  it("keeps the choice-row size as the one token", () => {
    expect(lessonAnswerEmojiClass).toBe("text-[30px] leading-none");
    expect(source("components/academy/lesson/answer-emoji.tsx")).toContain(
      "lessonAnswerEmojiClass",
    );
  });

  it("renders every answer template through AnswerEmoji", () => {
    for (const file of EMOJI_TEMPLATE_FILES) {
      const text = source(file);
      expect(text, file).toMatch(/AnswerEmoji/);
      for (const size of PRIVATE_EMOJI_SIZES) {
        expect(text, `${file} still sets ${size}`).not.toContain(size);
      }
    }
    for (const entry of DELEGATED_TEMPLATES) {
      const text = source(entry.file);
      expect(text, entry.file).toContain(entry.via);
      for (const size of PRIVATE_EMOJI_SIZES) {
        expect(text, `${entry.file} still sets ${size}`).not.toContain(size);
      }
    }
  });

  it("leaves pill boxes and text-only steps alone", () => {
    expect(source("components/academy/lesson/lesson-shared-styles.ts")).toContain(
      "grid-cols-[2rem_minmax(0,1fr)]",
    );
    expect(source("components/academy/lesson/lesson-choice-button.tsx")).toContain(
      "rounded-full border-2 border-[#C5D4EA] bg-white px-3.5 py-2",
    );
    expect(source("components/academy/lesson/lesson-link-match-game.tsx")).toContain(
      "size-6 shrink-0",
    );
    expect(source("components/academy/lesson/lesson-drag-to-target-game.tsx")).toContain(
      "size-[22px]",
    );
    const steps = source("components/academy/lesson/lesson-sequence-sort-game.tsx");
    const stepCards = source("components/academy/lesson/lesson-ui.tsx");
    expect(steps).not.toMatch(/AnswerEmoji/);
    expect(stepCards).not.toMatch(/AnswerEmojiLabel/);
    expect(source("components/academy/lesson/screens/multiple-choice-screen.tsx")).not.toMatch(
      /presentLightningCard/,
    );
  });
});
