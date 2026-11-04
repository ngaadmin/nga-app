import { afterEach, describe, expect, it, vi } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import {
  EMPTY_VENTURE_TEST_PROGRESS,
  advanceAfterTask,
  bronzeStates,
  buildingCta,
  completeTask,
  currentLevel,
  firstOpenTaskIndex,
  floorAccess,
  floorState,
  isBuildingDone,
  lockedDoorsNote,
  silverStates,
  type VentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-progress";
import {
  clearVentureTestProgress,
  hasSeenVentureTestOnboarding,
  markVentureTestOnboardingSeen,
  parseVentureTestProgress,
  saveVentureTestProgress,
  ventureTestStorageKey,
} from "@/lib/launchpad/venture-test/venture-test-storage";
import { isVentureTestEnabled } from "@/lib/launchpad/venture-test/venture-test-gate";

const FLOORS = launchpadTestVentureSeed("dog-walking").floors;
const L1 = FLOORS[0]!;

function at<T>(list: readonly T[], i: number): T {
  const v = list[i];
  if (v === undefined) throw new Error(`missing index ${i}`);
  return v;
}

function doneThrough(progress: VentureTestProgress, ids: string[]): VentureTestProgress {
  return ids.reduce(completeTask, progress);
}

describe("venture test structure", () => {
  it("has the six r4 floors with the design window counts", () => {
    expect(FLOORS.map((f) => [f.level, f.name, f.silvers.length])).toEqual([
      [1, "Vision and Goals", 2],
      [2, "Planning", 2],
      [3, "Making", 4],
      [4, "Selling", 3],
      [5, "Growing", 2],
      [6, "Budgeting", 3],
    ]);
    expect(FLOORS.reduce((n, f) => n + f.silvers.length, 0)).toBe(16);
    expect(L1.gold.title).toBe("Know what type of business to start, why it matters to you, and the goals you'll aim for.");
    expect(L1.silvers.map((s) => s.title)).toEqual(["Define the business", "Set your goals"]);
    expect(at(L1.silvers, 0).bronzes.map((b) => b.title)).toEqual(["Pick a business type", "Find the why", "Pick a cause"]);
    expect(at(L1.silvers, 1).bronzes.map((b) => b.title)).toEqual(["Set goals"]);
  });
});

describe("venture test progress", () => {
  it("starts on level 1 with only the first plaque and door open", () => {
    const p = EMPTY_VENTURE_TEST_PROGRESS;
    expect(currentLevel(p, FLOORS)).toBe(1);
    expect(floorState(p, FLOORS, 2)).toBe("locked");
    expect(silverStates(p, FLOORS, L1)).toEqual(["current", "locked"]);
    expect(bronzeStates(p, at(L1.silvers, 0))).toEqual(["current", "locked", "locked"]);
  });

  it("shows a locked plaque's doors all locked", () => {
    const p = EMPTY_VENTURE_TEST_PROGRESS;
    expect(bronzeStates(p, at(L1.silvers, 1), silverStates(p, FLOORS, L1)[1] !== "locked")).toEqual(["locked"]);
  });

  it("goes back to the doors after the last task of a bronze", () => {
    const s = at(L1.silvers, 0);
    const b = at(s.bronzes, 0);
    const p = doneThrough(EMPTY_VENTURE_TEST_PROGRESS, b.tasks.map((t) => t.id));
    expect(advanceAfterTask(p, L1, s, b, b.tasks.length - 1)).toEqual({ kind: "bronze-done" });
    expect(bronzeStates(p, s)).toEqual(["done", "current", "locked"]);
  });

  it("keeps the learner in the workbook while tasks are open", () => {
    const s = at(L1.silvers, 0);
    const b = at(s.bronzes, 0);
    const p = completeTask(EMPTY_VENTURE_TEST_PROGRESS, at(b.tasks, 2).id);
    expect(advanceAfterTask(p, L1, s, b, 2)).toEqual({ kind: "task", taskIndex: 0 });
  });

  it("unlocks the next plaque, then the next floor", () => {
    const s = at(L1.silvers, 0);
    const all1 = s.bronzes.flatMap((b) => b.tasks.map((t) => t.id));
    let p = doneThrough(EMPTY_VENTURE_TEST_PROGRESS, all1);
    const lastB = at(s.bronzes, s.bronzes.length - 1);
    expect(advanceAfterTask(p, L1, s, lastB, lastB.tasks.length - 1)).toEqual({ kind: "silver-done" });
    expect(silverStates(p, FLOORS, L1)).toEqual(["done", "current"]);
    expect(bronzeStates(p, at(L1.silvers, 1), true)).toEqual(["current"]);
    p = doneThrough(p, L1.silvers.flatMap((x) => x.bronzes.flatMap((b) => b.tasks.map((t) => t.id))));
    const s3 = at(L1.silvers, 1);
    const b3 = at(s3.bronzes, s3.bronzes.length - 1);
    expect(advanceAfterTask(p, L1, s3, b3, b3.tasks.length - 1)).toEqual({ kind: "floor-done" });
    expect(floorState(p, FLOORS, 1)).toBe("done");
    expect(currentLevel(p, FLOORS)).toBe(2);
    expect(floorState(p, FLOORS, 2)).toBe("current");
  });

  it("walks all six levels and ends on the top floor", () => {
    let p = EMPTY_VENTURE_TEST_PROGRESS;
    for (const floor of FLOORS) {
      expect(currentLevel(p, FLOORS)).toBe(floor.level);
      expect(floorState(p, FLOORS, floor.level)).toBe("current");
      p = doneThrough(p, floor.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.map((t) => t.id))));
      expect(floorState(p, FLOORS, floor.level)).toBe("done");
    }
    expect(currentLevel(p, FLOORS)).toBe(6);
  });
});

