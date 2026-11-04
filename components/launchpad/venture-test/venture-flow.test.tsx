// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";
import type { VentureTestShortcut } from "@/lib/launchpad/venture-test/venture-test-progress";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";
import { markVentureTestOnboardingSeen, saveVentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-storage";

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

  it("an L1 door opens one screen: context, guidance, then the question and options; Finish waits for a pick", async () => {
    renderFlow({ kind: "level", level: 1 });
    const silver = PAYLOAD.floors[0]!.silvers[0]!;
    const bronze = silver.bronzes[0]!;
    const capture = bronze.tasks[0]!.screens[0]!;
    if (capture.type !== "choice-capture") throw new Error("expected the offer capture first");
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(silver.title) }));
    fireEvent.click(door(bronze.title));
    expect(bronze.tasks[0]!.screens).toHaveLength(1);
    expect(document.querySelector("[data-screen-type='context']")).toBeNull();
    const page = document.querySelector("[data-screen-type='choice-capture'][data-mode='multi']") as HTMLElement;
    expect(page).toBeTruthy();
    // Context at the top, guidance under it, then the question, then the options.
    const intro = page.querySelector("[data-screen-intro]") as HTMLElement;
    expect(intro.textContent).toContain(capture.context!);
    expect(intro.querySelector("[data-guidance]")?.textContent).toBe(capture.guidance);
    const prompt = screen.getByText(capture.prompt);
    const options = screen.getByRole("group");
    expect(intro.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(prompt.compareDocumentPosition(options) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(/tasks done/)).toBeNull();
    const finish = screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement;
    expect(finish.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Dog walking" }));
    expect(finish.disabled).toBe(false);
    fireEvent.click(finish);
    expect(door(silver.bronzes[1]!.title)).toBeTruthy();
  });

  it("every L1 and L2 capture bronze is one screen with its context; Set your goals carries its intro on the goal loop", () => {
    const bronzes = [...PAYLOAD.floors[0]!.silvers[0]!.bronzes, ...PAYLOAD.floors[1]!.silvers[0]!.bronzes];
    for (const b of bronzes) {
      const screens = b.tasks[0]!.screens;
      expect(screens.some((s) => s.type === "context")).toBe(false);
      if (screens[0]!.type === "goal-loop") {
        expect(b.title).toBe("Set your goals");
        expect(screens).toHaveLength(1);
        expect(screens[0]!.context).toBeTruthy();
        expect(screens[0]!.guidance).toBeTruthy();
      } else {
        expect(screens).toHaveLength(1);
        expect((screens[0] as { context?: string }).context).toBeTruthy();
      }
    }
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
    // Offer: one screen.
    fireEvent.click(door(silver.bronzes[0]!.title));
    fireEvent.click(screen.getByRole("button", { name: "Dog walking" }));
    fireEvent.click(screen.getByRole("button", { name: "Training" }));
    next();
    // Why: arrows reorder, N/A strikes a reason out of the goal loop.
    fireEvent.click(door(silver.bronzes[1]!.title));
    fireEvent.click(screen.getByRole("button", { name: "Move Help others up" }));
    fireEvent.click(screen.getByRole("button", { name: "Not applicable: Learn new skills" }));
    expect(document.querySelector("[data-rank-item='learn-new-skills'][data-struck]")).toBeTruthy();
    next();
    // Cause.
    fireEvent.click(door(silver.bronzes[2]!.title));
    const finish = screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement;
    expect(finish.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Animals" }));
    next();
    // Goals, one page each in the ranked order (struck reasons left out). Step 1
    // shows the Set your goals intro and the first goal's inputs together.
    fireEvent.click(door(silver.bronzes[3]!.title));
    const loop = silver.bronzes[3]!.tasks[0]!.screens[0]!;
    if (loop.type !== "goal-loop") throw new Error("expected goal-loop");
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
    expect(screen.getByText("Goal 1 of 5")).toBeTruthy();
    expect(document.querySelector("[data-screen-intro] [data-guidance]")?.textContent).toBe(loop.guidance);
    expect(screen.getByText(/I want my customers to/)).toBeTruthy();
    // No goal-level Not applicable (Cath, 4 Nov 8:49pm); Help others has no timeframe and starts empty.
    expect(screen.queryByRole("button", { name: "Not applicable" })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    const benefit = screen.getByRole("textbox", { name: "Benefit" }) as HTMLInputElement;
    expect(benefit.value).toBe("");
    expect((screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(benefit, { target: { value: "have happy dogs" } });
    next();
    expect(screen.getByText("Step 2 of 5")).toBeTruthy();
    expect(screen.getByText("Goal 2 of 5")).toBeTruthy();
    expect(screen.getByText(/I want to earn/)).toBeTruthy();
    expect(document.body.textContent).toMatch(/ in /);
    expect(document.querySelector("[data-screen-intro]")).toBeNull();
    expect((screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement).disabled).toBe(true);
    // Amount and duration start empty, with hints; the unit is weeks or months only.
    const amount = screen.getByRole("textbox", { name: "Amount" }) as HTMLInputElement;
    const weeksOrMonths = screen.getByRole("combobox", { name: "Weeks or months" }) as HTMLSelectElement;
    expect(amount.value).toBe("");
    expect((screen.getByRole("textbox", { name: "Number" }) as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("textbox", { name: "Number" }) as HTMLInputElement).placeholder).toBe("[1–99]");
    expect(weeksOrMonths.value).toBe("");
    expect([...weeksOrMonths.options].map((o) => o.value)).toEqual(["", "weeks", "months"]);
    fireEvent.change(amount, { target: { value: "500" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Number" }), { target: { value: "6" } });
    fireEvent.change(weeksOrMonths, { target: { value: "months" } });
    expect(document.querySelector("[data-currency-chip]")?.textContent).toBeTruthy();
    next();
    expect(screen.getByText("Goal 3 of 5")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button").find((b) => b.textContent === "Set my own schedule" || /schedule/i.test(b.textContent ?? ""))!);
    next();
    expect(screen.getByText("Goal 4 of 5")).toBeTruthy();
    // The cause carries into the donate goal.
    expect(document.querySelector("[data-carried='l1-cause']")?.textContent).toBe("animals");
    expect(document.querySelector("[data-sentence]")?.textContent).toMatch(/to support animals/);
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
    fireEvent.click(screen.getByRole("button", { name: "Confirm and continue" }));

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

describe("Find the why: four reasons (Cath, 4 Nov; Support a cause removed 8:44pm)", () => {
  const FOUR = ["make-money", "help-others", "learn-new-skills", "be-my-own-boss"];
  const rankIds = () => [...document.querySelectorAll("[data-rank-item]")].map((el) => el.getAttribute("data-rank-item"));
  async function openWhyRank() {
    const silver = PAYLOAD.floors[0]!.silvers[0]!;
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(silver.title) }));
    // The why door opens once the offer is picked.
    fireEvent.click(door(silver.bronzes[0]!.title));
    while (!screen.queryByRole("button", { name: "Dog walking" })) fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
    fireEvent.click(screen.getByRole("button", { name: "Dog walking" }));
    fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
    fireEvent.click(door(silver.bronzes[1]!.title));
    while (!document.querySelector("[data-rank-item]")) fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
  }

  it("ranks exactly the four reasons", async () => {
    renderFlow({ kind: "level", level: 1 });
    await openWhyRank();
    expect(rankIds()).toEqual(FOUR);
    expect(document.body.textContent).not.toMatch(/support a cause/i);
    expect(document.body.textContent).not.toMatch(/\bprove/i);
  });

  it("an old saved ranking with the retired reasons (Prove I can do it, Support a cause) does not crash; the ids are dropped", async () => {
    const old = ["prove-i-can-do-it", "support-a-cause", "make-money", "help-others", "learn-new-skills", "be-my-own-boss"];
    localStorage.setItem(
      "lp-venture-test:v1:dog-walking",
      JSON.stringify({ completedTaskIds: [], answers: { "l1-why": { kind: "ranking", version: 1, order: old, notApplicable: ["prove-i-can-do-it"] } } }),
    );
    renderFlow({ kind: "level", level: 1 });
    await openWhyRank();
    expect(rankIds()).toEqual(old.slice(2));
    expect(document.querySelectorAll("[data-rank-item][data-struck]")).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/\bprove/i);
  });
});

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
    // One screen; shortcut sample answers fill the captures, so Finish is on.
    next();
    expect(document.querySelector("[data-wrap-up='workbook-summary']")).toBeTruthy();
    expect(document.querySelector("[data-summary-section='who-might-want-it']")?.textContent).not.toMatch(/Not answered yet/);
    fireEvent.click(screen.getByRole("button", { name: "Confirm and continue" }));
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 2/);
  });

  it("identity: the wrap-up stays, and Confirm and continue opens the vision/products handbook page", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /Confirm and continue/ }));
    expect(document.querySelector("[data-silver-complete='l2-s2']")).toBeTruthy();
    expect(document.querySelector("[data-handbook-page='l2-s2']")).toBeTruthy();
    expect(screen.getAllByText("Happy Paws").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 2/);
    // Re-opening the finished identity wrap-up and finalizing again does not show the page.
    fireEvent.click(screen.getByRole("button", { name: /Build your identity/ }));
    fireEvent.click(screen.getByRole("button", { name: /See your logo/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm and continue/ }));
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 2/);
  });
});

