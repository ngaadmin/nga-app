// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

  it("an L1 door opens its task directly: context, then the capture page; Finish waits for a pick", async () => {
    renderFlow({ kind: "level", level: 1 });
    const silver = PAYLOAD.floors[0]!.silvers[0]!;
    const bronze = silver.bronzes[0]!;
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(silver.title) }));
    fireEvent.click(door(bronze.title));
    expect(document.querySelector("[data-screen-type='context']")).toBeTruthy();
    expect(screen.getByText("Step 1 of 2")).toBeTruthy();
    expect(screen.queryByText(/tasks done/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Next/ }));
    expect(document.querySelector("[data-screen-type='choice-capture'][data-mode='multi']")).toBeTruthy();
    const finish = screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement;
    expect(finish.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Dog walking" }));
    expect(finish.disabled).toBe(false);
    // Previous goes back a page, and the pick is kept.
    fireEvent.click(screen.getByRole("button", { name: /Previous/ }));
    expect(document.querySelector("[data-screen-type='context']")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Next/ }));
    fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
    expect(door(silver.bronzes[1]!.title)).toBeTruthy();
  });

  it("a multi-task bronze (placeholder floors) still steps task to task with no list", async () => {
    renderFlow({ kind: "level", level: 3 });
    const silver = PAYLOAD.floors[2]!.silvers[0]!;
    const bronze = silver.bronzes[0]!;
    expect(bronze.tasks.length).toBeGreaterThan(1);
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(silver.title) }));
    fireEvent.click(door(bronze.title));
    expect(screen.getByText(`Task 1 of ${bronze.tasks.length}`)).toBeTruthy();
    for (let i = 1; i < bronze.tasks.length; i++) fireEvent.click(screen.getByRole("button", { name: /^Next/ }));
    expect(screen.getByText(`Task ${bronze.tasks.length} of ${bronze.tasks.length}`)).toBeTruthy();
  });
});

const next = () => fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));

