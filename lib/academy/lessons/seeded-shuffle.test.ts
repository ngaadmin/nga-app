import { describe, expect, it } from "vitest";
import { isPinnedChoiceLabel } from "@/lib/academy/lessons/all-of-the-above";
import { itemsGroupedLikeZones } from "@/lib/academy/lessons/paired-zone-sort";
import {
  seededDerangement,
  seededShuffle,
  shuffleSeed,
} from "@/lib/academy/lessons/seeded-shuffle";

describe("shuffleSeed", () => {
  it("is stable for the same parts and changes when a part changes", () => {
    expect(shuffleSeed("m1", "screen-6", 0, "2026-01-01")).toBe(
      shuffleSeed("m1", "screen-6", 0, "2026-01-01"),
    );
    expect(shuffleSeed("m1", "screen-6", 0, "guest")).not.toBe(
      shuffleSeed("m1", "screen-6", 1, "guest"),
    );
  });
});

describe("seededShuffle", () => {
  it("repeats the same order for a seed", () => {
    const items = ["keep", "cheaper", "borrow", "wait"];
    expect(seededShuffle(items, 42)).toEqual(seededShuffle(items, 42));
  });

  it("pins an all-of-the-above option last", () => {
    const options = [
      { key: "a", label: "Replace it myself" },
      { key: "e", label: "All of the above." },
      { key: "b", label: "Ask a parent" },
      { key: "c", label: "None of the above" },
    ];
    for (let seed = 1; seed <= 20; seed += 1) {
      const shuffled = seededShuffle(options, seed, {
        pinLast: (option) => isPinnedChoiceLabel(option.label),
      });
      expect(shuffled.slice(-2).map((option) => option.key)).toEqual(["e", "c"]);
      expect(new Set(shuffled.map((option) => option.key)).size).toBe(4);
    }
  });

  it("avoids items grouped in zone order", () => {
    const items = [
      { id: "phone", bucket: "need" },
      { id: "cable", bucket: "need" },
      { id: "snack", bucket: "want" },
      { id: "skin", bucket: "want" },
    ];
    const zones = ["want", "need"];
    const shuffled = seededShuffle(items, shuffleSeed("lesson", "screen", 0), {
      avoid: (order) => itemsGroupedLikeZones(order, zones),
    });
    expect(itemsGroupedLikeZones(shuffled, zones)).toBe(false);
    expect(shuffled.map((item) => item.id).sort()).toEqual([
      "cable",
      "phone",
      "skin",
      "snack",
    ]);
  });
});

describe("seededDerangement", () => {
  it("does not leave an item in its original slot", () => {
    const ids = ["broke", "birthday", "sale"];
    for (let seed = 0; seed < 15; seed += 1) {
      const next = seededDerangement(ids, seed);
      expect(next).toHaveLength(3);
      expect(new Set(next).size).toBe(3);
      expect(next.some((id, index) => id === ids[index])).toBe(false);
    }
  });
});
