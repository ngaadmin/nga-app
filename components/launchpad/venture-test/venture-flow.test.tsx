// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";
import type { VentureTestShortcut } from "@/lib/launchpad/venture-test/venture-test-progress";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";

const PAYLOAD = launchpadTestVentureSeed("dog-walking");
const VENTURES: Record<string, LaunchpadVentureView> = {
  "dog-walking": { ok: true, payload: PAYLOAD, versionId: "seed", source: "seed" },
};

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});
afterEach(cleanup);

function renderFlow(shortcut: VentureTestShortcut) {
  return render(
    <VentureFlow initialVentureId="dog-walking" ventureTitles={{ "dog-walking": "Dog walking" }} ventures={VENTURES} reset={false} shortcut={shortcut} />,
  );
}

const door = (title: string) => screen.getByRole("button", { name: new RegExp(title) });

describe("bronze doors open their tasks directly (no task list)", () => {
  it("the 'Design your logo' door lands on the logo builder; Exit goes back to the doors", async () => {
    renderFlow({ kind: "through-silver", silverId: "l2-s1" });
    fireEvent.click(await screen.findByRole("button", { name: /Build your identity/ }));
    fireEvent.click(door("Design your logo"));
    expect(document.querySelector("[data-task-screen='logo-builder']")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Design your logo" })).toBeTruthy();
    expect(screen.queryByText(/tasks done/)).toBeNull();
    expect(screen.queryByText(/Task content TBC/)).toBeNull();
    expect(screen.queryByRole("button", { name: /^(Start|Review tasks)$/ })).toBeNull();
    // Breadcrumb still leads back to the building and the floor's corridor.
    const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(crumb.textContent).toMatch(/Building · Level 2 corridor · Design your logo/);
    fireEvent.click(screen.getByRole("button", { name: /Exit/ }));
    expect(door("Design your logo")).toBeTruthy();
    expect(screen.getByText("Name your business")).toBeTruthy();
  });

  it("a multi-task bronze opens its first unfinished task and steps task to task with no list", async () => {
    renderFlow({ kind: "through-silver", silverId: "l1-s1" });
    const silver = PAYLOAD.floors[0]!.silvers[1]!;
    const bronze = silver.bronzes[0]!;
    expect(bronze.tasks.length).toBeGreaterThan(1);
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(silver.title) }));
    fireEvent.click(door(bronze.title));
    expect(screen.getByRole("heading", { name: bronze.tasks[0]!.title })).toBeTruthy();
    expect(screen.getByText(`Task 1 of ${bronze.tasks.length}`)).toBeTruthy();
    expect(screen.queryByText(/tasks done/)).toBeNull();
    for (let i = 1; i < bronze.tasks.length; i++) {
      fireEvent.click(screen.getByRole("button", { name: /^Next/ }));
      expect(screen.getByRole("heading", { name: bronze.tasks[i]!.title })).toBeTruthy();
    }
  });
});

/** Opens every bronze of `silver` in turn and clicks through all its tasks. */
async function finishSilver(silver: (typeof PAYLOAD.floors)[number]["silvers"][number]) {
  fireEvent.click(await screen.findByRole("button", { name: new RegExp(silver.title) }));
  for (const bronze of silver.bronzes) {
    fireEvent.click(door(bronze.title));
    for (let i = 0; i < bronze.tasks.length; i++) {
      fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
    }
  }
}

describe("finishing a silver shows its handbook page", () => {
  it("the last task of a silver opens that silver's page in 'just completed' mode; Continue goes on", async () => {
    renderFlow({ kind: "through-silver", silverId: "l1-s1" });
    const silver = PAYLOAD.floors[0]!.silvers[1]!;
    expect(silver.wrapUp).toBeUndefined();
    await finishSilver(silver);
    const done = document.querySelector(`[data-silver-complete='${silver.id}']`);
    expect(done).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Added to your handbook" })).toBeTruthy();
    const page = document.querySelector(`[data-handbook-page='${silver.id}']`);
    expect(page?.getAttribute("data-editable")).toBe("false");
    // A single primary action.
    expect(screen.getAllByRole("button", { name: "Continue" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    // Back to the floor, as finishing a silver did before.
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 1/);
  });

  it("is not shown when re-entering and re-finishing finished work", async () => {
    renderFlow({ kind: "through-silver", silverId: "l2-s1" });
    const silver = PAYLOAD.floors[1]!.silvers[0]!;
    expect(silver.id).toBe("l2-s1");
    expect(silver.wrapUp).toBeUndefined();
    // Review the silver's last bronze and finish its last task again.
    const last = silver.bronzes[silver.bronzes.length - 1]!;
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(silver.title) }));
    fireEvent.click(door(last.title));
    for (let i = 0; i < last.tasks.length; i++) fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 2/);
  });

  it("identity: the wrap-up stays, and Finalize opens the vision/products handbook page", async () => {
    renderFlow({ kind: "through-silver", silverId: "l2-s1" });
    fireEvent.click(await screen.findByRole("button", { name: /Build your identity/ }));
    fireEvent.click(door("Design your logo"));
    for (const label of ["Circle", "Light blue", "Paw"]) fireEvent.click(screen.getByRole("radio", { name: label }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(door("Name your business"));
    fireEvent.change(document.querySelector("[data-task-screen='name-form'] input")!, { target: { value: "Happy Paws" } });
    fireEvent.click(screen.getByRole("radio", { name: "Rounded" }));
    fireEvent.click(screen.getByRole("radio", { name: "Logo color" }));
    fireEvent.click(screen.getByRole("button", { name: /Save to my workbook/ }));
    expect(document.querySelector("[data-wrap-up='identity']")).toBeTruthy();
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Finalize/ }));
    expect(document.querySelector("[data-silver-complete='l2-s2']")).toBeTruthy();
    expect(document.querySelector("[data-handbook-page='l2-s2']")).toBeTruthy();
    expect(screen.getAllByText("Happy Paws").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 2/);
    // Re-opening the finished identity wrap-up and finalizing again does not show the page.
    fireEvent.click(screen.getByRole("button", { name: /Build your identity/ }));
    fireEvent.click(screen.getByRole("button", { name: /See your logo/ }));
    fireEvent.click(screen.getByRole("button", { name: /Finalize/ }));
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 2/);
  });
});
