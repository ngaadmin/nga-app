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

  it("the progress bar covers the whole business, with an accessible label that follows the given total", () => {
    const { unmount } = render(<LaunchpadHome inProgress={[{ ...L6, done: 5, total: 15 }]} onOpenVenture={() => {}} />);
    expect(screen.getByRole("progressbar", { name: "5 of 15 milestones done" })).toBeTruthy();
    unmount();
    render(<LaunchpadHome inProgress={[L6]} onOpenVenture={() => {}} />);
    const bar = screen.getByRole("progressbar", { name: "13 of 16 milestones done" });
    expect(bar.getAttribute("aria-valuenow")).toBe("13");
    expect(bar.getAttribute("aria-valuemax")).toBe("16");
    expect((bar.firstElementChild as HTMLElement).style.width).toBe("81%");
  });

  it("compact row: thumb + name, level name, then workbook and Continue side by side with the same shape", () => {
    const onOpenHandbook = vi.fn();
    const onOpenVenture = vi.fn();
    render(<LaunchpadHome inProgress={[L6]} onOpenVenture={onOpenVenture} onOpenHandbook={onOpenHandbook} />);
    const tile = document.querySelector("[data-in-progress='dog-walking']") as HTMLElement;
    expect(tile.className).toContain("bg-white");
    expect(tile.querySelector("[data-tile-thumb] svg")).toBeTruthy();
    expect(tile.textContent).not.toMatch(/NGA|XP/);
    const book = screen.getByRole("button", { name: "Open handbook" });
    const go = screen.getByRole("button", { name: "Continue" });
    expect(book.textContent).toBe("");
    expect(book.querySelector("svg")!.getAttribute("width")).toBe("28");
    expect(book.className).not.toContain("BDE9FB");
    for (const c of ["h-11", "w-11", "rounded-xl", "border-2", "border-nga-ink", "bg-white"]) expect(book.className).toContain(c);
    for (const c of ["h-11", "rounded-xl", "border-2", "bg-nga-cta"]) expect(go.className).toContain(c);
    expect(go.className).not.toContain("flex-1");
    expect(book.parentElement).toBe(go.parentElement);
    const row = tile.querySelector("[data-tile-row]")!;
    expect(row.contains(tile.querySelector("[data-tile-level-name]"))).toBe(true);
    expect(tile.querySelector("[data-tile-level-name]")!.className).toContain("truncate");
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
    // Every silver up to and including l2-s1, however many silvers L1 has.
    const doneSilvers = silvers.slice(0, silvers.findIndex((s) => s.id === "l2-s1") + 1);
    expect(doneSilvers.length).toBeGreaterThan(0);
    saveVentureTestProgress("dog-walking", {
      completedTaskIds: doneSilvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.map((t) => t.id))),
      answers: {},
    });
    const ventures: Record<string, LaunchpadVentureView> = { "dog-walking": { ok: true, payload, versionId: "seed", source: "seed" } };
    render(<VentureFlow initialVentureId={null} ventureTitles={{ "dog-walking": "Dog walking" }} ventures={ventures} reset={false} />);
    const bar = await screen.findByRole("progressbar", { name: `${doneSilvers.length} of ${silvers.length} milestones done` });
    expect(bar).toBeTruthy();
    const level2 = payload.floors[1]!.name;
    expect(document.querySelector("[data-tile-level-name]")?.textContent).toBe(level2);
  });
});
