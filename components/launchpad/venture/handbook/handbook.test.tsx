// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IDENTITY_ANSWER_KEY, launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { BusinessIdentityAnswer } from "@/lib/launchpad/content/identity";
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
  version: 1,
  shape: "rounded-square",
  color: "#0A8FA8",
  icon: "paw",
  name: "Happy Paws",
  font: "fredoka-semibold",
  nameColor: "logo",
};
const WITH_IDENTITY = setProgressAnswer(through("l2-s2"), IDENTITY_ANSWER_KEY, IDENTITY);

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
    expect(pages.map((p) => p.silver.id)).toEqual(["l1-s1", "l1-s2", "l2-s1", "l2-s2"]);
    expect(pages.map((p) => p.kind)).toEqual(["placeholder", "placeholder", "placeholder", "identity"]);
    expect(pages[0]!.bronzeTitles).toEqual(SILVERS[0]!.bronzes.map((b) => b.title));
    expect(pages.map((p) => p.number)).toEqual([1, 2, 3, 4]);
    expect(pages[3]).toMatchObject({ level: 2, floorName: FLOORS[1]!.name, silverNumber: 2, done: true });
  });

  it("opens at the latest page, and the ghost is the next silver", () => {
    const pages = handbookPages(through("l2-s1"), FLOORS);
    expect(handbookOpenIndex(pages)).toBe(2);
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
    expect(handbookTabTarget(pages, 2)).toBe(2);
    const l1Only = handbookPages(through("l1-s2"), FLOORS);
    expect(handbookTabTarget(l1Only, 2)).toBe(1);
  });
});

describe("shortcut sample answers (TEST-ONLY)", () => {
  it("?complete=l2-s2 and ?complete=all give a handbook with a filled identity page", () => {
    for (const p of [through("l2-s2"), ALL]) {
      const filled = withShortcutSampleAnswers(p, FLOORS, "dog-walking", "Dog walking");
      expect(handbookPages(filled, FLOORS).some((pg) => pg.kind === "identity")).toBe(true);
      expect(filled.answers?.[IDENTITY_ANSWER_KEY]).toMatchObject({ name: "Dog walking", shape: "round", nameColor: "logo" });
      expect(handbookBusinessName(filled, FLOORS, "x")).toBe("Dog walking");
    }
  });
  it("never overwrites saved picks, and adds nothing before the identity silver is done", () => {
    expect(withShortcutSampleAnswers(WITH_IDENTITY, FLOORS, "dog-walking", "X").answers?.[IDENTITY_ANSWER_KEY]).toEqual(IDENTITY);
    expect(withShortcutSampleAnswers(through("l2-s1"), FLOORS, "dog-walking", "X").answers).toBeUndefined();
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
      ventureId="dog-walking"
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
  it("from home: opens at the latest (identity) page, read-only, with no pencils", () => {
    render(<Harness entry="home" initial={WITH_IDENTITY} />);
    const dialog = screen.getByRole("dialog", { name: "My handbook" });
    expect(within(dialog).getByText("Read only")).toBeTruthy();
    const page = dialog.querySelector("[data-handbook-page]")!;
    expect(page.getAttribute("data-handbook-page")).toBe("l2-s2");
    expect(page.getAttribute("data-editable")).toBe("false");
    expect(dialog.querySelectorAll("[data-edit-pencil]")).toHaveLength(0);
    expect(within(dialog).getAllByText("Happy Paws").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("Rounded square sticker")).toBeTruthy();
    expect(within(dialog).getByText("Teal")).toBeTruthy();
    expect(dialog.querySelector("[data-done-stamp]")).toBeTruthy();
    expect(dialog.textContent).not.toMatch(/coming soon|NGA|XP/i);
  });

  it("shows the ghost of the next silver behind the last page", () => {
    render(<Harness entry="home" initial={WITH_IDENTITY} />);
    expect(screen.getByRole("img", { name: /Next page, locked: Silver 1/ })).toBeTruthy();
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

  it("placeholder pages list finished bronzes and have nothing to edit, even from the building", () => {
    render(<Harness entry="building" initial={WITH_IDENTITY} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    const page = document.querySelector("[data-handbook-page]")!;
    expect(page.getAttribute("data-handbook-page")).toBe("l2-s1");
    expect(page.querySelectorAll("[data-edit-pencil]")).toHaveLength(0);
    expect(within(page as HTMLElement).getByRole("heading", { name: "Bronze 1" })).toBeTruthy();
  });

  it("from the building: the identity page has pencils and edits write back to the saved answer", () => {
    const onSave = vi.fn();
    render(<Harness entry="building" initial={WITH_IDENTITY} onSave={onSave} />);
    expect(document.querySelector("[data-handbook-page]")!.getAttribute("data-editable")).toBe("true");
    expect(screen.queryByText("Read only")).toBeNull();
    expect(document.querySelectorAll("[data-edit-pencil]")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Edit color" }));
    fireEvent.click(screen.getByRole("radio", { name: "Green" }));
    expect(onSave).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("radio", { name: "Green" })).toBeNull();
    expect(within(document.querySelector('[data-entry="Color"]') as HTMLElement).getByText("Green")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit business name" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Paw Pals" } });
    expect(within(document.querySelector('[data-entry="Business name"]') as HTMLElement).getAllByText("Paw Pals").length).toBeGreaterThan(0);
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
  it("shows only once the business has a completed silver, and opens the handbook", () => {
    const open = vi.fn();
    const { rerender } = render(<LaunchpadHome inProgress={[card(false)]} onOpenVenture={() => {}} onOpenHandbook={open} />);
    expect(screen.queryByRole("button", { name: "Open handbook" })).toBeNull();
    rerender(<LaunchpadHome inProgress={[card(true)]} onOpenVenture={() => {}} onOpenHandbook={open} />);
    fireEvent.click(screen.getByRole("button", { name: "Open handbook" }));
    expect(open).toHaveBeenCalledWith("dog-walking");
  });
});
