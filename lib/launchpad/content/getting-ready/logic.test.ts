import { describe, expect, it } from "vitest";
import {
  AGREE_ITEMS,
  CHANNELS,
  agreeTitles,
  deliverLines,
  feedbackWrap,
  findReady,
  findSentence,
  practiceLines,
  wrapJobLines,
} from "@/lib/launchpad/content/getting-ready/copy";

describe("getting ready sentences", () => {
  it("requires at least one channel and caps the extra at 60", () => {
    expect(findReady([], "")).toBe(false);
    expect(findReady(["flyers"], "")).toBe(true);
    expect(findReady(["flyers"], "x".repeat(60))).toBe(true);
    expect(findReady(["flyers"], "x".repeat(61))).toBe(false);
    expect(CHANNELS).toHaveLength(6);
  });

  it("writes the find sentence from the picked channels only", () => {
    expect(findSentence(["flyers", "friends", "noticeboard"])).toBe(
      "I'll find customers through flyers or posters, friends and family, and a school or community noticeboard.",
    );
    expect(findSentence(["flyers"], "Neighborhood group")).toContain("Also: Neighborhood group");
  });

  it("lists only the ticked agree titles", () => {
    expect(agreeTitles(["collect_info", "confirm_dog", "cost_payment"])).toEqual([
      AGREE_ITEMS[0]!.title,
      AGREE_ITEMS[1]!.title,
      AGREE_ITEMS[3]!.title,
    ]);
    expect(agreeTitles([])).toEqual([]);
  });

  it("keeps the sheet wording on the plan lines", () => {
    expect(deliverLines("text", "photo").lines[0]).toContain("by text");
    expect(deliverLines("text", "photo").lines[1]).toContain("a photo");
    expect(wrapJobLines("cash", "in_person").lines[0]).toContain("cash on the day");
    expect(wrapJobLines("cash", "in_person").lines[0]).toContain("in person");
    expect(wrapJobLines(["cash", "transfer"], "in_person").lines[0]).toContain("cash on the day or bank transfer");
    expect(wrapJobLines("cash", "in_person").lines.join(" ")).not.toMatch(/funding_lender|parent/);
  });

  it("lowercases the practice service and groups the other feedback", () => {
    expect(practiceLines("family", "Dog walking", "weekend")[1]).toBe("I will do dog walking.");
    const wrap = feedbackWrap([
      { id: "service_explained", result: "good" },
      { id: "cost", result: "good" },
      { id: "timing", result: "good" },
      { id: "communication", result: "suggestions", suggestion: "Send a text when you are on your way, so the dog is ready." },
      { id: "delivery", result: "good" },
      { id: "payment", result: "good" },
      { id: "proof", result: "good" },
    ]);
    expect(wrap.notes).toEqual([
      {
        question: "Was communication clear and helpful?",
        note: "Send a text when you are on your way, so the dog is ready.",
      },
    ]);
    expect(wrap.other).toBe("The other 6 questions: was good, nothing to change.");
  });
});