describe("Level 1 from the load: capture, goal loop, wrap-up edits, gold", () => {
  it("walks L1, edits on the wrap-up, then shows the silver page and the gold completion", async () => {
    renderFlow({ kind: "level", level: 1 });
    const silver = PAYLOAD.floors[0]!.silvers[0]!;
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(silver.title) }));
    // Offer.
    fireEvent.click(door(silver.bronzes[0]!.title));
    next();
    fireEvent.click(screen.getByRole("button", { name: "Dog walking" }));
    fireEvent.click(screen.getByRole("button", { name: "Training" }));
    next();
    // Why: arrows reorder, N/A strikes a reason out of the goal loop.
    fireEvent.click(door(silver.bronzes[1]!.title));
    next();
    fireEvent.click(screen.getByRole("button", { name: "Move Help others up" }));
    fireEvent.click(screen.getByRole("button", { name: "Not applicable: Learn new skills" }));
    expect(document.querySelector("[data-rank-item='learn-new-skills'][data-struck]")).toBeTruthy();
    next();
    // Cause.
    fireEvent.click(door(silver.bronzes[2]!.title));
    next();
    const finish = screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement;
    expect(finish.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Animals" }));
    next();
    // Goals, one page each in the ranked order (struck and skipped reasons left out).
    fireEvent.click(door(silver.bronzes[3]!.title));
    next();
    expect(screen.getByText("Goal 1 of 5")).toBeTruthy();
    expect(screen.getByText(/I want my customers to/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Not applicable" }));
    next();
    expect(screen.getByText("Goal 2 of 5")).toBeTruthy();
    expect(screen.getByText(/I want to earn/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), { target: { value: "500" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Number" }), { target: { value: "6" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Months or years" }), { target: { value: "months" } });
    expect(document.querySelector("[data-currency-chip]")?.textContent).toBeTruthy();
    next();
    expect(screen.getByText("Goal 3 of 5")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button").find((b) => b.textContent === "Set my own schedule" || /schedule/i.test(b.textContent ?? ""))!);
    next();
    expect(screen.getByText("Goal 4 of 5")).toBeTruthy();
    // The cause carries into the donate goal.
    expect(document.querySelector("[data-carried='l1-cause']")?.textContent).toMatch(/^animals$/i);
    fireEvent.change(screen.getByRole("textbox", { name: "Percent" }), { target: { value: "10" } });
    next();
    expect(screen.getByText("Goal 5 of 5")).toBeTruthy();
    // The extra goal is optional.
    next();

    // Wrap-up: one page for the silver.
    expect(document.querySelector("[data-wrap-up='workbook-summary']")).toBeTruthy();
    const offer = document.querySelector("[data-summary-section='what-my-business-will-offer']") as HTMLElement;
    expect(offer.textContent).toContain("Dog walking");
    expect(offer.textContent).toContain("Training");
    // Read-only: the why ranking and the cause.
    expect(document.querySelector("[data-summary-section='my-why'] [data-pencil]")).toBeNull();
    expect(document.querySelector("[data-summary-section='my-cause'] [data-pencil]")).toBeNull();
    // Editable: the offer picks, in place.
    fireEvent.click(screen.getByRole("button", { name: "Edit What my business will offer" }));
    fireEvent.click(within(offer).getByRole("button", { name: "Grooming" }));
    fireEvent.click(within(offer).getByRole("button", { name: "Save" }));
    expect(offer.textContent).toContain("Grooming");
    // Editable: a goal's amount, in place.
    fireEvent.click(screen.getByRole("button", { name: "Edit Make money" }));
    const editor = document.querySelector("[data-inline-editor='l1-goal-make-money']") as HTMLElement;
    fireEvent.change(within(editor).getByRole("textbox", { name: "Amount" }), { target: { value: "750" } });
    fireEvent.click(within(editor).getByRole("button", { name: "Save" }));
    expect(document.querySelector("[data-summary-section='my-goals']")?.textContent).toMatch(/750/);
    fireEvent.click(screen.getByRole("button", { name: "Finalize" }));

    // Silver page, then the gold completion, then on to Planning.
    expect(document.querySelector("[data-silver-complete='l1-s1']")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-gold-completion='1']")).toBeTruthy();
    expect(screen.getByRole("heading", { name: PAYLOAD.floors[0]!.gold.completion!.heading })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\bNGA\b|\bXP\b/);
    fireEvent.click(screen.getByRole("button", { name: PAYLOAD.floors[0]!.gold.completion!.buttonLabel }));
    expect(document.querySelector("[data-gold-completion]")).toBeNull();
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
  it("a silver with no wrap-up opens its page in 'just completed' mode; Continue goes on", async () => {
    renderFlow({ kind: "level", level: 3 });
    const silver = PAYLOAD.floors[2]!.silvers[0]!;
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
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 3/);
  });

  it("is not shown when re-entering and re-finishing finished work", async () => {
    renderFlow({ kind: "through-silver", silverId: "l3-s1" });
    const silver = PAYLOAD.floors[2]!.silvers[0]!;
    expect(silver.id).toBe("l3-s1");
    expect(silver.wrapUp).toBeUndefined();
    // Review the silver's last bronze and finish its last task again.
    const last = silver.bronzes[silver.bronzes.length - 1]!;
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(silver.title) }));
    fireEvent.click(door(last.title));
    for (let i = 0; i < last.tasks.length; i++) fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 3/);
  });

  it("a summary silver re-finalized from review does not show the page again", async () => {
    renderFlow({ kind: "through-silver", silverId: "l2-s1" });
    fireEvent.click(await screen.findByRole("button", { name: /Know the product and its buyers/ }));
    const last = PAYLOAD.floors[1]!.silvers[0]!.bronzes[1]!;
    fireEvent.click(door(last.title));
    next();
    // Shortcut sample answers fill the captures, so Finish is on.
    next();
    expect(document.querySelector("[data-wrap-up='workbook-summary']")).toBeTruthy();
    expect(document.querySelector("[data-summary-section='who-might-want-it']")?.textContent).not.toMatch(/Not answered yet/);
    fireEvent.click(screen.getByRole("button", { name: "Finalize" }));
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
