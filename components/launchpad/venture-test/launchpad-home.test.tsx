// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";
import { saveVentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-storage";
import { LaunchpadHome, type InProgressVenture } from "@/components/launchpad/venture-test/launchpad-home";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

const L6: InProgressVenture = {
  ventureId: "dog-walking",
  name: "Dog walking",
  level: 6,
  floorName: "Budgeting",
  done: 13,
  total: 16,
  hasHandbook: true,
};

describe("Launchpad home In Progress tile", () => {
  it("shows the name and only the current level's name: no level badge, prefix or milestone count", () => {
    render(<LaunchpadHome inProgress={[L6]} onOpenVenture={() => {}} onOpenHandbook={() => {}} />);
    const tile = document.querySelector("[data-in-progress='dog-walking']") as HTMLElement;
    expect(tile.textContent).toContain("Dog walking");
    expect(tile.querySelector("[data-tile-level-name]")?.textContent).toBe("Budgeting");
    expect(tile.textContent).not.toMatch(/L6|Level|Phase|Step|of 16/);
  });

  it("the progress bar covers the whole business, with an accessible label", () => {
    render(<LaunchpadHome inProgress={[L6]} onOpenVenture={() => {}} />);
    const bar = screen.getByRole("progressbar", { name: "13 of 16 milestones done" });
    expect(bar.getAttribute("aria-valuenow")).toBe("13");
    expect(bar.getAttribute("aria-valuemax")).toBe("16");
    expect((bar.firstElementChild as HTMLElement).style.width).toBe("81%");
  });

  it("the handbook button is a square icon-only button in Continue's shape family", () => {
    const onOpenHandbook = vi.fn();
    const onOpenVenture = vi.fn();
    render(<LaunchpadHome inProgress={[L6]} onOpenVenture={onOpenVenture} onOpenHandbook={onOpenHandbook} />);
    const book = screen.getByRole("button", { name: "Open handbook" });
    const go = screen.getByRole("button", { name: "Continue" });
    expect(book.textContent).toBe("");
    for (const c of ["h-12", "w-12", "rounded-[14px]", "border-[#BDE9FB]", "bg-white"]) expect(book.className).toContain(c);
    for (const c of ["h-12", "rounded-[14px]", "flex-1", "bg-nga-cta"]) expect(go.className).toContain(c);
    expect(book.parentElement).toBe(go.parentElement);
    expect(book.parentElement!.className).toContain("gap-2");
    fireEvent.click(book);
    fireEvent.click(go);
    expect(onOpenHandbook).toHaveBeenCalledWith("dog-walking");
    expect(onOpenVenture).toHaveBeenCalledWith("dog-walking");
  });

  it("no handbook yet: only Continue in the row", () => {
    render(<LaunchpadHome inProgress={[{ ...L6, hasHandbook: false }]} onOpenVenture={() => {}} onOpenHandbook={() => {}} />);
    expect(screen.queryByRole("button", { name: "Open handbook" })).toBeNull();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });

  it("the flow counts silvers done across the whole business out of the content's total", async () => {
    const payload = launchpadTestVentureSeed("dog-walking");
    const silvers = payload.floors.flatMap((f) => f.silvers);
    const doneSilvers = silvers.slice(0, 3); // L1 (2 silvers) + l2-s1
    expect(doneSilvers.at(-1)!.id).toBe("l2-s1");
    saveVentureTestProgress("dog-walking", {
      completedTaskIds: doneSilvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.map((t) => t.id))),
      answers: {},
    });
    const ventures: Record<string, LaunchpadVentureView> = { "dog-walking": { ok: true, payload, versionId: "seed", source: "seed" } };
    render(<VentureFlow initialVentureId={null} ventureTitles={{ "dog-walking": "Dog walking" }} ventures={ventures} reset={false} />);
    const bar = await screen.findByRole("progressbar", { name: `3 of ${silvers.length} milestones done` });
    expect(bar).toBeTruthy();
    const level2 = payload.floors[1]!.name;
    expect(document.querySelector("[data-tile-level-name]")?.textContent).toBe(level2);
  });
});
