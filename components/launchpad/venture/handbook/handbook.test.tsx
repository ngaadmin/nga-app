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
  partLabel,
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
const WITH_IDENTITY = setProgressAnswer(through("l2-s2"), IDENTITY_ANSWER_KEY, IDENTITY);
/** Identity plus the L1 offer and the L2 answers the handbook sections read. */
const WITH_ANSWERS = [
  ["l1-offer", selectionAnswer(["dog-walking", "training"])],
  ["l2-sell", fieldsAnswer({ serviceDescription: "Short walks for small dogs", availability: "Weekday afternoons" })],
  ["l2-demand", fieldsAnswer({ numberAsked: 5, yesNo: "yes", specificInterest: "puppy walks" })],
] as const;
const FULL = WITH_ANSWERS.reduce<VentureTestProgress>((p, [k, a]) => setProgressAnswer(p, k, a), WITH_IDENTITY);

describe("handbook pages", () => {
  it("has no pages (and no book button) until the first silver is done", () => {
    const firstTask = SILVERS[0]!.bronzes[0]!.tasks[0]!.id;
    const started = { ...EMPTY_VENTURE_TEST_PROGRESS, completedTaskIds: [firstTask] };
    expect(handbookPages(started, FLOORS)).toEqual([]);
    expect(hasHandbook(EMPTY_VENTURE_TEST_PROGRESS, FLOORS)).toBe(false);
    expect(hasHandbook(started, FLOORS)).toBe(false);
    expect(hasHandbook(through("l1-s1"), FLOORS)).toBe(true);
  });

  it("makes one page per completed silver in building order, the identity silver rendering the saved answer", () => {
    const pages = handbookPages(through("l2-s2"), FLOORS);
    expect(pages.map((p) => p.silver.id)).toEqual(["l1-s1", "l2-s1", "l2-s2"]);
    expect(pages.map((p) => p.kind)).toEqual(["summary", "summary", "identity"]);
    expect(pages[0]!.bronzeTitles).toEqual(SILVERS[0]!.bronzes.map((b) => b.title));
    expect(pages.map((p) => p.number)).toEqual([1, 2, 3]);
    expect(handbookPages(ALL, FLOORS).filter((p) => p.kind === "placeholder").map((p) => p.level)[0]).toBe(3);
    expect(pages[2]).toMatchObject({ level: 2, floorName: FLOORS[1]!.name, silverNumber: 2, done: true });
  });

  it("opens at the latest page, and the ghost is the next silver", () => {
    const pages = handbookPages(through("l2-s1"), FLOORS);
    expect(handbookOpenIndex(pages)).toBe(1);
    expect(handbookOpenIndex([])).toBe(0);
    expect(handbookGhost(through("l2-s1"), FLOORS)).toEqual({ level: 2, floorName: FLOORS[1]!.name, silverTitle: "Build your identity" });
    expect(handbookGhost(ALL, FLOORS)).toBeNull();
    expect(handbookPages(ALL, FLOORS)).toHaveLength(SILVERS.length);
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
    expect(states(through("l2-s1"))).toEqual(["earned", "current", "unearned", "unearned", "unearned", "unearned"]);
    expect(states(ALL)).toEqual(["earned", "earned", "earned", "earned", "earned", "earned"]);
    const tabs = handbookTabs(through("l2-s1"), FLOORS);
    expect(tabs.map((t) => t.tappable)).toEqual([true, true, false, false, false, false]);
    expect(tabs.map((t) => t.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("jumps to a floor's first page, or the latest page when that floor has none yet", () => {
    const pages = handbookPages(through("l2-s1"), FLOORS);
    expect(handbookTabTarget(pages, 1)).toBe(0);
    expect(handbookTabTarget(pages, 2)).toBe(1);
    const l1Only = handbookPages(through("l1-s1"), FLOORS);
    expect(handbookTabTarget(l1Only, 2)).toBe(0);
  });
});

describe("shortcut sample answers (TEST-ONLY)", () => {
  it("?complete=l2-s2 and ?complete=all give a handbook with a filled identity page", () => {
    for (const p of [through("l2-s2"), ALL]) {
      const filled = withShortcutSampleAnswers(p, FLOORS, "dog-walking", "Dog walking");
      expect(handbookPages(filled, FLOORS).some((pg) => pg.kind === "identity")).toBe(true);
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
    const beforeIdentity = withShortcutSampleAnswers(through("l2-s1"), FLOORS, "dog-walking", "X");
    expect(identityAnswerOf(beforeIdentity.answers, IDENTITY_ANSWER_KEY)).toBeUndefined();
    const saved = setProgressAnswer(through("l1-s1"), "l1-offer", selectionAnswer(["grooming"]));
    expect(selectionOf(withShortcutSampleAnswers(saved, FLOORS, "dog-walking", "X").answers, "l1-offer")?.selected).toEqual(["grooming"]);
  });

  it("fills sample capture answers for completed silvers only (multi: first two picks; every goal page)", () => {
    const filled = withShortcutSampleAnswers(through("l1-s1"), FLOORS, "dog-walking", "X").answers ?? {};
    expect(selectionOf(filled, "l1-offer")?.selected).toEqual(["dog-walking", "grooming"]);
    expect(filled["l1-why"]).toMatchObject({ kind: "ranking", notApplicable: [] });
    expect(filled["l1-goal-make-money"]).toMatchObject({ kind: "fields", values: { amount: 500, timeframeNumber: 6 } });
    expect(filled["l1-goal-other"]).toBeUndefined();
    expect(filled["l2-sell"]).toBeUndefined();
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

describe("<Handbook>", () => {
  it("from home: opens at the latest (identity) page, read-only, with no Edit button", () => {
    render(<Harness entry="home" initial={FULL} />);
    const dialog = screen.getByRole("dialog", { name: "My handbook" });
    expect(within(dialog).getByText("Read only")).toBeTruthy();
    const page = dialog.querySelector("[data-handbook-page]")!;
    expect(page.getAttribute("data-handbook-page")).toBe("l2-s2");
    expect(page.getAttribute("data-editable")).toBe("false");
    expect(dialog.querySelectorAll("[data-edit-identity]")).toHaveLength(0);
    expect(within(dialog).getAllByText("Happy Paws").length).toBeGreaterThan(0);
    expect(within(dialog).getByRole("img", { name: "Logo: shield, paw icon" })).toBeTruthy();
    // The font shows with the label the learner saw on the task screen.
    expect(within(dialog).getByText("Font: Rounded")).toBeTruthy();
    expect(within(dialog).getByText("Vision and products")).toBeTruthy();
    // Real answers: the offer picks as tag chips, the service description as the quote.
    expect(within(dialog).getByRole("heading", { name: "Our vision" })).toBeTruthy();
    expect(within(within(dialog).getByRole("list", { name: "Our vision" })).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Dog walking",
      "Training",
    ]);
    expect(within(dialog).getByRole("heading", { name: "What we sell" })).toBeTruthy();
    expect(within(dialog).getByText("Short walks for small dogs")).toBeTruthy();
    // The sample copy is retired.
    expect(dialog.querySelectorAll("[data-sample]")).toHaveLength(0);
    expect(dialog.textContent).not.toMatch(/Overnight dog stay|relaxed owners/);
    expect(dialog.querySelector("[data-done-chip]")).toBeTruthy();
    expect(dialog.querySelectorAll("[data-paper-card]")).toHaveLength(1);
    expect(dialog.querySelectorAll("[data-washi]")).toHaveLength(1);
    expect(dialog.querySelectorAll("[data-paper-card] [data-spiral-binding]")).toHaveLength(1);
    expect(dialog.querySelectorAll("[data-doodle]")).toHaveLength(1);
    expect(dialog.textContent).not.toMatch(/coming soon|NGA|XP/i);
  });

  it("identity page hides a section with no answer yet", () => {
    render(<Harness entry="home" initial={WITH_IDENTITY} />);
    expect(screen.queryByRole("heading", { name: "Our vision" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "What we sell" })).toBeNull();
  });

  it("shows the ghost of the next silver, named by its title, behind the last page", () => {
    render(<Harness entry="home" initial={WITH_IDENTITY} />);
    const ghost = screen.getByRole("img", { name: "Next page, locked: Know how to make it" });
    expect(ghost.textContent).toBe("Next: Know how to make it");
    // The words silver, bronze and gold never reach the screen.
    expect(document.body.textContent).not.toMatch(/\b(silver|bronze|gold)\b/i);
  });

  it("tabs: earned and current floors are buttons, unearned ones are disabled; tapping L1 goes to page 1", () => {
    render(<Harness entry="home" initial={WITH_IDENTITY} />);
    const nav = screen.getByRole("navigation", { name: "Handbook floors" });
    expect(within(nav).getByRole("button", { name: "Level 1, Vision and Goals" }).getAttribute("data-tab-state")).toBe("earned");
    expect(within(nav).getByRole("button", { name: /Level 2/ }).getAttribute("data-tab-state")).toBe("earned");
    expect(within(nav).getByRole("button", { name: /Level 3/ }).getAttribute("data-tab-state")).toBe("current");
    const l4 = within(nav).getByRole("button", { name: /Level 4.*not earned yet/ }) as HTMLButtonElement;
    expect(l4.disabled).toBe(true);
    expect(l4.getAttribute("data-tab-state")).toBe("unearned");
    fireEvent.click(within(nav).getByRole("button", { name: "Level 1, Vision and Goals" }));
    expect(document.querySelector("[data-handbook-page]")!.getAttribute("data-handbook-page")).toBe("l1-s1");
  });

  it("rings the viewed floor's tab in orange whatever its state, and only that tab", () => {
    const ringed = () =>
      Array.from(document.querySelectorAll("nav[aria-label='Handbook floors'] button"))
        .filter((b) => b.className.includes("outline-[#FFA503]"))
        .map((b) => b.getAttribute("aria-label"));
    const tab = (name: RegExp) => within(screen.getByRole("navigation", { name: "Handbook floors" })).getByRole("button", { name });

    // Earned floor (L2) viewed on the identity page, which keeps its running page number.
    const { unmount } = render(<Harness entry="building" initial={WITH_IDENTITY} />);
    expect(screen.getByText("Page 3")).toBeTruthy();
    expect(ringed()).toEqual(["Level 2, " + FLOORS[1]!.name]);
    const l2 = tab(/^Level 2/);
    expect(l2.getAttribute("data-tab-state")).toBe("earned");
    expect(l2.hasAttribute("data-viewed")).toBe(true);
    expect(l2.getAttribute("aria-current")).toBe("true");
    expect(l2.className).toMatch(/\boutline-2\b/);
    expect(l2.className).toContain("w-11");
    // Moving to L1 moves the ring.
    fireEvent.click(tab(/^Level 1/));
    expect(ringed()).toEqual(["Level 1, " + FLOORS[0]!.name]);
    expect(tab(/^Level 2/).hasAttribute("data-viewed")).toBe(false);
    unmount();

    // Current floor (cyan) viewed keeps its fill and also gets the ring.
    render(<Harness entry="building" initial={through("l2-s1")} />);
    const current = tab(/^Level 2/);
    expect(current.getAttribute("data-tab-state")).toBe("current");
    expect(current.className).toContain("bg-[#3FB7DA]");
    expect(ringed()).toEqual(["Level 2, " + FLOORS[1]!.name]);
    // Locked tabs are not viewed, so they carry no ring.
    expect(tab(/^Level 3.*not earned yet/).className).not.toContain("outline-[#FFA503]");
  });

  it("summary pages show the wrap-up sections from saved answers, with nothing to edit here", () => {
    render(<Harness entry="building" initial={FULL} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    const page = document.querySelector("[data-handbook-page]") as HTMLElement;
    expect(page.getAttribute("data-handbook-page")).toBe("l2-s1");
    expect(page.querySelectorAll("[data-edit-identity], [data-edit-section], button")).toHaveLength(0);
    expect(within(page).getByRole("heading", { name: SILVERS[1]!.title })).toBeTruthy();
    expect(within(page).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["What I am selling", "When", "Who might want it"]);
    expect(page.textContent).toContain("Short walks for small dogs");
    expect(page.textContent).toContain("Weekday afternoons");
    expect(page.textContent).toContain("puppy walks");
  });

  it("summary sections with no answer say so; placeholder floors list finished bronzes", () => {
    render(<Harness entry="home" initial={through("l1-s1")} />);
    const page = document.querySelector("[data-handbook-page]") as HTMLElement;
    expect(page.getAttribute("data-handbook-page")).toBe("l1-s1");
    expect(within(page).getAllByText("Not answered yet").length).toBeGreaterThan(0);
    cleanup();
    render(<Harness entry="building" initial={ALL} />);
    fireEvent.click(within(screen.getByRole("navigation", { name: "Handbook floors" })).getByRole("button", { name: /^Level 3/ }));
    const l3 = document.querySelector("[data-handbook-page]") as HTMLElement;
    const silver = FLOORS[2]!.silvers[0]!;
    expect(within(l3).getByRole("heading", { name: silver.title })).toBeTruthy();
    expect(within(l3).getAllByRole("listitem").map((li) => li.textContent)).toEqual(silver.bronzes.map((b, i) => partLabel(b.title, i)));
  });

  it("from the building: the identity page has an Edit button and edits write back to the saved answer", () => {
    const onSave = vi.fn();
    render(<Harness entry="building" initial={WITH_IDENTITY} onSave={onSave} />);
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
    fireEvent.click(screen.getByRole("button", { name: "Open handbook" }));
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Open handbook" }).getAttribute("aria-disabled")).toBe("true");
    rerender(<LaunchpadHome inProgress={[card(true)]} onOpenVenture={() => {}} onOpenHandbook={open} />);
    fireEvent.click(screen.getByRole("button", { name: "Open handbook" }));
    expect(open).toHaveBeenCalledWith("dog-walking");
  });
});
