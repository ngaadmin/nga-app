import { describe, expect, it } from "vitest";
import { PAIR_SHEET_IMAGES_BASE } from "@/lib/academy/illustrations/illustration-registry";
import { resolveLessonScreenIllustration } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import type { ScreenConfig } from "@/lib/academy/lessons/types";

const wordDrop = {
  type: "word-drop",
  id: "hook-word-drop",
  narrativeBefore: "Cash must be",
  narrativeAfter: "right away!",
  options: ["Spent", "Saved"],
  correctOption: "Spent",
  wrongError: "Try again.",
} as ScreenConfig;

describe("resolveLessonScreenIllustration", () => {
  it("keeps the lesson illustration when no pair file name is set", () => {
    const resolved = resolveLessonScreenIllustration({
      ...wordDrop,
      illustrationId: "holly-working",
    });
    expect(resolved?.src).toContain("holly");
    expect(resolved?.src).not.toContain("/characters/pairs/");
  });

  it("maps a character file name to the registry, not a random pose", () => {
    const resolved = resolveLessonScreenIllustration({
      ...wordDrop,
      illustrationId: "lars-thinking",
      pairImage: "Holly-happy.webp",
    });
    expect(resolved?.src).toContain("Holly-happy.webp");
    expect(resolved?.src).not.toContain("lars-thinking");
  });

  it("shows the pairs-folder file and ignores illustrationId", () => {
    const resolved = resolveLessonScreenIllustration({
      ...wordDrop,
      illustrationId: "lars-happy",
      pairImage: "mia-senna-walking.webp",
    });
    expect(resolved?.src).toBe(
      `${PAIR_SHEET_IMAGES_BASE}/mia-senna-walking.webp`,
    );
  });

  it("shows no picture when the sheet says not allowed", () => {
    const resolved = resolveLessonScreenIllustration({
      ...wordDrop,
      illustrationId: "lars-happy",
      pairImage: false,
    });
    expect(resolved).toBeUndefined();
  });
});
