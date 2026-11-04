// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { handbookPages, milestoneView, partLabel } from "@/lib/launchpad/venture-test/handbook";
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
        milestone={milestoneView(progress, floors, 1)}
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

  it("milestone wrap-up: done heading, steps done, what you built, next up, on the binder page", () => {
    render(
      <SilverCompletePage
        level={1}
        page={page}
        milestone={milestoneView(progress, floors, 1)}
        iconVentureId="dog-walking"
        onBuilding={() => {}}
        onCorridor={() => {}}
        onContinue={() => {}}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Define the business: done! ");
    expect(document.querySelector("[data-milestone-steps]")?.textContent).toBe("1 of 15 steps done");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
    const chips = [...document.querySelectorAll("[data-what-you-built] [data-tag-chip]")].map((c) => c.textContent);
    expect(chips).toEqual(silver.bronzes.map((b) => b.title));
    expect(document.querySelector("[data-next-up]")?.textContent).toBe("Build your identityNext on Level 1.");
    // The real building, about 80px tall: no finished floors yet, Level 1 outlined in orange.
    const bld = document.querySelector("[data-next-up] [data-next-up-building]") as SVGElement;
    expect(bld.getAttribute("height")).toBe("80");
    expect(bld.querySelector("[data-floor-next='1']")?.getAttribute("stroke")).toBe("#FFA503");
    expect(bld.querySelector("[data-floor-done]")).toBeNull();
    // Ticks are orange with a white check.
    expect(document.querySelectorAll("[data-what-you-built] [data-tick]").length).toBeGreaterThan(0);
    const card = document.querySelector("[data-silver-complete-card]")!;
    expect(card.hasAttribute("data-binder-card")).toBe(true);
    expect(card.querySelector("[data-spiral-binding]")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\b(silver|bronze|gold|NGA)\b/i);
    expect(screen.getAllByRole("button", { name: "Continue" })).toHaveLength(1);
  });

  it("placeholder part titles never show the words bronze, silver or gold", () => {
    expect(partLabel("Bronze 2", 1)).toBe("Part 2");
    expect(partLabel("Find the why", 1)).toBe("Find the why");
  });
});
