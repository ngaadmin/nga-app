// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(cleanup);
import { moveAcrossLine, RankOrderScreen } from "@/components/launchpad/venture/screens/rank-order-screen";
import type { LaunchpadRankOrderScreen } from "@/lib/launchpad/content/types";
import { isPageAnswered } from "@/lib/launchpad/content/task-pages";
import { rankingAnswer } from "@/lib/launchpad/content/answers";

// jsdom has no PointerEvent: a MouseEvent with a pointerId stands in.
if (typeof window !== "undefined" && !("PointerEvent" in window)) {
  class PointerEventShim extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventShim;
}

const SCREEN = {
  type: "rank-order",
  id: "why",
  answerKey: "why",
  prompt: "Why?",
  notApplicableLabel: "Not applicable",
  guidance: "Drag the reasons into order, most important at the top.",
  belowTitle: "Doesn't apply to me",
  belowHint: "Drag any reason that doesn't apply to you here. This is optional.",
  items: [
    { id: "a", label: "Alpha" },
    { id: "b", label: "Bravo" },
    { id: "c", label: "Charlie" },
    { id: "d", label: "Delta" },
  ],
} as unknown as LaunchpadRankOrderScreen;

const numbers = () => [...document.querySelectorAll("ol[aria-label='Your ranking'] [data-rank-item]")].map((li) => li.getAttribute("data-rank-item"));
const zone = () => [...document.querySelectorAll("[data-below-line] [data-rank-item]")].map((li) => li.getAttribute("data-rank-item"));

describe("moveAcrossLine", () => {
  it("drops the last ranked tile below the line and lifts the top zone tile back to last place", () => {
    expect(moveAcrossLine({ above: ["a", "b"], below: ["c"] }, "b", 1)).toEqual({ above: ["a"], below: ["b", "c"] });
    expect(moveAcrossLine({ above: ["a"], below: ["b", "c"] }, "b", -1)).toEqual({ above: ["a", "b"], below: ["c"] });
    expect(moveAcrossLine({ above: ["a"], below: ["b", "c"] }, "b", 1)).toEqual({ above: ["a"], below: ["c", "b"] });
    expect(moveAcrossLine({ above: ["a", "b"], below: [] }, "b", -1)).toEqual({ above: ["b", "a"], below: [] });
  });
});

describe("RankOrderScreen below the line", () => {
  const tileOf = (id: string) => document.querySelector(`[data-rank-item='${id}']`) as HTMLElement;
  it("shows the empty zone hint and drag guidance, no arrows or N/A chips; the keyboard moves tiles across the line", () => {
    const edited = { ...SCREEN, guidance: "Order the reasons your way.", belowHint: "Park a reason here." };
    render(<RankOrderScreen screen={edited} />);
    expect(screen.getByText("Park a reason here.")).toBeTruthy();
    expect(screen.getByText("Order the reasons your way.")).toBeTruthy();
    expect(screen.queryByText(SCREEN.belowHint!)).toBeNull();
    expect(screen.queryByText("N/A")).toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    fireEvent.keyDown(tileOf("d"), { key: "ArrowDown" });
    expect(numbers()).toEqual(["a", "b", "c"]);
    expect(zone()).toEqual(["d"]);
    expect(document.querySelector("[data-rank-announce]")?.textContent).toBe("Delta moved below the line: doesn't apply to me.");
    expect(screen.queryByText("Park a reason here.")).toBeNull();
    const muted = document.querySelector("[data-below-line] [data-rank-item='d'] span") as HTMLElement;
    expect(muted.className).not.toMatch(/line-through/);
    fireEvent.keyDown(tileOf("d"), { key: "ArrowUp" });
    expect(numbers()).toEqual(["a", "b", "c", "d"]);
    expect(zone()).toEqual([]);
    fireEvent.keyDown(tileOf("d"), { key: "ArrowUp" });
    expect(numbers()).toEqual(["a", "b", "d", "c"]);
    expect(document.querySelector("[data-rank-announce]")?.textContent).toBe("Delta is now number 3.");
    expect(tileOf("d").getAttribute("tabindex")).toBe("0");
    expect(tileOf("d").getAttribute("aria-label")).toMatch(/up and down arrow keys/);
  });

  it("a pointer drag moves a tile by midpoints, across the line too; a tap does nothing", () => {
    render(<RankOrderScreen screen={SCREEN} />);
    // Rows are 50px tall from y=0: a, b, c, d, then the line header at 220.
    const ys: Record<string, number> = { a: 0, b: 50, c: 100, d: 150, __line__: 220 };
    const rect = (el: Element) => {
      const id = el.getAttribute("data-rank-item") ?? (el.hasAttribute("data-rank-line") ? "__line__" : null);
      const top = id ? ys[id]! : 0;
      return { top, bottom: top + 44, height: 44, left: 0, right: 300, width: 300, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
    };
    const spy = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return rect(this);
    });
    fireEvent.pointerDown(tileOf("a"), { pointerId: 1, button: 0, clientY: 10 });
    fireEvent.pointerUp(window, { pointerId: 1, clientY: 12 });
    expect(numbers()).toEqual(["a", "b", "c", "d"]);
    fireEvent.pointerDown(tileOf("a"), { pointerId: 2, button: 0, clientY: 10 });
    fireEvent.pointerMove(window, { pointerId: 2, clientY: 140 });
    expect(document.querySelector("[data-screen-type='rank-order'][data-dragging]")).toBeTruthy();
    fireEvent.pointerUp(window, { pointerId: 2, clientY: 140 });
    expect(numbers()).toEqual(["b", "c", "a", "d"]);
    expect(document.querySelector("[data-dragging]")).toBeNull();
    fireEvent.pointerDown(tileOf("b"), { pointerId: 3, button: 0, clientY: 10 });
    fireEvent.pointerMove(window, { pointerId: 3, clientY: 260 });
    fireEvent.pointerUp(window, { pointerId: 3, clientY: 260 });
    expect(zone()).toEqual(["b"]);
    spy.mockRestore();
  });

  it("is not answered once every reason is below the line", () => {
    expect(isPageAnswered(SCREEN, { why: rankingAnswer(["a", "b", "c", "d"], ["a", "b", "c", "d"]) })).toBe(false);
    expect(isPageAnswered(SCREEN, { why: rankingAnswer(["a", "b", "c", "d"], ["b", "c", "d"]) })).toBe(true);
    expect(isPageAnswered(SCREEN, {})).toBe(true);
  });
});
