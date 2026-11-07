// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IDENTITY_ANSWER_KEY, launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { BusinessIdentityAnswer } from "@/lib/launchpad/content/identity";
import { fieldsAnswer, identityAnswerOf, selectionAnswer, selectionOf } from "@/lib/launchpad/content/answers";
import {
  handbookBusinessName,
  handbookGhost,
  handbookOpenIndex,
  handbookPages,
  handbookTabs,
  handbookTabTarget,
  hasHandbook,
  isHandbookPageEditable,
  withShortcutSampleAnswers,
} from "@/lib/launchpad/venture-test/handbook";
import {
  EMPTY_VENTURE_TEST_PROGRESS,
  applyVentureTestShortcut,
  setProgressAnswer,
  type VentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-progress";
import { Handbook } from "@/components/launchpad/venture/handbook/handbook";
import { LaunchpadHome, type InProgressVenture } from "@/components/launchpad/venture-test/launchpad-home";

afterEach(cleanup);

const FLOORS = launchpadTestVentureSeed("dog-walking").floors;
const SILVERS = FLOORS.flatMap((f) => f.silvers);

function through(silverId: string, base: VentureTestProgress = EMPTY_VENTURE_TEST_PROGRESS): VentureTestProgress {
  return applyVentureTestShortcut({ kind: "through-silver", silverId }, FLOORS, base)!.progress;
}
const ALL = applyVentureTestShortcut({ kind: "all", land: "building" }, FLOORS, EMPTY_VENTURE_TEST_PROGRESS)!.progress;

const IDENTITY: BusinessIdentityAnswer = {
  kind: "business-identity",
  version: 2,
  shape: "shield",
  color: "#1D3F9A",
  icon: "paw",
  name: "Happy Paws",
  font: "fredoka-semibold",
  nameColor: "logo",
};
// D26/D27: The Brand is Level 1's third section (l1-s3).
const WITH_IDENTITY = setProgressAnswer(through("l1-s3"), IDENTITY_ANSWER_KEY, IDENTITY);
/** Identity plus the L1 offer and the L2 answers the handbook sections read. */
const WITH_ANSWERS = [
  ["l1-offer", selectionAnswer(["dog-walking", "training"])],
  ["l2-sell", fieldsAnswer({ serviceDescription: "Short walks for small dogs", availability: "Weekday afternoons" })],
  ["l2-demand", fieldsAnswer({ numberAsked: 5, yesNo: "yes", specificInterest: "puppy walks" })],
] as const;
const FULL = WITH_ANSWERS.reduce<VentureTestProgress>((p, [k, a]) => setProgressAnswer(p, k, a), WITH_IDENTITY);
/** The same answers with Level 2 done too (its page is then the latest). */
const FULL_L2 = WITH_ANSWERS.reduce<VentureTestProgress>(
  (p, [k, a]) => setProgressAnswer(p, k, a),
  setProgressAnswer(through("l2-s1"), IDENTITY_ANSWER_KEY, IDENTITY),
);

describe("handbook pages", () => {
  it("has no pages (and no book button) until the first silver is done", () => {
    const firstTask = SILVERS[0]!.bronzes[0]!.tasks[0]!.id;
    const started = { ...EMPTY_VENTURE_TEST_PROGRESS, completedTaskIds: [firstTask] };
    expect(handbookPages(started, FLOORS)).toEqual([]);
    expect(hasHandbook(EMPTY_VENTURE_TEST_PROGRESS, FLOORS)).toBe(false);
    expect(hasHandbook(started, FLOORS)).toBe(false);
    expect(hasHandbook(through("l1-s1"), FLOORS)).toBe(true);
  });

  it("makes the cover, then one page per completed silver in building order, with no separate identity page", () => {
    const pages = handbookPages(through("l2-s1"), FLOORS);
    // Page 1 is the cover (logo, name, vision), then Define, Goals, then Level 2 (Cath, 5 Nov 5:35pm):
    // The Brand (l1-s3) has no page of its own; its answer feeds the cover only.
    expect(pages.map((p) => p.silver.id)).toEqual(["l1-s3", "l1-s1", "l1-s2", "l2-s1"]);
    expect(pages.map((p) => p.kind)).toEqual(["cover", "summary", "summary", "placeholder"]);
    expect(pages[1]!.bronzeTitles).toEqual(SILVERS[0]!.bronzes.map((b) => b.title));
    expect(pages.map((p) => p.number)).toEqual([1, 2, 3, 4]);
    expect(pages[0]).toMatchObject({ level: 1, kind: "cover" });
    expect(handbookPages(ALL, FLOORS).filter((p) => p.kind === "placeholder" && p.level === 1)).toEqual([]);
    expect(pages[3]).toMatchObject({ level: 2, floorName: FLOORS[1]!.name, silverNumber: 1, done: true });
  });

  it("opens on page 1, and the ghost is the next silver", () => {
    const pages = handbookPages(through("l1-s1"), FLOORS);
    expect(handbookOpenIndex(pages)).toBe(0);
    expect(handbookOpenIndex([])).toBe(0);
    expect(handbookGhost(through("l1-s1"), FLOORS)).toEqual({ level: 1, floorName: FLOORS[0]!.name, silverTitle: "Set your goals" });
    expect(handbookGhost(ALL, FLOORS)).toBeNull();
    const allPages = handbookPages(ALL, FLOORS);
    expect(allPages.some((p) => p.silver.id === "l3-s1")).toBe(false);
    expect(allPages.some((p) => p.sheet === "ready-a")).toBe(true);
  });

  it("is editable only from the building and only for a completed silver", () => {
    expect(isHandbookPageEditable("building", true)).toBe(true);
    expect(isHandbookPageEditable("building", false)).toBe(false);
    expect(isHandbookPageEditable("home", true)).toBe(false);
    expect(isHandbookPageEditable("home", false)).toBe(false);
  });
});

describe("handbook tabs", () => {
  const states = (p: VentureTestProgress) => handbookTabs(p, FLOORS).map((t) => t.state);
  it("marks earned floors navy, the current floor cyan, the rest unearned and untappable", () => {
    expect(states(EMPTY_VENTURE_TEST_PROGRESS)).toEqual(["current", "unearned", "unearned", "unearned", "unearned", "unearned"]);
    // l1-s3 completes Level 1 (Brand); L2 becomes current.
    expect(states(through("l1-s3"))).toEqual(["earned", "current", "unearned", "unearned", "unearned", "unearned"]);
    expect(states(ALL)).toEqual(["earned", "earned", "earned", "earned", "earned", "earned"]);
    const tabs = handbookTabs(through("l1-s3"), FLOORS);
    expect(tabs.map((t) => t.tappable)).toEqual([true, true, false, false, false, false]);
    expect(tabs.map((t) => t.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("jumps to a floor's first page, or the latest page when that floor has none yet", () => {
    const pages = handbookPages(through("l2-s1"), FLOORS);
    // A floor tab opens its first silver page, not the cover.
    expect(handbookTabTarget(pages, 1)).toBe(1);
    expect(handbookTabTarget(pages, 2)).toBe(3);
    const l1Only = handbookPages(through("l1-s1"), FLOORS);
    expect(handbookTabTarget(l1Only, 2)).toBe(1);
  });
});

describe("shortcut sample answers (TEST-ONLY)", () => {
  it("?complete=l1-s3 and ?complete=all give a workbook with a cover and no separate identity page", () => {
    for (const p of [through("l1-s3"), ALL]) {
      const filled = withShortcutSampleAnswers(p, FLOORS, "dog-walking", "Dog walking");
      const pgs = handbookPages(filled, FLOORS);
      expect(pgs[0]!.kind).toBe("cover");
      expect(pgs.filter((pg) => pg.silver.id === "l1-s3")).toHaveLength(1);
      expect(filled.answers?.[IDENTITY_ANSWER_KEY]).toMatchObject({
        version: 2,
        name: "Dog walking",
        shape: "circle",
        color: "#3FB7DA",
        icon: "paw",
        font: "poppins-bold",
        nameColor: "logo",
      });
      expect(handbookBusinessName(filled, FLOORS, "x")).toBe("Dog walking");
    }
  });
  it("never overwrites saved picks, and adds nothing before the identity silver is done", () => {
    expect(withShortcutSampleAnswers(WITH_IDENTITY, FLOORS, "dog-walking", "X").answers?.[IDENTITY_ANSWER_KEY]).toEqual(IDENTITY);
    const beforeIdentity = withShortcutSampleAnswers(through("l1-s1"), FLOORS, "dog-walking", "X");
    expect(identityAnswerOf(beforeIdentity.answers, IDENTITY_ANSWER_KEY)).toBeUndefined();
    const saved = setProgressAnswer(through("l1-s1"), "l1-offer", selectionAnswer(["grooming"]));
    expect(selectionOf(withShortcutSampleAnswers(saved, FLOORS, "dog-walking", "X").answers, "l1-offer")?.selected).toEqual(["grooming"]);
  });

  it("fills sample capture answers for completed silvers only (multi: first two picks; every goal page)", () => {
    const defineOnly = withShortcutSampleAnswers(through("l1-s1"), FLOORS, "dog-walking", "X").answers ?? {};
    expect(selectionOf(defineOnly, "l1-offer")?.selected).toEqual(["dog-walking", "grooming"]);
    expect(defineOnly["l1-why"]).toMatchObject({ kind: "ranking", notApplicable: [] });
    // Goals live on l1-s2 (D30) — not filled until that silver is done.
    expect(defineOnly["l1-goal-make-money"]).toBeUndefined();
    const withGoals = withShortcutSampleAnswers(through("l1-s2"), FLOORS, "dog-walking", "X").answers ?? {};
    expect(withGoals["l1-goal-make-money"]).toMatchObject({ kind: "fields", values: { amount: 500, timeframeNumber: 6 } });
    expect(withGoals["l1-goal-other"]).toBeUndefined();
    expect(withGoals["l2-sell"]).toBeUndefined();
  });
});

function Harness({ entry, initial, onSave }: { entry: "home" | "building"; initial: VentureTestProgress; onSave?: () => void }) {
  const [progress, setProgress] = useState(initial);
  return (
    <Handbook
      entry={entry}
      businessName="Happy Paws"
      floors={FLOORS}
      progress={progress}
      iconVentureId="dog-walking"
      setAnswer={
        entry === "building"
          ? (key, a) => {
              onSave?.();
              setProgress((p) => setProgressAnswer(p, key, a));
            }
          : undefined
      }
      onClose={() => {}}
    />
  );
}

/** The workbook opens on page 1; step forward with Next page until this page shows. */
function turnTo(pageId: string) {
  for (let i = 0; i < 30; i++) {
    if (document.querySelector("[data-handbook-page]")?.getAttribute("data-handbook-page") === pageId) return;
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  }
  throw new Error(`page ${pageId} not reached`);
}
const shownPage = () => document.querySelector("[data-handbook-page]")!.getAttribute("data-handbook-page");
const activeDot = () => Array.from(document.querySelectorAll("[data-page-dots] > span")).findIndex((d) => d.className.includes("w-[18px]"));

const GOAL_SCREENS = FLOORS[0]!.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.flatMap((t) => t.screens)));
const goalField = (key: string, name: string) =>
  GOAL_SCREENS.flatMap((sc) => (sc.type === "goal-loop" ? sc.goals.map((g) => g.screen) : []))
    .flatMap((g) => (g.type === "short-text" && g.answerKey === key ? g.fields : []))
    .find((f) => f.name === name)!;
const GOAL_BENEFIT = goalField("l1-goal-help-others", "benefit").options![0]!.id;
const SKILL_PREFILL = goalField("l1-goal-learn-new-skills", "skill").options![0]!.prefill!;

describe("<Handbook>", () => {
  it("opens on page 1; Next page and a left swipe move forward in order, Previous and a right swipe go back, the dots follow", () => {
    render(<Harness entry="home" initial={FULL} />);
    const order = ["cover", "l1-s1", "l1-s2"];
    expect(shownPage()).toBe("cover");
    expect(screen.getByText("Page 1")).toBeTruthy();
    expect(activeDot()).toBe(0);
    expect((screen.getByRole("button", { name: "Previous page" }) as HTMLButtonElement).disabled).toBe(true);
    for (let i = 1; i < order.length; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next page" }));
      expect(shownPage()).toBe(order[i]);
      expect(activeDot()).toBe(i);
      expect(screen.getByText(`Page ${i + 1}`)).toBeTruthy();
    }
    // jsdom has no PointerEvent; a MouseEvent-based stand-in carries clientX for the swipe.
    if (!("PointerEvent" in window)) (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent = class extends MouseEvent {};
    const card = document.querySelector("[data-paper-card]")!;
    // Swipe right (finger moves right) goes back one page; swipe left goes forward.
    fireEvent.pointerDown(card, { clientX: 300 });
    fireEvent.pointerUp(card, { clientX: 380 });
    expect(shownPage()).toBe("l1-s1");
    expect(activeDot()).toBe(1);
    fireEvent.pointerDown(card, { clientX: 300 });
    fireEvent.pointerUp(card, { clientX: 200 });
    expect(shownPage()).toBe("l1-s2");
    expect(activeDot()).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(shownPage()).toBe("l1-s1");
  });

  it("from home: the cover is read-only, with an 80px logo, a smaller name and the vision once; no Edit, no font line, no Done chip on any page", () => {
    render(<Harness entry="home" initial={FULL} />);
    const dialog = screen.getByRole("dialog", { name: "My workbook" });
    expect(within(dialog).getByRole("heading", { name: "My workbook" })).toBeTruthy();
    expect(dialog.textContent).not.toMatch(/handbook/i);
    expect(within(dialog).getByText("Read only")).toBeTruthy();
    const page = dialog.querySelector("[data-handbook-page]")!;
    expect(page.getAttribute("data-handbook-page")).toBe("cover");
    expect(dialog.querySelectorAll("[data-edit-identity]")).toHaveLength(0);
    expect(within(dialog).getAllByText("Happy Paws").length).toBeGreaterThan(0);
    const mark = within(dialog).getByRole("img", { name: "Logo: shield, paw icon" });
    expect(mark.getAttribute("width")).toBe("80");
    const name = dialog.querySelector<HTMLElement>("[data-cover-name] [data-business-name]")!;
    expect(mark.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // 17px, or the chosen font's readability floor (Fredoka 19px), always under the 80px logo.
    expect(parseFloat(name.style.fontSize)).toBeLessThanOrEqual(19);
    const vision = dialog.querySelector("[data-vision]")!;
    expect(name.compareDocumentPosition(vision) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Our vision" })).toBeTruthy();
    expect(dialog.querySelector("[data-font-label]")).toBeNull();
    expect(dialog.textContent).not.toMatch(/Font:|Your identity/);
    expect(dialog.querySelectorAll("[data-sample]")).toHaveLength(0);
    expect(dialog.querySelectorAll("[data-paper-card]")).toHaveLength(1);
    expect(dialog.querySelectorAll("[data-washi]")).toHaveLength(1);
    expect(dialog.querySelectorAll("[data-paper-card] [data-spiral-binding]")).toHaveLength(1);
    const card = dialog.querySelector("[data-paper-card]")!;
    expect(card.className).toContain("left-[11px]");
    expect(card.className).toContain("right-[11px]");
    expect(card.className).not.toContain("right-[88px]");
    const floors = within(dialog).getByRole("navigation", { name: "Workbook floors" });
    expect(floors.className).toContain("grid-cols-6");
    expect(floors.getAttribute("data-workbook-chrome")).toBe("folder");
    expect(within(dialog).getByRole("button", { name: "Continue" })).toBeTruthy();
    const spiral = dialog.querySelector("[data-spiral-binding]")!;
    expect(spiral.className).toContain("left-1.5");
    expect(spiral.className).not.toContain("-left-");
    const sell = dialog.querySelector("[data-what-we-sell]");
    expect(sell?.querySelector("[data-chosen-value]")).toBeTruthy();
    expect(dialog.textContent).not.toMatch(/coming soon|NGA|XP/i);
    // Every page: no Done chip, and the vision shows only on the cover.
    for (let i = 0; i < 6; i++) {
      expect(dialog.querySelector("[data-done-chip]")).toBeNull();
      expect(dialog.querySelectorAll("[data-vision]").length).toBe(shownPage() === "cover" ? 1 : 0);
      expect(within(dialog).queryByText("Done")).toBeNull();
      const next = screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement;
      if (next.disabled) break;
      fireEvent.click(next);
    }
  });

  it("the cover shows the vision placeholder until Level 1 fills it", () => {
    render(<Harness entry="home" initial={WITH_IDENTITY} />);
    expect(shownPage()).toBe("cover");
    expect(document.querySelector("[data-vision]")!.getAttribute("data-vision-state")).toBe("empty");
    expect(screen.queryByRole("heading", { name: "What we sell" })).toBeNull();
  });

  it("shows the ghost of the next silver, named by its title, behind the last page", () => {
    render(<Harness entry="home" initial={WITH_IDENTITY} />);
    turnTo("l1-s2");
    const ghost = screen.getByRole("img", { name: "Next page, locked: The product and its buyers" });
    expect(ghost.textContent).toBe("Next: The product and its buyers");
    // The words silver, bronze and gold never reach the screen.
    expect(document.body.textContent).not.toMatch(/\b(silver|bronze|gold)\b/i);
  });

  it("tabs: earned and current floors are buttons, unearned ones are disabled; tapping L1 goes to page 1", () => {
    render(<Harness entry="home" initial={WITH_IDENTITY} />);
    const nav = screen.getByRole("navigation", { name: "Workbook floors" });
    expect(within(nav).getByRole("button", { name: "Level 1, Vision and Goals" }).getAttribute("data-tab-state")).toBe("earned");
    expect(within(nav).getByRole("button", { name: /Level 2/ }).getAttribute("data-tab-state")).toBe("current");
    const l3 = within(nav).getByRole("button", { name: /Level 3.*not earned yet/ }) as HTMLButtonElement;
    expect(l3.disabled).toBe(true);
    expect(l3.getAttribute("data-tab-state")).toBe("unearned");
    fireEvent.click(within(nav).getByRole("button", { name: "Level 1, Vision and Goals" }));
    expect(document.querySelector("[data-handbook-page]")!.getAttribute("data-handbook-page")).toBe("l1-s1");
  });

  it("rings the viewed floor's tab in orange whatever its state, and only that tab", () => {
    const ringed = () =>
      Array.from(document.querySelectorAll("nav[aria-label='Workbook floors'] button"))
        .filter((b) => b.className.includes("outline-[#FFA503]"))
        .map((b) => b.getAttribute("aria-label"));
    const tab = (name: RegExp) => within(screen.getByRole("navigation", { name: "Workbook floors" })).getByRole("button", { name });

    // Earned floor (L2) viewed on its page, which keeps its running page number.
    const { unmount } = render(<Harness entry="building" initial={FULL_L2} />);
    turnTo("l2-s1");
    expect(screen.getByText("Page 2")).toBeTruthy();
    expect(ringed()).toEqual(["Level 2, " + FLOORS[1]!.name]);
    const l2 = tab(/^Level 2/);
    // Product done, Pricing still open → floor stays current (D26 L2 has two silvers).
    expect(l2.getAttribute("data-tab-state")).toBe("current");
    expect(l2.hasAttribute("data-viewed")).toBe(true);
    expect(l2.getAttribute("aria-current")).toBe("true");
    expect(l2.className).toMatch(/\boutline-2\b/);
    expect(l2.className).toContain("w-11");
    // Moving to L1 moves the ring.
    fireEvent.click(tab(/^Level 1/));
    expect(ringed()).toEqual(["Level 1, " + FLOORS[0]!.name]);
    expect(tab(/^Level 2/).hasAttribute("data-viewed")).toBe(false);
    unmount();

    // The page being viewed uses the folder tab (white, navy border) and the orange ring.
    render(<Harness entry="building" initial={through("l1-s1")} />);
    const current = tab(/^Level 1/);
    expect(current.getAttribute("data-tab-state")).toBe("current");
    expect(current.className).toContain("bg-white");
    expect(current.className).toContain("border-[#19347D]");
    expect(ringed()).toEqual(["Level 1, " + FLOORS[0]!.name]);
    // Locked tabs are not viewed, so they carry no ring.
    expect(tab(/^Level 2.*not earned yet/).className).not.toContain("outline-[#FFA503]");
  });

  it("summary pages show the sections from saved answers; read-only from home, pencils from the building (AC14: no wrap-ups)", () => {
    render(<Harness entry="home" initial={FULL_L2} />);
    turnTo("l2-s1");
    const home = document.querySelector("[data-handbook-page]") as HTMLElement;
    expect(home.querySelectorAll("[data-edit-identity], [data-edit-section], button")).toHaveLength(0);
    cleanup();
    render(<Harness entry="building" initial={FULL_L2} />);
    turnTo("l2-s1");
    const page = document.querySelector("[data-handbook-page]") as HTMLElement;
    expect(page.getAttribute("data-handbook-page")).toBe("l2-s1");
    expect(within(page).getByRole("heading", { name: FLOORS[1]!.silvers[0]!.title })).toBeTruthy();
    expect(within(page).getByText("Decide what to sell")).toBeTruthy();
    expect(within(page).getByText("Know who your customers are")).toBeTruthy();
  });

  it("summary sections with no answer say so; placeholder floors list finished bronzes", () => {
    // Product summary with no L2 answers → "Not answered yet". Define alone is a placeholder (D30).
    render(<Harness entry="home" initial={through("l2-s1")} />);
    turnTo("l2-s1");
    const page = document.querySelector("[data-handbook-page]") as HTMLElement;
    expect(page.getAttribute("data-handbook-page")).toBe("l2-s1");
    expect(within(page).getByText("Decide what to sell")).toBeTruthy();
    cleanup();
    render(<Harness entry="building" initial={ALL} />);
    fireEvent.click(within(screen.getByRole("navigation", { name: "Workbook floors" })).getByRole("button", { name: /^Level 3/ }));
    const l3 = document.querySelector("[data-handbook-page]") as HTMLElement;
    expect(l3.getAttribute("data-handbook-page")).toBe("ready-a");
    expect(within(l3).getByRole("heading", { name: "Getting Ready" })).toBeTruthy();
    expect(within(l3).queryByText("What I did")).toBeNull();
  });

  it("AA6 to AA8: the goals page edits the skill pick inline, swapping the success line until the learner types", () => {
    const onSave = vi.fn();
    const goals = [
      ["l1-goal-make-money", fieldsAnswer({ amount: 200, currency: "USD", timeframeNumber: 8, timeframeUnit: "weeks", savingFor: "a bike" })],
      ["l1-goal-help-others", fieldsAnswer({ customerCount: 5, benefit: GOAL_BENEFIT, timeframeNumber: 6, timeframeUnit: "months" })],
      ["l1-goal-learn-new-skills", fieldsAnswer({ skill: "talking-to-customers", achievement: SKILL_PREFILL, timeframeNumber: 6, timeframeUnit: "weeks" })],
    ] as const;
    const initial = goals.reduce<VentureTestProgress>((p, [k, a]) => setProgressAnswer(p, k, a), through("l1-s2"));
    render(<Harness entry="building" initial={initial} onSave={onSave} />);
    turnTo("l1-s2");
    const page = document.querySelector("[data-handbook-page]") as HTMLElement;
    expect(page.getAttribute("data-handbook-page")).toBe("l1-s2");
    const pencils = page.querySelectorAll<HTMLButtonElement>("[data-pencil]");
    expect(pencils.length).toBe(1);
    fireEvent.click(pencils[0]!);
    // Only the three goals column AA marks editable offer an Edit pick.
    const picks = Array.from(page.querySelectorAll<HTMLButtonElement>("[data-pencil]")).slice(1);
    expect(picks.map((b) => b.closest("[data-summary-line]")!.getAttribute("data-summary-line"))).toEqual([
      "l1-goal-make-money",
      "l1-goal-help-others",
      "l1-goal-learn-new-skills",
    ]);
    fireEvent.click(picks[2]!);
    const editor = page.querySelector("[data-inline-editor='l1-goal-learn-new-skills']") as HTMLElement;
    const skill = within(editor).getByRole("combobox") as HTMLSelectElement;
    const achievement = editor.querySelector("textarea, input[type='text']") as HTMLInputElement;
    fireEvent.change(skill, { target: { value: "managing-my-money" } });
    expect(achievement.value).toBe("track every dollar coming in and going out of my business");
    fireEvent.change(achievement, { target: { value: "TEST my own words" } });
    fireEvent.change(skill, { target: { value: "solving-problems" } });
    expect(achievement.value).toBe("TEST my own words");
    fireEvent.click(within(editor).getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(page.textContent).toContain("TEST my own words");
    expect(page.querySelector("[data-inline-editor]")).toBeNull();
  });

  it("from the building: the cover has an Edit logo and name button and edits write back to the saved answer", () => {
    const onSave = vi.fn();
    render(<Harness entry="building" initial={WITH_IDENTITY} onSave={onSave} />);
    expect(shownPage()).toBe("cover");
    expect(document.querySelector("[data-handbook-page]")!.getAttribute("data-editable")).toBe("true");
    expect(screen.queryByText("Read only")).toBeNull();
    const edit = screen.getByRole("button", { name: "Edit logo and name" });
    fireEvent.click(edit);
    expect(edit.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: "Color" }));
    fireEvent.click(screen.getByRole("radio", { name: "Orange" }));
    expect(onSave).toHaveBeenCalled();
    expect(screen.getByRole("img", { name: "Logo: shield, paw icon" }).getAttribute("data-logo-color")).toBe("#FFA503");
    fireEvent.click(screen.getByRole("tab", { name: "Name" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Paw Pals" } });
    expect(screen.getAllByText("Paw Pals").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("radio", { name: "Orange" })).toBeNull();
  });
});

describe("<LaunchpadHome> book button", () => {
  const card = (hasHandbook: boolean): InProgressVenture => ({
    ventureId: "dog-walking",
    name: "Dog walking",
    level: 1,
    floorName: "Vision and Goals",
    done: 0,
    total: 2,
    hasHandbook,
  });
  it("is an inactive placeholder until a silver is done, then opens the handbook", () => {
    const open = vi.fn();
    const { rerender } = render(<LaunchpadHome inProgress={[card(false)]} onOpenVenture={() => {}} onOpenHandbook={open} />);
    fireEvent.click(screen.getByRole("button", { name: "Open workbook" }));
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Open workbook" }).getAttribute("aria-disabled")).toBe("true");
    rerender(<LaunchpadHome inProgress={[card(true)]} onOpenVenture={() => {}} onOpenHandbook={open} />);
    fireEvent.click(screen.getByRole("button", { name: "Open workbook" }));
    expect(open).toHaveBeenCalledWith("dog-walking");
  });
});
