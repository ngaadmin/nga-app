// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(cleanup);
import { moveAcrossLine, RankOrderScreen, BELOW_LINE_HINT, RANK_GUIDANCE } from "@/components/launchpad/venture/screens/rank-order-screen";
import type { LaunchpadRankOrderScreen } from "@/lib/launchpad/content/types";
import { isPageAnswered } from "@/lib/launchpad/content/task-pages";
import { rankingAnswer } from "@/lib/launchpad/content/answers";

const SCREEN = {
  type: "rank-order",
  id: "why",
  answerKey: "why",
  prompt: "Why?",
  notApplicableLabel: "Not applicable",
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
  it("shows the empty zone hint and guidance, no N/A chips; arrows move tiles across the line and numbers run 1 to N", () => {
    render(<RankOrderScreen screen={SCREEN} />);
    expect(screen.getByText(BELOW_LINE_HINT)).toBeTruthy();
    expect(screen.getByText(RANK_GUIDANCE)).toBeTruthy();
    expect(screen.queryByText("N/A")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Move Delta down" }));
    expect(numbers()).toEqual(["a", "b", "c"]);
    expect(zone()).toEqual(["d"]);
    expect(screen.queryByText(BELOW_LINE_HINT)).toBeNull();
    const muted = document.querySelector("[data-below-line] [data-rank-item='d'] span") as HTMLElement;
    expect(muted.className).not.toMatch(/line-through/);
    fireEvent.click(screen.getByRole("button", { name: "Move Delta up, doesn't apply to me" }));
    expect(numbers()).toEqual(["a", "b", "c", "d"]);
    expect(zone()).toEqual([]);
  });

  it("is not answered once every reason is below the line", () => {
    expect(isPageAnswered(SCREEN, { why: rankingAnswer(["a", "b", "c", "d"], ["a", "b", "c", "d"]) })).toBe(false);
    expect(isPageAnswered(SCREEN, { why: rankingAnswer(["a", "b", "c", "d"], ["b", "c", "d"]) })).toBe(true);
    expect(isPageAnswered(SCREEN, {})).toBe(true);
  });
});
