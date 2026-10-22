import { describe, expect, it } from "vitest";

import {
  wordBankItems,
  wordDropIsComplete,
  wordDropMatches,
  wordDropPlace,
  wordDropRemove,
} from "@/lib/academy/lessons/word-drop-placement";

describe("wordBankItems", () => {
  it("keeps one chip when every blank repeats the same option list", () => {
    const options = ["spend", "save", "cash for emergencies"];
    expect(
      wordBankItems([{ options }, { options }, { options }]).map((item) => item.label),
    ).toEqual(options);
  });

  it("gives each repeated label in one blank its own id", () => {
    const items = wordBankItems([
      { options: ["save", "spend", "save"] },
      { options: ["save", "throw away"] },
    ]);
    expect(items.map((item) => item.label)).toEqual([
      "save",
      "save",
      "spend",
      "throw away",
    ]);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(items[0]?.id).not.toBe(items[1]?.id);
  });
});

describe("wordDropPlace", () => {
  it("lands in the gap under the drop, leaving earlier gaps empty", () => {
    expect(wordDropPlace(["", "", ""], 2, "replace", null)).toEqual(["", "", "replace"]);
    expect(wordDropPlace(["", ""], 1, "Hidden", null)).toEqual(["", "Hidden"]);
  });

  it("sends the previous word back to the bank when a bank word replaces it", () => {
    expect(wordDropPlace(["spend", "cash", ""], 0, "save", null)).toEqual([
      "save",
      "cash",
      "",
    ]);
  });

  it("moves a placed word into another gap", () => {
    expect(wordDropPlace(["Hidden", ""], 1, "Hidden", 0)).toEqual(["", "Hidden"]);
  });

  it("swaps when a placed word is dropped onto another filled gap", () => {
    expect(wordDropPlace(["Spent", "Saved"], 1, "Spent", 0)).toEqual(["Saved", "Spent"]);
  });

  it("keeps a second chip with the same label in its own gap", () => {
    expect(wordDropPlace(["save\u00000", ""], 1, "save\u00001", null)).toEqual([
      "save\u00000",
      "save\u00001",
    ]);
    expect(wordDropPlace(["save\u00000", "save\u00001"], 0, "save\u00001", 1)).toEqual([
      "save\u00001",
      "save\u00000",
    ]);
  });
});

describe("wordDropRemove", () => {
  it("clears the gap so the word returns to the bank", () => {
    expect(wordDropRemove(["Hidden", "Saved"], 0)).toEqual(["", "Saved"]);
    expect(wordDropIsComplete(["", "Saved"])).toBe(false);
    expect(wordDropIsComplete(["Hidden", "Saved"])).toBe(true);
  });
});

describe("wordDropMatches", () => {
  it("stays false until submit would see every gap correct", () => {
    expect(wordDropMatches(["Hidden"], ["Spent"])).toBe(false);
    expect(wordDropMatches(["Spent", ""], ["Spent", "Saved"])).toBe(false);
    expect(wordDropMatches(["Spent", "Saved"], ["Spent", "Saved"])).toBe(true);
  });
});
