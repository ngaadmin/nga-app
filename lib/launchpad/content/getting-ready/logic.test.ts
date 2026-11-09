import { describe, expect, it } from "vitest";
import { parseCustomerAnswer, parseWrapJobAnswer } from "@/lib/launchpad/content/answers";
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
import { gettingReadyWorkbookSheets } from "@/lib/launchpad/content/getting-ready/workbook-sheets";

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
      "I'll find customers through flyers or posters, talking to friends and family, and posting on a school or community board.",
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
    expect(wrapJobLines("cash", "in_person").lines[0]).toBe("I will collect payment by cash on the day, and ask for feedback by in person.");
    expect(wrapJobLines(["cash", "transfer"], ["text", "email"]).lines[0]).toBe(
      "I will collect payment by cash on the day or bank transfer, and ask for feedback by text or email.",
    );
    expect(wrapJobLines("cash", "in_person").lines.join(" ")).not.toMatch(/funding_lender|parent/);
  });

  it("keeps the wrap-up lines that are already on the Getting Ready workbook", () => {
    const [sheet] = gettingReadyWorkbookSheets(
      { wrap_up: { kind: "wrap-job", version: 1, paymentHow: ["cash", "transfer"], feedbackHow: ["text", "email"] } },
      "Dog walking",
      false,
    ).filter((page) => page.id === "ready-b");
    const text = sheet!.blocks
      .flatMap((block) => (block.kind === "paragraph" ? block.parts.map((part) => (typeof part === "string" ? part : part.value ?? "")) : block.kind === "section" || block.kind === "sub" ? [block.text] : []))
      .join("");
    expect(text).toContain("How I'll wrap up a job");
    expect(text.match(/How I'll wrap up a job/g)).toHaveLength(1);
    expect(text).toContain("I will collect payment by cash on the day or bank transfer.");
    expect(text).toContain("I will ask the owner for feedback or a short review by text or email.");
    expect(text).not.toContain("and ask for feedback");
    const empty = gettingReadyWorkbookSheets(undefined, "Dog walking", true).find((page) => page.id === "ready-b")!;
    const feedback = empty.blocks.find((block) => block.kind === "paragraph" && block.parts.some((part) => typeof part === "string" && part.includes("ask the owner for feedback")));
    expect(feedback && feedback.kind === "paragraph" && feedback.parts.some((part) => typeof part !== "string" && part.value === null)).toBe(true);
  });

  it("lowercases the practice service and groups the other feedback", () => {
    expect(practiceLines("family", "Dog walking", "weekend")[1]).toBe("I will do the following service for them dog walking.");
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

  it("keeps an old wrap string and stores customer times as slot ids", () => {
    expect(parseWrapJobAnswer({ kind: "wrap-job", version: 1, paymentHow: "cash", feedbackHow: "in_person" })).toEqual({
      kind: "wrap-job",
      version: 1,
      paymentHow: ["cash"],
      feedbackHow: ["in_person"],
    });
    expect(parseCustomerAnswer({ kind: "customer", version: 1, numberAsked: 3, yesNo: "yes", interests: ["weekdays", "15-minute-walk"], times: ["weekday_morning", "not-a-slot"] })?.times).toEqual(["weekday_morning"]);
  });
});
