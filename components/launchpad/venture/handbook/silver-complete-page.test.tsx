// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { handbookPages } from "@/lib/launchpad/venture-test/handbook";
import { SilverCompletePage } from "@/components/launchpad/venture/handbook/silver-complete-page";

afterEach(cleanup);
const floors = launchpadTestVentureSeed("dog-walking").floors;
const silver = floors[0]!.silvers[0]!;
const progress = { completedTaskIds: silver.bronzes.flatMap((b) => b.tasks.map((t) => t.id)), answers: {} };
const page = handbookPages(progress, floors).find((p) => p.silver.id === silver.id)!;

describe("SilverCompletePage", () => {
  it("renders the page through a swappable renderer, with one Continue button", () => {
    const onContinue = vi.fn();
    render(
      <SilverCompletePage
        level={1}
        page={page}
        iconVentureId="dog-walking"
        onBuilding={() => {}}
        onCorridor={() => {}}
        onContinue={onContinue}
        renderPage={({ page: p }) => <div data-testid="custom">Custom page for {p.silver.title}</div>}
      />,
    );
    expect(screen.getByTestId("custom").textContent).toContain(silver.title);
    expect(document.querySelector("[data-handbook-page]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
