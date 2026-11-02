// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParentHubChildCard } from "@/components/parent/parent-hub-child-card";
import type { ParentHubChild } from "@/lib/parent/parent-hub-children";

afterEach(cleanup);

const waiting: ParentHubChild = {
  userId: "p1",
  username: "Amy",
  cohort: "explorer",
  status: "waiting",
  lessonsDone: 0,
  coins: 0,
  requestId: "r1",
};

describe("ParentHubChildCard", () => {
  it("shows a waiting child faded with the consent chip and no progress", () => {
    const { container } = render(
      <ParentHubChildCard child={waiting} onReview={() => {}} />,
    );
    const card = container.querySelector("[data-parent-tab-child='Amy']")!;
    expect(card.getAttribute("data-parent-tab-child-status")).toBe("waiting");
    expect(card.className).toContain("bg-white");
    expect(screen.getByText("Waiting for approval")).toBeTruthy();
    expect(container.querySelector("[data-parent-tab-child-coins]")).toBeNull();
    expect(container.querySelector("[data-parent-tab-child-summary]")).toBeNull();
    expect(container.querySelector(".grayscale")).not.toBeNull();
  });

  it("opens the approval, never the progress page, when tapped", () => {
    const onReview = vi.fn();
    const onOpen = vi.fn();
    render(<ParentHubChildCard child={waiting} onReview={onReview} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: /Review Amy's account/ }));
    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("is not tappable when no approval is open", () => {
    const onOpen = vi.fn();
    render(<ParentHubChildCard child={{ ...waiting, requestId: undefined }} onOpen={onOpen} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps an active child in full color and opening progress", () => {
    const onOpen = vi.fn();
    const { container } = render(
      <ParentHubChildCard
        child={{ ...waiting, status: "active", lessonsDone: 3, coins: 12, requestId: undefined }}
        onOpen={onOpen}
      />,
    );
    expect(container.querySelector(".grayscale")).toBeNull();
    expect(screen.queryByText("Waiting for approval")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "See Amy's progress" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
