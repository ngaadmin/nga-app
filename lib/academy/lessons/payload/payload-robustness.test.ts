import { describe, expect, it } from "vitest";

import { mapPayloadScreen } from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { PayloadCohortCopy, PayloadScreenRow } from "@/lib/academy/lessons/payload/types";

function copy(pathfinder: string, explorer = "", maverick = ""): PayloadCohortCopy {
  return { explorer, pathfinder, maverick };
}

function row(overrides: Partial<PayloadScreenRow> & Pick<PayloadScreenRow, "gameType">): PayloadScreenRow {
  return {
    screenNumber: 1,
    screenLabel: "1",
    text: copy("Prompt"),
    image: copy(""),
    settings: copy(""),
    error: copy("Try the other one."),
    ...overrides,
  };
}

describe("payload template robustness", () => {
  it("keeps Pathfinder keys a partial Explorer cell does not set", () => {
    const screen = mapPayloadScreen(
      row({
        gameType: "true-false",
        settings: copy("ID: keep-me\nCORRECT: False", "CORRECT: False"),
      }),
      "explorer",
    );
    expect(screen.id).toBe("keep-me");
    expect(screen).toMatchObject({ type: "true-false", correctAnswer: "false" });
  });

  it("rejects a true-false row whose CORRECT is missing", () => {
    expect(() =>
      mapPayloadScreen(row({ gameType: "true-false", settings: copy("HOLD: x") }), "pathfinder"),
    ).toThrow(/CORRECT/);
  });

  it("rejects a graded choice whose CORRECT letter is missing", () => {
    expect(() =>
      mapPayloadScreen(
        row({
          gameType: "multiple-choice",
          settings: copy("CHOICE A: One\nCHOICE B: Two\nCORRECT: C"),
        }),
        "pathfinder",
      ),
    ).toThrow(/CORRECT C/);
  });

  it("keeps graded choices when the row also has CONTINUE", () => {
    const screen = mapPayloadScreen(
      row({
        gameType: "binary-choice",
        settings: copy(
          "CHOICE A: Headphones → GO Screen 1\nCHOICE B: Game skin → GO Screen 1\nCORRECT: A\nCONTINUE → GO Screen 1",
        ),
      }),
      "pathfinder",
    );
    expect(screen).toMatchObject({ type: "binary-choice" });
    if (!("options" in screen) || !screen.options) throw new Error("expected choices");
    expect(screen.options).toHaveLength(2);
    expect(screen.continueToLabel).toBeUndefined();
  });

  it("parses a savings item that has no emoji and rejects an empty list", () => {
    const screen = mapPayloadScreen(
      row({
        gameType: "savings-goal",
        settings: copy("TARGET: 10\nITEMS: Bus pass ($10)"),
      }),
      "pathfinder",
    );
    expect(screen).toMatchObject({
      type: "savings-goal",
      items: [{ label: "Bus pass", price: 10 }],
    });
    expect(() =>
      mapPayloadScreen(
        row({ gameType: "savings-goal", settings: copy("TARGET: 10\nITEMS: nothing here") }),
        "pathfinder",
      ),
    ).toThrow(/no items/);
  });

  it("rejects a budget CORRECT name that matches nothing", () => {
    expect(() =>
      mapPayloadScreen(
        row({
          gameType: "budget-select",
          settings: copy("TOTAL: 10\nNEED: 🚌 Bus pass ($5)\nCORRECT: cable"),
        }),
        "pathfinder",
      ),
    ).toThrow(/CORRECT does not match/);
  });

  it("rejects a word-drop CORRECT value that is not an option", () => {
    expect(() =>
      mapPayloadScreen(
        row({
          gameType: "word-drop",
          text: copy("Keep the ______."),
          settings: copy("OPTIONS: cash | coins\nCORRECT: treasure"),
        }),
        "pathfinder",
      ),
    ).toThrow(/not in OPTIONS/);
  });

  it("rejects rank ORDER keys that do not match the items", () => {
    expect(() =>
      mapPayloadScreen(
        row({
          gameType: "rank-order",
          settings: copy("ITEMS: Apple\nITEMS: Banana\nORDER: nope, nada"),
        }),
        "pathfinder",
        { lessonNumber: 1 },
      ),
    ).toThrow(/ORDER does not match/);
  });
});
