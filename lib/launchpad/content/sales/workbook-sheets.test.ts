import { describe, expect, it } from "vitest";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { salesWorkbookSheets } from "@/lib/launchpad/content/sales/workbook-sheets";

const answers: LaunchpadAnswers = {
  sales_channels: {
    kind: "sales-channels",
    version: 1,
    selected: ["flyers", "friends", "online", "cards"],
    where: {
      flyers: ["school", "shop"],
      friends: ["see", "message"],
      online: ["page"],
      cards: ["cafe"],
    },
  },
  marketing_materials: {
    kind: "marketing-materials",
    version: 1,
    mainService: "dog-walking",
    secondService: "grooming",
    hook: "too-busy",
    proof: "photo",
    pieces: { "flyer-book": "message", "flyer-extra": "friendly", "verbal-close": "book", "message-close": "book", "online-close": "reply" },
  },
  "l2-price": {
    kind: "price",
    version: 1,
    prices: [
      { serviceId: "dog-walking", price: 15, costPerJob: 0, keptPerJob: 15 },
      { serviceId: "grooming", price: 25, costPerJob: 0, keptPerJob: 25 },
    ],
  },
  tell_people: { kind: "tell-people", version: 1, counts: { flyers: 20, see: 8, message: 6, days: 7, ask: 3, cards: 20, stores: 3 } },
};

describe("Level 4 workbook playback", () => {
  it("plays the selected channels back and underlines only the marketing short name", () => {
    const sheets = salesWorkbookSheets(answers, "Happy Paws");
    const where = sheets.find((sheet) => sheet.id === "sales-where");
    const text = JSON.stringify(where);
    expect(text).toContain("Flyers or posters");
    expect(text).toContain("at school (with permission)");
    expect(where?.blocks.some((block) => block.kind === "sub" && block.underline)).toBeFalsy();
    const flyer = sheets.find((sheet) => sheet.blocks.some((block) => block.kind === "sub" && block.underline === "flyer"));
    expect(flyer?.blocks.some((block) => block.kind === "sub" && block.text === "What my flyer will say" && block.underline === "flyer")).toBe(true);
    const tell = sheets.find((sheet) => sheet.id === "sales-tell");
    expect(JSON.stringify(tell)).toContain("20");
    expect(tell?.blocks.some((block) => block.kind === "sub" && block.underline)).toBeFalsy();
  });
});
