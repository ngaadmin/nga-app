import { describe, expect, it } from "vitest";
import {
  isPairedZoneSortScreen,
  needsWantsPortrait,
  orderPairedZones,
  pairedZoneEmoji,
  sortPromptLines,
} from "@/lib/academy/lessons/paired-zone-sort";
import type { ScreenConfig } from "@/lib/academy/lessons/types";

describe("paired zone sort", () => {
  it("splits the needs and wants story into two sentences", () => {
    expect(
      sortPromptLines(
        "Lars spent all his money on things he wanted, but didn't save anything for things he needs to buy. Help Lars identify which items are 'Things he wants' or 'Things he needs'",
      ),
    ).toEqual([
      "Lars spent all his money on things he wanted, but didn't save anything for things he needs to buy.",
      "Help Lars identify which items are 'Things he wants' or 'Things he needs'",
    ]);
  });

  it("puts wants and short fun on the left", () => {
    expect(
      orderPairedZones([
        { id: "need", label: "Things Lars needs" },
        { id: "want", label: "Things Lars wants" },
      ]).map((bucket) => bucket.id),
    ).toEqual(["want", "need"]);
    expect(pairedZoneEmoji("want")).toBe("🎈");
    expect(pairedZoneEmoji("need")).toBe("🛠️");
    expect(pairedZoneEmoji("short")).toBe("⚡");
    expect(pairedZoneEmoji("long")).toBe("🌈");
  });

  it("uses the story's learner for the thinking portrait", () => {
    expect(needsWantsPortrait("Help Holly identify which items")).toMatchObject({
      alt: "Holly thinking",
    });
    expect(needsWantsPortrait("Help Lars identify which items").src).toContain(
      "lars-thinking-512.webp",
    );
  });

  it("treats tap-reveal and want/need sorts as the shared layout", () => {
    const tap = { type: "tap-reveal", buckets: [], items: [] } as unknown as ScreenConfig;
    const wants = {
      type: "bucket-sort",
      buckets: [
        { id: "want", label: "Wants" },
        { id: "need", label: "Needs" },
      ],
    } as unknown as ScreenConfig;
    const spent = {
      type: "bucket-sort",
      buckets: [{ id: "spent", label: "Spent" }],
    } as unknown as ScreenConfig;
    expect(isPairedZoneSortScreen(tap)).toBe(true);
    expect(isPairedZoneSortScreen(wants)).toBe(true);
    expect(isPairedZoneSortScreen(spent)).toBe(false);
  });
});
