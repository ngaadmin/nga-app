// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PairedZoneSort } from "@/components/academy/lesson/paired-zone-sort";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const items = [
  { id: "a", label: "Arcade games", emoji: "🎮", bucket: "short" },
  { id: "b", label: "Food delivery with a rush surcharge", emoji: "🍔", bucket: "long" },
];
const buckets = [
  { id: "short", label: "Short Fun" },
  { id: "long", label: "More Fun for Longer" },
];

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function renderSort(onComplete = vi.fn()) {
  render(
    <PairedZoneSort
      intro="Sort these. Drag each one into a bucket."
      items={items}
      buckets={buckets}
      orderKey="test"
      mode="drag"
      onComplete={onComplete}
    />,
  );
  return onComplete;
}

function item(label: string) {
  return screen
    .getAllByRole("button")
    .find((node) => node.dataset.sortItemId && node.textContent?.includes(label))!;
}

function zone(label: string) {
  return screen.getByRole("button", { name: `Drop selected item in ${label}` });
}

describe("PairedZoneSort", () => {
  it("places by tap then tap with no tick badge, keeping a same-size placeholder", () => {
    const onComplete = renderSort();
    fireEvent.click(item("Arcade"));
    fireEvent.click(zone("Short Fun"));
    fireEvent.click(item("Food delivery"));
    fireEvent.click(zone("More Fun for Longer"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".lesson-tick-pop")).toBeNull();
    expect(document.body.textContent).not.toContain("✓");
    const placeholders = document.querySelectorAll(".invisible .sort-item");
    expect(placeholders).toHaveLength(2);
  });

  it("drops an item into a bucket with a real touch drag", () => {
    const onComplete = renderSort();
    const short = zone("Short Fun");
    const long = zone("More Fun for Longer");
    short.getBoundingClientRect = () => rect(20, 400, 160, 316);
    long.getBoundingClientRect = () => rect(200, 400, 160, 316);

    const drag = (node: HTMLElement, toX: number, toY: number) => {
      const start = { identifier: 1, clientX: 60, clientY: 200, target: node };
      act(() => {
        fireEvent.touchStart(node, { changedTouches: [start], touches: [start] });
      });
      const move = { ...start, clientX: toX, clientY: toY };
      act(() => {
        window.dispatchEvent(
          Object.assign(new Event("touchmove", { cancelable: true }), {
            changedTouches: [move],
            touches: [move],
          }),
        );
      });
      act(() => {
        window.dispatchEvent(
          Object.assign(new Event("touchend", { cancelable: true }), {
            changedTouches: [move],
            touches: [],
          }),
        );
      });
    };

    drag(item("Arcade"), 90, 500);
    drag(item("Food delivery"), 280, 520);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
