import { describe, expect, it } from "vitest";
import { splitResolutionCopy } from "@/lib/academy/lessons/resolution-copy";

const FREEZE_RESOLUTION = [
  "The freeze worked!",
  "The next morning, Lars realized he didn't even want that skin anymore.",
  "He kept his money safe for a new gaming headset. 🎧",
  "Congratulations for helping him avoid wasting his money! 🎉",
].join("\n\n");

describe("splitResolutionCopy", () => {
  it("splits the freeze resolution into a headline and three paragraphs", () => {
    expect(splitResolutionCopy(FREEZE_RESOLUTION)).toEqual({
      headline: "The freeze worked! 🧊",
      paragraphs: [
        "The next morning, Lars realized he didn't even want that skin anymore.",
        "He kept his money safe for a new gaming headset. 🎧",
        "Congratulations for helping him avoid wasting his money! 🎉",
      ],
    });
  });

  it("keeps an unbroken resolution as one body paragraph", () => {
    expect(
      splitResolutionCopy(
        "Holly chooses to keep her money instead of giving in to the rush. She stays in control of spending.",
      ),
    ).toEqual({
      headline: "Holly chooses to keep her money instead of giving in to the rush.",
      paragraphs: ["She stays in control of spending."],
    });
  });
});
