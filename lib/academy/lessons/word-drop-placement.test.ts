import { describe, expect, it } from "vitest";

import {
  wordDropIsComplete,
  wordDropMatches,
  wordDropPlace,
  wordDropRemove,
} from "@/lib/academy/lessons/word-drop-placement";

describe("wordDropPlace", () => {
  it("lands in the gap under the drop, leaving earlier gaps empty", () => {
    expect(wordDropPlace(["", "", ""], 2, "replace", null, false)).toEqual([
      "",
      "",
      "replace",
    ]);
    expect(wordDropPlace(["", ""], 1, "Hidden", null, false)).toEqual(["", "Hidden"]);
  });

  it("sends the previous word back to the bank when a bank word replaces it", () => {
    expect(wordDropPlace(["spend", "cash", ""], 0, "save", null, false)).toEqual([
      "save",
      "cash",
      "",
    ]);
  });

  it("moves a placed word into another gap", () => {
    expect(wordDropPlace(["Hidden", ""], 1, "Hidden", 0, false)).toEqual(["", "Hidden"]);
  });

  it("swaps when a placed word is dropped onto another filled gap", () => {
    expect(wordDropPlace(["Spent", "Saved"], 1, "Spent", 0, false)).toEqual([
      "Saved",
      "Spent",
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
