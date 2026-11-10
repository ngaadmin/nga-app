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
  floorName: "Growing",
  done: 13,
  total: 14,
  hasHandbook: true,
};

describe("Launchpad home shop fronts", () => {
  it("draws the 56px color icon on Dog walking and the grey icon on a locked tile", () => {
    render(<LaunchpadHome inProgress={[]} onOpenVenture={() => {}} />);
    const live = screen.getByRole("button", { name: "Dog walking. Open" });
    const locked = screen.getByRole("button", { name: "Lawn mowing. Locked" });
    expect(live.querySelector("img")?.getAttribute("src")).toBe("/launchpad/shopfront/web/dog-walking-256.png");
    expect(live.querySelector("img")?.className).toContain("size-14");
    expect(locked.querySelector("img")?.getAttribute("src")).toBe("/launchpad/shopfront/locked/lawn-mowing.png");
    expect(screen.getByRole("button", { name: "Bin cleaning. Locked" }).textContent).toContain("New");
    expect(screen.queryByRole("button", { name: /Writing a book/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Digital art shop/ })).toBeNull();
  });
});

describe("Launchpad home In Progress tile", () => {
  it("shows the name and only the current level's name: no level badge, prefix or milestone count", () => {
    render(<LaunchpadHome inProgress={[L6]} onOpenVenture={() => {}} onOpenHandbook={() => {}} />);
    const tile = document.querySelector("[data-in-progress='dog-walking']") as HTMLElement;
    expect(tile.textContent).toContain("Dog walking");
    expect(tile.querySelector("[data-tile-level-name]")?.textContent).toBe("Growing");
    expect(tile.textContent).not.toMatch(/L6|Level|Phase|Step|of 14/);
  });

  it("the progress bar covers the whole business, with an accessible label that follows the given total", () => {
    const { unmount } = render(<LaunchpadHome inProgress={[{ ...L6, done: 5, total: 14 }]} onOpenVenture={() => {}} />);
    expect(screen.getByRole("progressbar", { name: "5 of 14 milestones done" })).toBeTruthy();
    unmount();
    render(<LaunchpadHome inProgress={[L6]} onOpenVenture={() => {}} />);
    const bar = screen.getByRole("progressbar", { name: "13 of 14 milestones done" });
    expect(bar.getAttribute("aria-valuenow")).toBe("13");
    expect(bar.getAttribute("aria-valuemax")).toBe("14");
    expect((bar.firstElementChild as HTMLElement).style.width).toBe("93%");
  });

  it("compact row: thumb + name, level name, then workbook and Continue side by side with the same shape", () => {
    const onOpenHandbook = vi.fn();
    const onOpenVenture = vi.fn();
    render(<LaunchpadHome inProgress={[L6]} onOpenVenture={onOpenVenture} onOpenHandbook={onOpenHandbook} />);
    const tile = document.querySelector("[data-in-progress='dog-walking']") as HTMLElement;
    expect(tile.className).toContain("bg-white");
    expect(tile.querySelector("[data-tile-thumb] svg")).toBeTruthy();
    expect(tile.textContent).not.toMatch(/NGA|XP/);
    const book = screen.getByRole("button", { name: "Open your workbook" });
    const go = screen.getByRole("button", { name: "Continue" });
    expect(book.textContent).toBe("");
    expect(book.querySelector("img")?.getAttribute("src")).toBe("/launchpad/workbook/workbook-icon-512.png");
    expect(book.className).toContain("size-14");
    expect(book.className).not.toContain("border-");
    expect(tile.contains(book)).toBe(true);
    expect(document.querySelector("[data-in-progress-workbook]")).toBeNull();
    for (const c of ["h-11", "rounded-xl", "border-2", "bg-nga-ink", "text-white"]) expect(go.className).toContain(c);
    expect(go.className).not.toContain("flex-1");
    expect(book.parentElement).toBe(go.parentElement);
    expect(book.parentElement?.className).toContain("gap-[14px]");
    expect(go.compareDocumentPosition(book) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const row = tile.querySelector("[data-tile-row]")!;
    expect(row.contains(tile.querySelector("[data-tile-level-name]"))).toBe(true);
    expect(tile.querySelector("[data-tile-level-name]")!.className).toContain("truncate");
    fireEvent.click(book);
    fireEvent.click(go);
    expect(onOpenHandbook).toHaveBeenCalledWith("dog-walking", 6);
    expect(onOpenVenture).toHaveBeenCalledWith("dog-walking");
  });

  it("no handbook yet: the workbook button stays tappable", () => {
    const onOpenHandbook = vi.fn();
    render(<LaunchpadHome inProgress={[{ ...L6, hasHandbook: false, level: 1 }]} onOpenVenture={() => {}} onOpenHandbook={onOpenHandbook} />);
    const book = screen.getByRole("button", { name: "Open your workbook" });
    expect(book.getAttribute("aria-disabled")).toBeNull();
    expect(book.className).not.toContain("opacity-40");
    fireEvent.click(book);
    expect(onOpenHandbook).toHaveBeenCalledWith("dog-walking", 1);
  });

  it("the flow counts silvers done across the whole business out of the content's total", async () => {
    const payload = launchpadTestVentureSeed("dog-walking");
    const silvers = payload.floors.flatMap((f) => f.silvers);
    // Every silver up to and including l1-s3 (The Brand, D26): Level 1 done, Level 2 next.
    const doneSilvers = silvers.slice(0, silvers.findIndex((s) => s.id === "l1-s3") + 1);
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

  it("after the Level 6 split is locked, home opens the workbook on Level 6, not locked Level 7", async () => {
    const payload = launchpadTestVentureSeed("dog-walking");
    const done = payload.floors.filter((floor) => floor.level < 7);
    saveVentureTestProgress("dog-walking", {
      completedTaskIds: done.flatMap((floor) => floor.silvers.flatMap((silver) => silver.bronzes.flatMap((bronze) => bronze.tasks.map((task) => task.id)))),
    });
    const ventures: Record<string, LaunchpadVentureView> = { "dog-walking": { ok: true, payload, versionId: "seed", source: "seed" } };
    render(<VentureFlow initialVentureId={null} ventureTitles={{ "dog-walking": "Dog walking" }} ventures={ventures} reset={false} />);
    expect(await screen.findByText("Growing")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open your workbook" }));
    expect(await screen.findByRole("heading", { name: "My budget split" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Level 6, Budgeting/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Level 7/ })).toBeNull();
    expect(document.querySelector("[data-handbook-scope]")?.getAttribute("data-handbook-scope")).toBe("6");
  });
});

describe("In Progress tile: open tasks (Come back to this later)", () => {
  const OPEN = [
    { taskId: "l1-s2-b1-t1", title: "Set your goals" },
    { taskId: "l2-s1-b2-t1", title: "Know who your customers are" },
  ];

  it("with 0 open tasks the line shows 0 open and the tile keeps its compact layout (no list, no extra row)", () => {
    render(<LaunchpadHome inProgress={[{ ...L6, openTasks: [] }]} onOpenVenture={() => {}} />);
    const tile = document.querySelector("[data-in-progress='dog-walking']") as HTMLElement;
    expect(tile.querySelector("[data-open-tasks-toggle]")?.textContent).toContain("0 open");
    expect(tile.querySelector("[data-open-tasks-list]")).toBeNull();
    // Same children as a tile from before the feature: the row and the progress bar.
    expect(tile.children).toHaveLength(2);
  });

  it("shows '2 open' under the level name, collapsed; tapping expands one row per task and flips the chevron", () => {
    const onOpenTask = vi.fn();
    render(<LaunchpadHome inProgress={[{ ...L6, openTasks: OPEN }]} onOpenVenture={() => {}} onOpenHandbook={() => {}} onOpenTask={onOpenTask} />);
    const toggle = screen.getByRole("button", { name: "2 open" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.className).toContain("text-nga-cta-hover");
    // Under the level name, in the same column.
    const level = document.querySelector("[data-tile-level-name]") as HTMLElement;
    expect(level.parentElement?.contains(toggle)).toBe(true);
    expect(document.querySelector("[data-open-tasks-list]")).toBeNull();
    // No badge on the workbook (handbook) button.
    expect(document.querySelector("[data-handbook-button]")?.textContent).toBe("");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.querySelector("[data-chevron]")?.getAttribute("class")).toContain("rotate-180");
    const rows = document.querySelectorAll("[data-open-task]");
    expect([...rows].map((r) => r.textContent)).toEqual(["Set your goalsGo", "Know who your customers areGo"]);
    fireEvent.click(screen.getByRole("button", { name: "Go: Know who your customers are" }));
    expect(onOpenTask).toHaveBeenCalledWith("dog-walking", "l2-s1-b2-t1");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("[data-open-tasks-list]")).toBeNull();
  });
});

describe("In Progress tile: workbook button beside Continue (as in c1f534c; Jasper's review of 6f914e1)", () => {
  it("with open tasks the 2-line label block keeps Continue, then the 56px workbook, in the row", () => {
    render(
      <LaunchpadHome
        inProgress={[{ ...L6, openTasks: [{ taskId: "l1-s2-b1-t1", title: "Set your goals" }] }]}
        onOpenVenture={() => {}}
        onOpenHandbook={() => {}}
        onOpenTask={() => {}}
      />,
    );
    const actions = document.querySelector("[data-tile-actions]") as HTMLElement;
    const book = actions.querySelector("[data-handbook-button]") as HTMLElement;
    const go = actions.querySelector("[data-continue-button]") as HTMLElement;
    expect(book).toBeTruthy();
    expect(book.className).toContain("size-14");
    expect(book.className).not.toContain("border-");
    expect(book.querySelector("source")?.getAttribute("srcset")).toBe("/launchpad/workbook/workbook-icon-512.webp");
    expect(go.className).toContain("min-w-[84px]");
    expect([...actions.children]).toEqual([go, book]);
    expect(actions.className).toContain("gap-[14px]");
    // Two-line label block: level name, then "1 open".
    const level = document.querySelector("[data-tile-level-name]") as HTMLElement;
    expect(level.parentElement?.querySelector("[data-open-tasks-toggle]")?.textContent).toMatch(/^1 open/);
  });
});
