// @vitest-environment jsdom
import { neutralTitle } from "@/lib/launchpad/venture-test/handbook";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";
import type { VentureTestShortcut } from "@/lib/launchpad/venture-test/venture-test-progress";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";
import { markVentureTestOnboardingSeen, saveVentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-storage";

const PAYLOAD = launchpadTestVentureSeed("dog-walking");
const VENTURES: Record<string, LaunchpadVentureView> = {
  "dog-walking": { ok: true, payload: PAYLOAD, versionId: "seed", contentHash: "seed", source: "seed" },
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
    // Goals done unlocks The Brand (AC12/13: logo then name; the name door opens once the logo is done).
    renderFlow({ kind: "through-silver", silverId: "l1-s2" });
    fireEvent.click(await screen.findByRole("button", { name: /The Brand/ }));
    fireEvent.click(door("Design your logo"));
    for (const label of ["Circle", "Light blue", "Paw"]) fireEvent.click(screen.getByRole("radio", { name: label }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
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

  it("an L1 door opens one screen: the question, then context, then guidance, then the options; Finish waits for a pick", async () => {
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
    const prompt = screen.getByText(capture.prompt);
    const context = screen.getByText(capture.context!);
    const guidance = screen.getByText(capture.guidance!);
    const options = screen.getByRole("group");
    const follows = (earlier: Node, later: Node) => (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    expect(follows(prompt, context)).toBe(true);
    expect(follows(context, guidance)).toBe(true);
    expect(follows(guidance, options)).toBe(true);
    expect(page.querySelector("[data-screen-intro]")).toBeNull();
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

  it("a delivery door opens its screen directly, with no task list", async () => {
    renderFlow({ kind: "level", level: 5 });
    const silver = PAYLOAD.floors[4]!.silvers[0]!;
    const bronze = silver.bronzes[0]!;
    expect(bronze.placeholder).toBe(false);
    expect(bronze.tasks).toHaveLength(1);
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
    fireEvent.click(door(bronze.title));
    expect(screen.queryByText(/Task \d+ of/)).toBeNull();
    expect(document.querySelector("[data-task-screen='delivery']")).toBeTruthy();
  });
});

const next = () => fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish|Add this goal)/ }));

describe("payload edits of shared hints", () => {
  it("shows a payload edit of the choice hint", async () => {
    const payload = structuredClone(PAYLOAD);
    const surface = payload.surface;
    if (!surface) throw new Error("surface missing");
    payload.surface = { ...surface, chrome: { ...surface.chrome, pickAtLeastOne: "Choose at least one." } } as unknown as typeof surface;
    render(
      <VentureFlow
        initialVentureId="dog-walking"
        ventureTitles={{ "dog-walking": "Dog walking" }}
        ventures={{ "dog-walking": { ok: true, payload, versionId: "seed", contentHash: "seed", source: "seed" } }}
        reset={false}
        shortcut={{ kind: "level", level: 1 }}
      />,
    );
    const silver = payload.floors[0]!.silvers[0]!;
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
    fireEvent.click(door(silver.bronzes[0]!.title));
    expect(screen.getByText("Choose at least one.")).toBeTruthy();
    expect(screen.queryByText("Pick at least one to keep going.")).toBeNull();
  });
});

describe("Level 1 from the load: capture, goal loop, after-step message, level done", () => {
  it("walks L1: keyboard rank, goals with presets, the after-step message, logo before name, then Congratulations", async () => {
    renderFlow({ kind: "level", level: 1 });
    const silver = PAYLOAD.floors[0]!.silvers[0]!;
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
    // Offer: one screen.
    fireEvent.click(door(silver.bronzes[0]!.title));
    fireEvent.click(screen.getByRole("button", { name: "Dog walking" }));
    fireEvent.click(screen.getByRole("button", { name: "Dog training" }));
    next();
    // Why (AC3): no arrows; the keyboard fallback reorders, and below the line takes a reason out of the goal loop.
    fireEvent.click(door(silver.bronzes[1]!.title));
    expect(screen.queryByRole("button", { name: /^Move / })).toBeNull();
    const tile = (id: string) => document.querySelector(`[data-rank-item='${id}']`) as HTMLElement;
    fireEvent.keyDown(tile("help-others"), { key: "ArrowUp" });
    fireEvent.keyDown(tile("learn-new-skills"), { key: "ArrowDown" });
    fireEvent.keyDown(tile("learn-new-skills"), { key: "ArrowDown" });
    expect(document.querySelector("[data-rank-item='learn-new-skills'][data-struck]")).toBeTruthy();
    next();
    // Cause, then Define is done: straight back to the corridor, the workbook button pops in.
    fireEvent.click(door(silver.bronzes[2]!.title));
    const finish = screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement;
    expect(finish.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Animals" }));
    next();
    expect(document.querySelector("[data-handbook]")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close workbook" }));
    expect(document.querySelector("[data-wrap-up], [data-silver-done], [data-silver-complete]")).toBeNull();
    expect(document.querySelector("[data-gold-completion], [data-level-done]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 1/);

    // Set your goals (l1-s2): help others first (ranked), then make money, be my own boss, cause, other.
    const goalsSilver = PAYLOAD.floors[0]!.silvers[1]!;
    fireEvent.click(screen.getByRole("button", { name: new RegExp(neutralTitle(goalsSilver.title)) }));
    fireEvent.click(door(goalsSilver.bronzes[0]!.title));
    const loop = goalsSilver.bronzes[0]!.tasks[0]!.screens[0]!;
    if (loop.type !== "goal-loop") throw new Error("expected goal-loop");
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
    expect(screen.getByText("Goal 1 of 5")).toBeTruthy();
    expect(document.querySelector("[data-screen-intro] [data-guidance]")?.textContent).toBe(loop.guidance);
    expect(document.querySelector("[data-sentence]")?.textContent).toMatch(/^I want .*customers to/);
    expect(screen.queryByRole("button", { name: "Not applicable" })).toBeNull();
    expect((screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement).disabled).toBe(true);
    fillGoalBlanks();
    next();
    expect(screen.getByText("Goal 2 of 5")).toBeTruthy();
    expect(screen.getByText(/I want to earn/)).toBeTruthy();
    expect(document.querySelector("[data-screen-intro]")).toBeNull();
    expect((screen.getByRole("button", { name: /^(Next|Finish)/ }) as HTMLButtonElement).disabled).toBe(true);
    const weeksOrMonths = screen.getByRole("combobox", { name: "Weeks or months" }) as HTMLSelectElement;
    // AC5: weeks is the preset.
    expect(weeksOrMonths.value).toBe("weeks");
    expect((screen.getByRole("textbox", { name: "Amount" }) as HTMLInputElement).value).toBe("");
    fillGoalBlanks();
    expect(document.querySelector("[data-currency-chip]")?.textContent).toBeTruthy();
    next();
    expect(screen.getByText("Goal 3 of 5")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button").find((b) => /schedule/i.test(b.textContent ?? ""))!);
    next();
    expect(screen.getByText("Goal 4 of 5")).toBeTruthy();
    expect(document.querySelector("[data-carried='l1-cause']")?.textContent).toBe("animals");
    expect(document.querySelector("[data-sentence]")?.textContent).toMatch(/to support animals/);
    fireEvent.change(screen.getByRole("textbox", { name: "Percent" }), { target: { value: "10" } });
    next();
    expect(screen.getByText("Goal 5 of 5")).toBeTruthy();
    // Final J11: the optional last goal reads Add this goal (off until typed) and has Skip for now.
    const add = screen.getByRole("button", { name: "Add this goal" }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox", { name: "My goal" }), { target: { value: "TEST half typed" } });
    expect((screen.getByRole("button", { name: "Add this goal" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(document.querySelector('[data-handbook-page="l1-s2"]')).toBeTruthy();
    // Skip saved nothing for the extra goal.
    expect(localStorage.getItem("lp-venture-test:v1:dog-walking") ?? "").not.toContain("TEST half typed");
    fireEvent.click(screen.getByRole("button", { name: "Close workbook" }));
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 1/);
    expect(screen.getByRole("button", { name: "Open your workbook" }).getAttribute("data-corridor-workbook")).toBe("");

    // The Brand (l1-s3): logo then name (AC12/13). The level's last step goes straight to the level done.
    fireEvent.click(screen.getByRole("button", { name: /The Brand/ }));
    fireEvent.click(door("Design your logo"));
    for (const label of ["Circle", "Light blue", "Paw"]) fireEvent.click(screen.getByRole("radio", { name: label }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(door("Name your business"));
    fireEvent.change(document.querySelector("[data-task-screen='name-form'] input")!, { target: { value: "Happy Paws" } });
    fireEvent.click(screen.getByRole("radio", { name: "Rounded" }));
    fireEvent.click(screen.getByRole("radio", { name: "Logo color" }));
    fireEvent.click(screen.getByRole("button", { name: /Save to my workbook/ }));
    fireEvent.click(screen.getByRole("button", { name: "Close workbook" }));
    expect(document.querySelector("[data-wrap-up], [data-silver-done], [data-silver-complete]")).toBeNull();
    const done = document.querySelector("[data-level-done='1']") as HTMLElement;
    expect(done.textContent).toBe("Congratulations!You've completed Level 1");
    expect(document.body.textContent).not.toMatch(/\bNGA\b|\bXP\b|Gold unlocked|move on/);
    expect(document.querySelectorAll("[data-plaque-tick]").length).toBe(PAYLOAD.floors[0]!.silvers.length);
    // The floor workbook shortcut stays on a finished level, 14px to the right of the continue pill.
    const book = screen.getByRole("button", { name: "Open your workbook" });
    expect(book.getAttribute("data-corridor-workbook")).toBe("");
    expect(screen.queryByRole("button", { name: "Take the lift up" })).toBeNull();
    const go = screen.getByRole("button", { name: "Go to Level 2" });
    expect(go.className).toContain("bg-nga-secondary");
    expect(go.parentElement).toBe(book.parentElement);
    expect(go.parentElement?.className).toContain("gap-[14px]");
    expect(go.compareDocumentPosition(book) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(go);
    expect(document.querySelector("[data-level-done]")).toBeNull();
  });
});

/** Opens every bronze of `silver` in turn and clicks through all its tasks. */
async function finishSilver(silver: (typeof PAYLOAD.floors)[number]["silvers"][number]) {
  fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
  for (const bronze of silver.bronzes) {
    fireEvent.click(door(bronze.title));
    const delivery = bronze.tasks.some((task) => task.screens.some((item) => item.type === "delivery"));
    if (!delivery) {
      for (let i = 0; i < bronze.tasks.length; i++) fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
      continue;
    }
    for (let page = 0; page < 3; page++) {
      for (const box of screen.queryAllByRole("combobox")) {
        const option = [...box.querySelectorAll("option")].find((item) => (item as HTMLOptionElement).value);
        if (option) fireEvent.change(box, { target: { value: (option as HTMLOptionElement).value } });
      }
      const paid = screen.queryByRole("textbox");
      if (paid) fireEvent.change(paid, { target: { value: "15" } });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
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

describe("floor workbook shortcut", () => {
  it("opens that level's section, previews an empty level read-only, and returns to the same floor", async () => {
    renderFlow({ kind: "level", level: 3 });
    const open = await screen.findByRole("button", { name: "Open your workbook" });
    expect(open.className).toContain("size-14");
    expect(open.className).not.toContain("border-");
    expect(open.querySelector("img")?.getAttribute("src")).toBe("/launchpad/workbook/workbook-icon-512.png");
    expect(open.querySelector("source")?.getAttribute("srcset")).toBe("/launchpad/workbook/workbook-icon-512.webp");
    expect(document.querySelector("[data-corridor-workbook-slot]")).toBeNull();
    expect((open as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(open);
    const page = document.querySelector("[data-handbook-page='l3-s1']");
    expect(page).toBeTruthy();
    expect(page?.getAttribute("data-editable")).toBe("false");
    expect(page?.textContent).toContain("Learn the customer journey");
    fireEvent.click(screen.getByRole("button", { name: /Back to the corridor/ }));
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 3/);
    expect(screen.getByRole("button", { name: "Open your workbook" })).toBeTruthy();
  });

  it("keeps editing on a level that already has workbook content", async () => {
    renderFlow({ kind: "through-silver", silverId: "l1-s1" });
    fireEvent.click(await screen.findByRole("button", { name: "Open your workbook" }));
    for (let i = 0; i < 6 && document.querySelector("[data-handbook-page]")?.getAttribute("data-editable") !== "true"; i++) {
      const nextPage = screen.queryByRole("button", { name: "Next page" });
      if (!nextPage) break;
      fireEvent.click(nextPage);
    }
    expect(document.querySelector("[data-editable='true']")).toBeTruthy();
  });
});

describe("finishing a step goes straight back to the corridor with the workbook button, no end screen", () => {
  it("finishing Do the job lands on the corridor with Open your workbook (illustration, pop-in)", async () => {
    renderFlow({ kind: "level", level: 5 });
    const silver = PAYLOAD.floors[4]!.silvers[0]!;
    await finishSilver(silver);
    expect(document.querySelector("[data-handbook-page]")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close workbook" }));
    expect(document.querySelector("[data-silver-done]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 5/);
    expect(screen.queryByRole("button", { name: "Go to Level 6" })).toBeNull();
    const cue = screen.getByRole("button", { name: "Open your workbook" });
    expect(cue.getAttribute("data-corridor-workbook")).toBe("");
  });

  it("is not shown when re-entering and re-finishing finished work", async () => {
    renderFlow({ kind: "through-silver", silverId: "l1-s1" });
    const silver = PAYLOAD.floors[0]!.silvers[0]!;
    expect(silver.id).toBe("l1-s1");
    const last = silver.bronzes[silver.bronzes.length - 1]!;
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(neutralTitle(silver.title)) }));
    fireEvent.click(door(last.title));
    for (let i = 0; i < last.tasks.length; i++) fireEvent.click(screen.getByRole("button", { name: /^(Next|Finish)/ }));
    expect(document.querySelector("[data-silver-done]")).toBeNull();
    expect(document.querySelector("#lp-corridor-title")?.textContent).toMatch(/^Level 1/);
    expect(screen.getByRole("button", { name: "Open your workbook" }).getAttribute("data-corridor-workbook")).toBe("");
  });

  it("a step with a summary wrap-up in the content skips it: re-finishing from review goes to the corridor", async () => {
    renderFlow({ kind: "through-silver", silverId: "l2-s1" });
    expect(PAYLOAD.floors[1]!.silvers[0]!.wrapUp).toBeUndefined();
    expect(await screen.findByRole("button", { name: /The product and its buyers/ })).toBeTruthy();
    expect(document.querySelector("[data-wrap-up]")).toBeNull();
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
    for (let i = 0; i < 10 && !screen.queryByRole("button", { name: "Open your workbook" }); i++) {
      fillGoalBlanks();
      const forward = screen.getByRole("button", { name: /^(Next|Finish|Add this goal)/ }) as HTMLButtonElement;
      const group = screen.queryAllByRole("group")[0];
      if (forward.disabled && group) fireEvent.click(within(group).getAllByRole("button")[0]!);
      next();
    }
    expect(screen.getByRole("button", { name: "Open your workbook" })).toBeTruthy();
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

  it("returns the Grow closer to the Level 7 lift, then the rooftop button opens the celebration", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    renderFlow({ kind: "level", level: 7 });
    fireEvent.click(await screen.findByRole("button", { name: /Level Up, up next/ }));
    expect(screen.queryByRole("button", { name: "Go to the rooftop" })).toBeNull();
    fireEvent.click(door("Reflect"));
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(door("Improve"));
    for (const name of [
      "Using more than one way to get my name out",
      "Keeping track of every job that comes in",
      "Always showing up on time at each job",
      "Asking every customer for feedback",
    ]) {
      fireEvent.click(screen.getByRole("button", { name }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(door("Grow"));
    fireEvent.click(screen.getByRole("button", { name: "Start a referral program" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByRole("combobox", { name: "I'll start a referral program, offering" }), { target: { value: "free-walk" } });
    fireEvent.change(screen.getByRole("combobox", { name: "starting" }), { target: { value: "this-week" } });
    fireEvent.change(screen.getByRole("textbox", { name: "My experiment works if" }), { target: { value: "2" } });
    fireEvent.change(screen.getByRole("combobox", { name: "I'll check in on how it's going in" }), { target: { value: "one-month" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-handbook]")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close workbook" }));
    expect(screen.getByText("You've completed Level 7")).toBeTruthy();
    const rooftop = screen.getByRole("button", { name: "Go to the rooftop" });
    expect(rooftop.className).toContain("text-[16px]");
    fireEvent.click(rooftop);
    expect(document.querySelector("[data-lift='rooftop']")).toBeTruthy();
    expect(await screen.findByText("You've built your business!", {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText("You've completed all seven levels.")).toBeTruthy();
    expect(screen.getByText("Your dog walking business is ready.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to Launchpad" }));
    expect(document.querySelector("[data-my-business='dog-walking']")).toBeTruthy();
    expect(document.querySelector("[data-in-progress='dog-walking']")).toBeNull();
    expect(screen.getByRole("heading", { name: "My Businesses" })).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();
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
