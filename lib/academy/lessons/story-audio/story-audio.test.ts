import { describe, expect, it } from "vitest";
import { errorLineIsAcceptable } from "@/lib/academy/lessons/payload/error-line";
import { storyCreditBeatIds } from "@/lib/academy/lessons/story-audio/story-credit";
import { storyClipDurationLabel } from "@/lib/academy/lessons/story-audio/next-clip";
import { STORY_CREDIT } from "@/lib/academy/lessons/story-audio/audio-base";

describe("error line rules", () => {
  it("allows a blank cell in every module", () => {
    expect(errorLineIsAcceptable(1, "")).toBe(true);
    expect(errorLineIsAcceptable(2, "  ")).toBe(true);
    expect(errorLineIsAcceptable(1, "", { strict: true })).toBe(true);
  });

  it("does not require Try again! on the existing Module 1 sheet", () => {
    expect(errorLineIsAcceptable(1, "Not quite.")).toBe(true);
  });

  it("requires Try again! for modules after 1 and for a strict import", () => {
    expect(errorLineIsAcceptable(2, "Not quite.")).toBe(false);
    expect(errorLineIsAcceptable(2, "Not quite. Try again!")).toBe(true);
    expect(errorLineIsAcceptable(1, "Not quite.", { strict: true })).toBe(false);
    expect(errorLineIsAcceptable(1, "Not quite. Try again!", { strict: true })).toBe(true);
  });
});

describe("story credit", () => {
  it("credits the first voiced beat of each lesson, and counts the intro as lesson 1", () => {
    const beats = [
      "explorer-m1-l1-beat1",
      "explorer-m1-intro-beat1",
      "explorer-m1-l1-beat2",
      "explorer-m1-l6-beat1",
      "explorer-m1-l6-beat2",
      "explorer-m1-l6-beat3",
      "explorer-m1-l7-beat1",
      "explorer-m1-l7-beat2",
      "explorer-m1-l9-beat1",
      "explorer-m1-l9-beat9",
    ].map((beatId) => ({ beatId, voiced: true }));
    const credited = storyCreditBeatIds(beats);
    expect(credited.has("explorer-m1-intro-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l1-beat1")).toBe(false);
    expect(credited.has("explorer-m1-l1-beat2")).toBe(false);
    expect(credited.has("explorer-m1-l6-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l6-beat3")).toBe(false);
    expect(credited.has("explorer-m1-l7-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l7-beat2")).toBe(false);
    expect(credited.has("explorer-m1-l9-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l9-beat9")).toBe(false);
    expect(STORY_CREDIT).toBe("Voice created with Grok");
  });

  it("credits lesson 1's first beat when that lesson has no intro", () => {
    const credited = storyCreditBeatIds([
      { beatId: "explorer-m1-l1-beat1", voiced: true },
      { beatId: "explorer-m1-l1-beat2", voiced: true },
    ]);
    expect(credited.has("explorer-m1-l1-beat1")).toBe(true);
    expect(credited.has("explorer-m1-l1-beat2")).toBe(false);
  });

  it("hides a zero duration instead of showing a countdown", () => {
    expect(storyClipDurationLabel(0)).toBeNull();
    expect(storyClipDurationLabel(2586)).toBe("0:03");
    expect(storyClipDurationLabel(10919)).toBe("0:11");
  });
});
