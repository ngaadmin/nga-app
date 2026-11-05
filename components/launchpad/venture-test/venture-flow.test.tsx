// @vitest-environment jsdom
import { neutralTitle, partLabel } from "@/lib/launchpad/venture-test/handbook";
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

const door = (title: string) => screen.getByRole("button", { name: new RegExp(neutralTitle(title)) });

describe("bronze doors open their tasks directly (no task list)", () => {
  it("the 'Name your business' door lands on the name form; Exit goes back to the doors (D26/D27)", async () => {
    // Goals done unlocks The Brand (name then logo).
    renderFlow({ kind: "through-silver", silverId: "l1-s2" });
    fireEvent.click(await screen.findByRole("button", { name: /The Brand/ }));
    fireEvent.click(door("Name your business"));
    expect(document.querySelector("[data-task-screen='name-form']")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Name your business" })).toBeTruthy();
    expect(screen.queryByText(/tasks done/)).toBeNull();
    expect(screen.queryByText(/Task content TBC/)).toBeNull();
    expect(screen.queryByRole("button", { name: /^(Start|Review tasks)$/ })).toBeNull();
    const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(crumb.textContent).toMatch(/Building · Level 1 corridor · Name your business/);
    fireEvent.click(screen.getByRole("button", { name: /Exit/ }));
    expect(door("Name your business")).toBeTruthy();
    expect(screen.getByText("Design your logo")).toBeTruthy();
  });

  it("an L1 door opens one screen: context, guidance, then the question and options; Finish waits for a pick", async () => {
    renderFlow({ kind: "level", level: 1 });
    const silver = PAYLOAD.floors[0]!.silvers[0]!;
    const bronze = silver.bronzes[0]!;
    const capture = bronze.tasks[0]!.screens[0]!;
    if (capture.type !== "choice-capture") throw new Error("expected the offer capture first");
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
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
    const bronzes = [
      ...PAYLOAD.floors[0]!.silvers[0]!.bronzes,
      ...PAYLOAD.floors[0]!.silvers[1]!.bronzes,
      ...PAYLOAD.floors[1]!.silvers[0]!.bronzes,
    ];
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
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
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
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
    // Offer: one screen.
    fireEvent.click(door(silver.bronzes[0]!.title));
    fireEvent.click(screen.getByRole("button", { name: "Dog walking" }));
    fireEvent.click(screen.getByRole("button", { name: "Training" }));
    next();
    // Why: arrows reorder; moving a reason below the line takes it out of the goal loop.
    fireEvent.click(door(silver.bronzes[1]!.title));
    fireEvent.click(screen.getByRole("button", { name: "Move Help others up" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Learn new skills down" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Learn new skills down" }));
    expect(document.querySelector("[data-rank-item='learn-new-skills'][data-struck]")).toBeTruthy();
    next();
    // Cause. D30: Define has no goals bronze and no wrap-up — silver-done after three bronzes.
    fireEvent.click(door(silver.bronzes[2]!.title));
    const finish = screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement;
    expect(finish.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Animals" }));
    next();
    expect(document.querySelector("[data-silver-complete='l1-s1']")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-gold-completion]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 1/);

    // Set your goals (l1-s2): own silver; Step 1 shows intro + first goal.
    const goalsSilver = PAYLOAD.floors[0]!.silvers[1]!;
    fireEvent.click(screen.getByRole("button", { name: new RegExp(neutralTitle(goalsSilver.title)) }));
    fireEvent.click(door(goalsSilver.bronzes[0]!.title));
    const loop = goalsSilver.bronzes[0]!.tasks[0]!.screens[0]!;
    if (loop.type !== "goal-loop") throw new Error("expected goal-loop");
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
    expect(screen.getByText("Goal 1 of 5")).toBeTruthy();
    expect(document.querySelector("[data-screen-intro] [data-guidance]")?.textContent).toBe(loop.guidance);
    expect(screen.getByText(/I want my customers to/)).toBeTruthy();
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
    expect(document.querySelector("[data-carried='l1-cause']")?.textContent).toBe("animals");
    expect(document.querySelector("[data-sentence]")?.textContent).toMatch(/to support animals/);
    fireEvent.change(screen.getByRole("textbox", { name: "Percent" }), { target: { value: "10" } });
    next();
    expect(screen.getByText("Goal 5 of 5")).toBeTruthy();
    next();
    // D30: goals has no wrap-up → silver-complete, then The Brand.
    expect(document.querySelector("[data-silver-complete='l1-s2']")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 1/);

    // The Brand (l1-s3): name then logo (D26/D27), then identity wrap-up, then level done.
    fireEvent.click(screen.getByRole("button", { name: /The Brand/ }));
    fireEvent.click(door("Name your business"));
    fireEvent.change(document.querySelector("[data-task-screen='name-form'] input")!, { target: { value: "Happy Paws" } });
    fireEvent.click(screen.getByRole("radio", { name: "Rounded" }));
    fireEvent.click(screen.getByRole("radio", { name: "Logo color" }));
    fireEvent.click(screen.getByRole("button", { name: /Save to my workbook/ }));
    fireEvent.click(door("Design your logo"));
    for (const label of ["Circle", "Light blue", "Paw"]) fireEvent.click(screen.getByRole("radio", { name: label }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    const idWrap = document.querySelector("[data-wrap-up='identity']") as HTMLElement;
    expect(idWrap).toBeTruthy();
    expect(idWrap.textContent).toContain("Happy Paws");
    expect(idWrap.textContent).toMatch(/Dog walking|dog walking/);
    expect(document.querySelector("[data-gold-completion]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-silver-complete='l1-s3']")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-gold-completion]")).toBeNull();
    const done = document.querySelector("[data-level-done='1']") as HTMLElement;
    expect(done.textContent).toBe("Congratulations!You've completed Level 1");
    expect(document.body.textContent).not.toMatch(/\bNGA\b|\bXP\b|Gold unlocked|move on/);
    expect(document.querySelectorAll("[data-plaque-tick]").length).toBe(PAYLOAD.floors[0]!.silvers.length);
    expect(screen.queryByRole("button", { name: "Take the lift up" })).toBeNull();
    const go = screen.getByRole("button", { name: "Go to Level 2" });
    expect(go.className).toContain("bg-nga-secondary");
    fireEvent.click(go);
    expect(document.querySelector("[data-level-done]")).toBeNull();
  });
});

/** Opens every bronze of `silver` in turn and clicks through all its tasks. */
async function finishSilver(silver: (typeof PAYLOAD.floors)[number]["silvers"][number]) {
  fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
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
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
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
    expect(screen.getByRole("heading", { name: `${silver.title}: done!` })).toBeTruthy();
    // Placeholder part titles show as "Part N", never the word bronze.
    expect(done?.textContent).not.toMatch(/\b(silver|bronze|gold)\b/i);
    expect([...done!.querySelectorAll("[data-what-you-built] [data-tag-chip]")].map((c) => c.textContent)).toEqual(silver.bronzes.map((b, i) => partLabel(b.title, i)));
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
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
    fireEvent.click(door(last.title));
    for (let i = 0; i < last.tasks.length; i++) fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 3/);
  });

  it("a summary silver re-finalized from review does not show the page again", async () => {
    // Product (l2-s1) has the workbook-summary wrap; through it leaves Pricing current on Level 2.
    renderFlow({ kind: "through-silver", silverId: "l2-s1" });
    fireEvent.click(await screen.findByRole("button", { name: /The product and its buyers/ }));
    const bronzes = PAYLOAD.floors[1]!.silvers[0]!.bronzes;
    const last = bronzes[bronzes.length - 1]!;
    fireEvent.click(door(last.title));
    for (let i = 0; i < 12 && !document.querySelector("[data-wrap-up='workbook-summary']"); i++) {
      const btn = screen.queryByRole("button", { name: /^(Next|Finish|Continue)/ });
      if (!btn) break;
      fireEvent.click(btn);
    }
    expect(document.querySelector("[data-wrap-up='workbook-summary']")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 2/);
  });

  it("identity: the wrap-up stays, and Confirm and continue opens The Brand handbook page", async () => {
    renderFlow({ kind: "through-silver", silverId: "l1-s2" });
    fireEvent.click(await screen.findByRole("button", { name: /The Brand/ }));
    fireEvent.click(door("Name your business"));
    fireEvent.change(document.querySelector("[data-task-screen='name-form'] input")!, { target: { value: "Happy Paws" } });
    fireEvent.click(screen.getByRole("radio", { name: "Rounded" }));
    fireEvent.click(screen.getByRole("radio", { name: "Logo color" }));
    fireEvent.click(screen.getByRole("button", { name: /Save to my workbook/ }));
    fireEvent.click(door("Design your logo"));
    for (const label of ["Circle", "Light blue", "Paw"]) fireEvent.click(screen.getByRole("radio", { name: label }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    expect(document.querySelector("[data-wrap-up='identity']")).toBeTruthy();
    expect(document.querySelector("[data-silver-complete]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-silver-complete='l1-s3']")).toBeTruthy();
    expect(document.querySelector("[data-silver-complete='l1-s3']")?.textContent).toMatch(/The Brand: done!/);
    expect(document.querySelector("[data-silver-complete='l1-s3'] [data-what-you-built]")?.textContent).toBe("Name your businessDesign your logo");
    // Brand finishes Level 1: Continue opens the Level 1 corridor in its level-done state.
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-level-done='1']")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go to Level 2" })).toBeTruthy();
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
  const define = PAYLOAD.floors[0]!.silvers[0]!;
  const goalsSilver = PAYLOAD.floors[0]!.silvers[1]!;
  const goals = goalsSilver.bronzes[0]!;
  const seedDefineDone = () => {
    saveVentureTestProgress("dog-walking", { completedTaskIds: define.bronzes.map((b) => b.tasks[0]!.id) });
    markVentureTestOnboardingSeen("dog-walking");
  };
  const renderPlain = () =>
    render(<VentureFlow initialVentureId="dog-walking" ventureTitles={{ "dog-walking": "Dog walking" }} ventures={VENTURES} reset={false} />);
  const toGoalsDoors = async () => {
    fireEvent.click(await screen.findByRole("button", { name: "Go to Level 1" }));
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(neutralTitle(goalsSilver.title)) })[0]!);
  };

  it("defers with a draft, marks the door, then reopening restores the draft and completes (D30 no wrap)", async () => {
    seedDefineDone();
    renderPlain();
    await toGoalsDoors();
    fireEvent.click(door(goals.title));
    expect(screen.getByText(/^Goal 1 of/)).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Come back to this later" }));

    const marker = document.querySelector("[data-come-back-marker]");
    expect(marker?.textContent).toBe("Come back");
    const saved = JSON.parse(localStorage.getItem("lp-venture-test:v1:dog-walking")!);
    expect(saved.tasks[goals.tasks[0]!.id]).toMatchObject({ status: "open" });
    expect(saved.tasks[goals.tasks[0]!.id].draftPage).toBeUndefined();
    expect(Object.keys(saved.tasks[goals.tasks[0]!.id].draft)).toHaveLength(1);

    // Re-open the goals door: draft restored (Brand stays locked while goals is open).
    fireEvent.click(door(goals.title));
    expect(screen.getByText(/^Goal 1 of/)).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Amount" }) as HTMLInputElement).value).toMatch(/500/);
    for (let i = 0; i < 10 && !document.querySelector("[data-silver-complete='l1-s2']"); i++) {
      fillGoalBlanks();
      const forward = screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement;
      const group = screen.queryAllByRole("group")[0];
      if (forward.disabled && group) fireEvent.click(within(group).getAllByRole("button")[0]!);
      next();
    }
    expect(document.querySelector("[data-silver-complete='l1-s2']")).toBeTruthy();
  });

  it("steps without the flag have no Come back to this later button", async () => {
    saveVentureTestProgress("dog-walking", { completedTaskIds: [] });
    markVentureTestOnboardingSeen("dog-walking");
    renderPlain();
    fireEvent.click(await screen.findByRole("button", { name: "Go to Level 1" }));
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(neutralTitle(define.title)) })[0]!);
    fireEvent.click(door(define.bronzes[0]!.title));
    expect(screen.queryByRole("button", { name: "Come back to this later" })).toBeNull();
  });

  it("the corridor marker and the home tile's Go open the open task", async () => {
    saveVentureTestProgress("dog-walking", {
      completedTaskIds: define.bronzes.map((b) => b.tasks[0]!.id),
      tasks: { [goals.tasks[0]!.id]: { status: "open", openedAt: "2026-11-04T10:00:00.000Z" } },
    });
    markVentureTestOnboardingSeen("dog-walking");
    render(<VentureFlow initialVentureId={null} ventureTitles={{ "dog-walking": "Dog walking" }} ventures={VENTURES} reset={false} />);
    fireEvent.click(await screen.findByRole("button", { name: "1 open" }));
    fireEvent.click(screen.getByRole("button", { name: `Go: ${goals.title}` }));
    expect(screen.getByText(/^Goal 1 of/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Level 1 corridor/ }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Come back: finish a step in ${neutralTitle(goalsSilver.title)}`) }));
    expect(screen.getByText(/^Goal 1 of/)).toBeTruthy();
  });
});