/** Fills every empty blank on the current goal page (numbers 5, text "TEST", the first unit). */
function fillGoalBlanks() {
  for (const el of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-sentence] input, [data-sentence] textarea, [data-extra-fields] input")) {
    if (!el.value) fireEvent.change(el, { target: { value: el.inputMode === "numeric" ? "5" : "TEST" } });
  }
  for (const el of document.querySelectorAll<HTMLSelectElement>("[data-sentence] select, [data-extra-fields] select")) {
    if (!el.value) fireEvent.change(el, { target: { value: el.options[1]!.value } });
  }
}

describe("Come back to this later", () => {
  const silver = PAYLOAD.floors[0]!.silvers[0]!;
  const goals = silver.bronzes[3]!;
  const seedFirstThree = () => {
    saveVentureTestProgress("dog-walking", { completedTaskIds: silver.bronzes.slice(0, 3).map((b) => b.tasks[0]!.id) });
    markVentureTestOnboardingSeen("dog-walking");
  };
  const renderPlain = () =>
    render(<VentureFlow initialVentureId="dog-walking" ventureTitles={{ "dog-walking": "Dog walking" }} ventures={VENTURES} reset={false} />);
  const toDoors = async () => {
    fireEvent.click(await screen.findByRole("button", { name: "Go to Level 1" }));
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(silver.title) })[0]!);
  };

  it("defers with a draft, marks the door, blocks the wrap-up, then Finish this restores the draft and completes", async () => {
    seedFirstThree();
    renderPlain();
    await toDoors();
    fireEvent.click(door(goals.title));
    // Only on eligible steps: the button sits under the primary button. Step 1 is the first goal.
    expect(screen.getByText(/^Goal 1 of/)).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Come back to this later" }));

    // Back on the doors: the Set your goals door says Come back; the wrap-up is reachable.
    const marker = document.querySelector("[data-come-back-marker]");
    expect(marker?.textContent).toBe("Come back");
    const saved = JSON.parse(localStorage.getItem("lp-venture-test:v1:dog-walking")!);
    // Page 0 (the first goal) is stored as no draftPage.
    expect(saved.tasks[goals.tasks[0]!.id]).toMatchObject({ status: "open" });
    expect(saved.tasks[goals.tasks[0]!.id].draftPage).toBeUndefined();
    expect(Object.keys(saved.tasks[goals.tasks[0]!.id].draft)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: silver.wrapUp!.type === "workbook-summary" ? silver.wrapUp!.heading : /logo/ }));

    // Wrap-up blocked: the open step is listed and Confirm and continue is off, with why.
    const confirm = screen.getByRole("button", { name: "Confirm and continue" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(document.querySelector("[data-open-steps-hint]")?.textContent).toMatch(/Finish the step above/);
    expect(document.querySelector(`[data-open-step='${goals.tasks[0]!.id}']`)?.textContent).toContain(goals.title);
    fireEvent.click(screen.getByRole("button", { name: "Finish this" }));

    // Back on the page left, the draft restored.
    expect(screen.getByText(/^Goal 1 of/)).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Amount" }) as HTMLInputElement).value).toMatch(/500/);
    for (let i = 0; i < 10 && !document.querySelector("[data-wrap-up]"); i++) {
      fillGoalBlanks();
      const forward = screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement;
      const group = screen.queryAllByRole("group")[0];
      if (forward.disabled && group) fireEvent.click(within(group).getAllByRole("button")[0]!);
      next();
    }
    expect(document.querySelector("[data-wrap-up='workbook-summary']")).toBeTruthy();
    expect(document.querySelector("[data-open-steps]")).toBeNull();
    expect((screen.getByRole("button", { name: "Confirm and continue" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("steps without the flag have no Come back to this later button", async () => {
    saveVentureTestProgress("dog-walking", { completedTaskIds: [] });
    markVentureTestOnboardingSeen("dog-walking");
    renderPlain();
    await toDoors();
    fireEvent.click(door(silver.bronzes[0]!.title));
    expect(screen.queryByRole("button", { name: "Come back to this later" })).toBeNull();
  });

  it("the corridor marker and the home tile's Go open the open task", async () => {
    saveVentureTestProgress("dog-walking", {
      completedTaskIds: silver.bronzes.slice(0, 3).map((b) => b.tasks[0]!.id),
      tasks: { [goals.tasks[0]!.id]: { status: "open", openedAt: "2026-11-04T10:00:00.000Z" } },
    });
    markVentureTestOnboardingSeen("dog-walking");
    render(<VentureFlow initialVentureId={null} ventureTitles={{ "dog-walking": "Dog walking" }} ventures={VENTURES} reset={false} />);
    fireEvent.click(await screen.findByRole("button", { name: "1 open" }));
    fireEvent.click(screen.getByRole("button", { name: `Go: ${goals.title}` }));
    expect(screen.getByText(/^Goal 1 of/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Level 1 corridor/ }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Come back: finish a step in ${silver.title}`) }));
    expect(screen.getByText(/^Goal 1 of/)).toBeTruthy();
  });
});