function allTaskIds(levels: number[]): string[] {
  return FLOORS.filter((f) => levels.includes(f.level)).flatMap((f) =>
    f.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.map((t) => t.id))),
  );
}

describe("building floor access (tap any floor)", () => {
  it("mid level 1: L1 enterable, every floor above is preview only", () => {
    const s = at(L1.silvers, 0);
    const p = doneThrough(EMPTY_VENTURE_TEST_PROGRESS, at(s.bronzes, 0).tasks.map((t) => t.id));
    expect(currentLevel(p, FLOORS)).toBe(1);
    expect(FLOORS.map((f) => floorAccess(p, FLOORS, f.level))).toEqual([
      "enter",
      "preview",
      "preview",
      "preview",
      "preview",
      "preview",
    ]);
    expect(buildingCta(p, FLOORS)).toEqual({ kind: "level", level: 1, label: "Go to Level 1" });
  });

  it("a preview floor shows every plaque locked and every door read-only", () => {
    const p = EMPTY_VENTURE_TEST_PROGRESS;
    const l4 = at(FLOORS, 3);
    const states = silverStates(p, FLOORS, l4);
    expect(states).toEqual(["locked", "locked", "locked"]);
    l4.silvers.forEach((s, i) => {
      expect(bronzeStates(p, s, states[i] !== "locked").every((b) => b === "locked")).toBe(true);
      expect(lockedDoorsNote(p, FLOORS, l4, i)).toBe("Finish Level 3 to unlock these doors.");
    });
  });

  it("the current floor still unlocks plaques in order", () => {
    const p = EMPTY_VENTURE_TEST_PROGRESS;
    expect(lockedDoorsNote(p, FLOORS, L1, 0)).toBeUndefined();
    expect(lockedDoorsNote(p, FLOORS, L1, 1)).toBe('Finish "Define the business" to unlock these doors.');
  });

  it("L1 done, L2 current: L1 re-enterable for review without changing progress", () => {
    const p = doneThrough(EMPTY_VENTURE_TEST_PROGRESS, allTaskIds([1]));
    const before = [...p.completedTaskIds];
    expect(currentLevel(p, FLOORS)).toBe(2);
    expect(floorAccess(p, FLOORS, 1)).toBe("enter");
    expect(floorAccess(p, FLOORS, 2)).toBe("enter");
    expect(floorAccess(p, FLOORS, 3)).toBe("preview");
    expect(silverStates(p, FLOORS, L1)).toEqual(["done", "done"]);
    for (const s of L1.silvers) {
      expect(bronzeStates(p, s, true).every((b) => b === "done")).toBe(true);
      expect(lockedDoorsNote(p, FLOORS, L1, L1.silvers.indexOf(s))).toBeUndefined();
      for (const b of s.bronzes) {
        // Reopening a finished bronze starts at its first task; re-finishing tasks is a no-op.
        expect(firstOpenTaskIndex(p, b)).toBe(0);
        const again = doneThrough(p, b.tasks.map((t) => t.id));
        expect(again).toBe(p);
      }
    }
    expect(p.completedTaskIds).toEqual(before);
    expect(buildingCta(p, FLOORS)).toEqual({ kind: "level", level: 2, label: "Go to Level 2" });
  });

  it("button names the working level, then the rooftop once every floor is done", () => {
    let p = EMPTY_VENTURE_TEST_PROGRESS;
    for (const floor of FLOORS) {
      expect(buildingCta(p, FLOORS)).toEqual({ kind: "level", level: floor.level, label: `Go to Level ${floor.level}` });
      expect(isBuildingDone(p, FLOORS)).toBe(false);
      p = doneThrough(p, allTaskIds([floor.level]));
    }
    expect(isBuildingDone(p, FLOORS)).toBe(true);
    expect(buildingCta(p, FLOORS)).toEqual({ kind: "rooftop", label: "Go to the rooftop" });
    expect(FLOORS.every((f) => floorAccess(p, FLOORS, f.level) === "enter")).toBe(true);
  });
});

describe("venture test storage stub", () => {
  it("parses only well-formed progress", () => {
    expect(parseVentureTestProgress(null)).toEqual(EMPTY_VENTURE_TEST_PROGRESS);
    expect(parseVentureTestProgress("not json")).toEqual(EMPTY_VENTURE_TEST_PROGRESS);
    expect(parseVentureTestProgress('{"completedTaskIds":[1,"a"]}')).toEqual({ completedTaskIds: ["a"] });
    expect(ventureTestStorageKey("lemonade-stand")).toBe("lp-venture-test:v1:lemonade-stand");
  });
});

describe("venture test onboarding seen flag", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is per venture, and reset clears it with the progress", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
    expect(hasSeenVentureTestOnboarding("lemonade-stand")).toBe(false);
    markVentureTestOnboardingSeen("lemonade-stand");
    saveVentureTestProgress("lemonade-stand", { completedTaskIds: ["a"] });
    expect(hasSeenVentureTestOnboarding("lemonade-stand")).toBe(true);
    expect(hasSeenVentureTestOnboarding("dog-walking")).toBe(false);
    clearVentureTestProgress("lemonade-stand");
    expect(hasSeenVentureTestOnboarding("lemonade-stand")).toBe(false);
    expect(store.size).toBe(0);
  });
});

describe("venture test gate", () => {
  it("is on for preview and dev, off for production", () => {
    expect(isVentureTestEnabled({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(true);
    expect(isVentureTestEnabled({ VERCEL_ENV: "production", NODE_ENV: "production" })).toBe(false);
    expect(isVentureTestEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isVentureTestEnabled({ NODE_ENV: "development" })).toBe(true);
  });
});
