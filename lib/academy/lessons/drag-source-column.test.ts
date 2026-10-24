import { describe, expect, it } from "vitest";

import { visibleDragSourceLabel } from "@/lib/academy/lessons/drag-source-column";

describe("visibleDragSourceLabel", () => {
  it("names the source while the item is still there", () => {
    expect(
      visibleDragSourceLabel({
        remaining: 1,
        showZoneLabels: true,
        sourceLabel: "Gift box",
      }),
    ).toBe("Gift box");
  });

  it("leaves the source column blank after a successful drop", () => {
    expect(
      visibleDragSourceLabel({
        remaining: 0,
        showZoneLabels: true,
        sourceLabel: "Gift box",
      }),
    ).toBeNull();
    expect(
      visibleDragSourceLabel({
        remaining: 0,
        showZoneLabels: true,
        sourceLabel: "Spend Now",
      }),
    ).toBeNull();
  });

  it("stays blank when zone labels are off", () => {
    expect(
      visibleDragSourceLabel({
        remaining: 1,
        showZoneLabels: false,
        sourceLabel: "Gift",
      }),
    ).toBeNull();
  });
});
