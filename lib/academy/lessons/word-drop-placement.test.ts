import { describe, expect, it } from "vitest";

import {
  wordDropIsComplete,
  wordDropMatches,
  wordDropPlace,
  wordDropRemove,
  wordDropTapTarget,
} from "@/lib/academy/lessons/word-drop-placement";

describe("wordDropTapTarget", () => {
  it("uses the selected gap even when the word would be wrong there", () => {
    expect(wordDropTapTarget(["", ""], 1)).toBe(1);
    expect(wordDropTapTarget(["Spent", ""], 0)).toBe(0);
  });

  it("uses the next empty gap when nothing is selected", () => {
    expect(wordDropTapTarget(["", "Saved"], null)).toBe(0);
    expect(wordDropTapTarget(["Spent", ""], null)).toBe(1);
  });

  it("does not hunt for the correct gap when several are empty", () => {
    expect(wordDropTapTarget(["", "", ""], null)).toBe(0);
  });

  it("returns null when every gap is filled and none is selected", () => {
    expect(wordDropTapTarget(["Spent", "Saved"], null)).toBeNull();
  });
});

describe("wordDropPlace", () => {
  it("keeps a wrong word in the gap the learner chose", () => {
    expect(wordDropPlace(["", ""], 0, "Hidden", null, false)).toEqual(["Hidden", ""]);
    expect(wordDropPlace(["", ""], 1, "Hidden", null, false)).toEqual(["", "Hidden"]);
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
  it("clears the gap so the word can be placed again", () => {
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
