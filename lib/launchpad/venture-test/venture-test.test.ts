import { afterEach, describe, expect, it, vi } from "vitest";
import { launchpadSeedBase, launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { identityAnswerOf } from "@/lib/launchpad/content/answers";
import {
  EMPTY_VENTURE_TEST_PROGRESS,
  VENTURE_TEST_SHORTCUT_DEFAULT_VENTURE,
  advanceAfterTask,
  allTasksCompleteProgress,
  applyVentureTestShortcut,
  bronzeStates,
  buildingCta,
  completeTask,
  currentLevel,
  bronzeEntryTaskIndex,
  firstOpenTaskIndex,
  floorAccess,
  floorState,
  isBuildingDone,
  lockedDoorsNote,
  setProgressAnswer,
  silverStates,
  type VentureTestProgress,
  ventureTestShortcut,
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
/**
 * Progress mechanics run on the pre-load structure (two silvers on L1, a
 * three-task first bronze) so plaque, door and task stepping stay covered now
 * that the loaded L1 has one silver and one task per bronze.
 */
const BASE_FLOORS = launchpadSeedBase("dog-walking").floors;
const BASE_L1 = BASE_FLOORS[0]!;

function at<T>(list: readonly T[], i: number): T {
  const v = list[i];
  if (v === undefined) throw new Error(`missing index ${i}`);
  return v;
}

function doneThrough(progress: VentureTestProgress, ids: string[]): VentureTestProgress {
  return ids.reduce(completeTask, progress);
}

describe("venture test structure", () => {
  it("has the six floors; the loaded L1 has one silver (tracker 4 Nov), the rest keep the r4 counts", () => {
    expect(FLOORS.map((f) => [f.level, f.name, f.silvers.length])).toEqual([
      [1, "Vision and Goals", 1],
      [2, "Planning", 2],
      [3, "Making", 4],
      [4, "Selling", 3],
      [5, "Growing", 2],
      [6, "Budgeting", 3],
    ]);
    expect(FLOORS.reduce((n, f) => n + f.silvers.length, 0)).toBe(15);
    expect(L1.gold.title).toBe("Know what type of business to start, why it matters to you, and the goals you'll aim for.");
    expect(L1.silvers.map((s) => s.title)).toEqual(["Define the business"]);
    expect(at(L1.silvers, 0).bronzes.map((b) => b.title)).toEqual([
      "Pick what your business will offer",
      "Find the why",
      "Know your impact",
      "Set your goals",
    ]);
    expect(L1.silvers[0]!.wrapUp?.type).toBe("workbook-summary");
  });
});

describe("venture test progress", () => {
  it("starts on level 1 with only the first plaque and door open", () => {
    const p = EMPTY_VENTURE_TEST_PROGRESS;
    expect(currentLevel(p, BASE_FLOORS)).toBe(1);
    expect(floorState(p, BASE_FLOORS, 2)).toBe("locked");
    expect(silverStates(p, BASE_FLOORS, BASE_L1)).toEqual(["current", "locked"]);
    expect(bronzeStates(p, at(BASE_L1.silvers, 0))).toEqual(["current", "locked", "locked"]);
  });

  it("shows a locked plaque's doors all locked", () => {
    const p = EMPTY_VENTURE_TEST_PROGRESS;
    expect(bronzeStates(p, at(BASE_L1.silvers, 1), silverStates(p, BASE_FLOORS, BASE_L1)[1] !== "locked")).toEqual(["locked"]);
  });

  it("goes back to the doors after the last task of a bronze", () => {
    const s = at(BASE_L1.silvers, 0);
    const b = at(s.bronzes, 0);
    const p = doneThrough(EMPTY_VENTURE_TEST_PROGRESS, b.tasks.map((t) => t.id));
    expect(advanceAfterTask(p, BASE_L1, s, b, b.tasks.length - 1)).toEqual({ kind: "bronze-done" });
    expect(bronzeStates(p, s)).toEqual(["done", "current", "locked"]);
  });

  it("keeps the learner in the workbook while tasks are open", () => {
    const s = at(BASE_L1.silvers, 0);
    const b = at(s.bronzes, 0);
    const p = completeTask(EMPTY_VENTURE_TEST_PROGRESS, at(b.tasks, 2).id);
    expect(advanceAfterTask(p, BASE_L1, s, b, 2)).toEqual({ kind: "task", taskIndex: 0 });
  });

  it("unlocks the next plaque, then the next floor", () => {
    const s = at(BASE_L1.silvers, 0);
    const all1 = s.bronzes.flatMap((b) => b.tasks.map((t) => t.id));
    let p = doneThrough(EMPTY_VENTURE_TEST_PROGRESS, all1);
    const lastB = at(s.bronzes, s.bronzes.length - 1);
    expect(advanceAfterTask(p, BASE_L1, s, lastB, lastB.tasks.length - 1)).toEqual({ kind: "silver-done" });
    expect(silverStates(p, BASE_FLOORS, BASE_L1)).toEqual(["done", "current"]);
    expect(bronzeStates(p, at(BASE_L1.silvers, 1), true)).toEqual(["current"]);
    p = doneThrough(p, BASE_L1.silvers.flatMap((x) => x.bronzes.flatMap((b) => b.tasks.map((t) => t.id))));
    const s3 = at(BASE_L1.silvers, 1);
    const b3 = at(s3.bronzes, s3.bronzes.length - 1);
    expect(advanceAfterTask(p, BASE_L1, s3, b3, b3.tasks.length - 1)).toEqual({ kind: "floor-done" });
    expect(floorState(p, BASE_FLOORS, 1)).toBe("done");
    expect(currentLevel(p, BASE_FLOORS)).toBe(2);
    expect(floorState(p, BASE_FLOORS, 2)).toBe("current");
  });

  it("walks all six levels and ends on the top floor", () => {
    let p = EMPTY_VENTURE_TEST_PROGRESS;
    for (const floor of BASE_FLOORS) {
      expect(currentLevel(p, BASE_FLOORS)).toBe(floor.level);
      expect(floorState(p, BASE_FLOORS, floor.level)).toBe("current");
      p = doneThrough(p, floor.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.map((t) => t.id))));
      expect(floorState(p, BASE_FLOORS, floor.level)).toBe("done");
    }
    expect(currentLevel(p, BASE_FLOORS)).toBe(6);
  });
});

function allTaskIds(levels: number[], floors = BASE_FLOORS): string[] {
  return floors.filter((f) => levels.includes(f.level)).flatMap((f) =>
    f.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.map((t) => t.id))),
  );
}

describe("building floor access (tap any floor)", () => {
  it("mid level 1: BASE_L1 enterable, every floor above is preview only", () => {
    const s = at(BASE_L1.silvers, 0);
    const p = doneThrough(EMPTY_VENTURE_TEST_PROGRESS, at(s.bronzes, 0).tasks.map((t) => t.id));
    expect(currentLevel(p, BASE_FLOORS)).toBe(1);
    expect(BASE_FLOORS.map((f) => floorAccess(p, BASE_FLOORS, f.level))).toEqual([
      "enter",
      "preview",
      "preview",
      "preview",
      "preview",
      "preview",
    ]);
    expect(buildingCta(p, BASE_FLOORS)).toEqual({ kind: "level", level: 1, label: "Go to Level 1" });
  });

  it("a preview floor shows every plaque locked and every door read-only", () => {
    const p = EMPTY_VENTURE_TEST_PROGRESS;
    const l4 = at(BASE_FLOORS, 3);
    const states = silverStates(p, BASE_FLOORS, l4);
    expect(states).toEqual(["locked", "locked", "locked"]);
    l4.silvers.forEach((s, i) => {
      expect(bronzeStates(p, s, states[i] !== "locked").every((b) => b === "locked")).toBe(true);
      expect(lockedDoorsNote(p, BASE_FLOORS, l4, i)).toBe("Finish Level 3 to unlock these doors.");
    });
  });

  it("the current floor still unlocks plaques in order", () => {
    const p = EMPTY_VENTURE_TEST_PROGRESS;
    expect(lockedDoorsNote(p, BASE_FLOORS, BASE_L1, 0)).toBeUndefined();
    expect(lockedDoorsNote(p, BASE_FLOORS, BASE_L1, 1)).toBe('Finish "Define the business" to unlock these doors.');
  });

  it("a bronze door opens its first unfinished task directly", () => {
    const b = BASE_L1.silvers[0]!.bronzes[0]!;
    expect(b.tasks.length).toBeGreaterThan(1);
    expect(bronzeEntryTaskIndex(EMPTY_VENTURE_TEST_PROGRESS, b)).toBe(0);
    const p = doneThrough(EMPTY_VENTURE_TEST_PROGRESS, [b.tasks[0]!.id]);
    expect(bronzeEntryTaskIndex(p, b)).toBe(1);
  });

  it("BASE_L1 done, L2 current: BASE_L1 re-enterable for review without changing progress", () => {
    const p = doneThrough(EMPTY_VENTURE_TEST_PROGRESS, allTaskIds([1]));
    const before = [...p.completedTaskIds];
    expect(currentLevel(p, BASE_FLOORS)).toBe(2);
    expect(floorAccess(p, BASE_FLOORS, 1)).toBe("enter");
    expect(floorAccess(p, BASE_FLOORS, 2)).toBe("enter");
    expect(floorAccess(p, BASE_FLOORS, 3)).toBe("preview");
    expect(silverStates(p, BASE_FLOORS, BASE_L1)).toEqual(["done", "done"]);
    for (const s of BASE_L1.silvers) {
      expect(bronzeStates(p, s, true).every((b) => b === "done")).toBe(true);
      expect(lockedDoorsNote(p, BASE_FLOORS, BASE_L1, BASE_L1.silvers.indexOf(s))).toBeUndefined();
      for (const b of s.bronzes) {
        // Reopening a finished bronze starts at its first task; re-finishing tasks is a no-op.
        expect(firstOpenTaskIndex(p, b)).toBe(0);
        // The door opens that task directly (there is no task list).
        expect(bronzeEntryTaskIndex(p, b)).toBe(0);
        const again = doneThrough(p, b.tasks.map((t) => t.id));
        expect(again).toBe(p);
      }
    }
    expect(p.completedTaskIds).toEqual(before);
    expect(buildingCta(p, BASE_FLOORS)).toEqual({ kind: "level", level: 2, label: "Go to Level 2" });
  });

  it("button names the working level, then the rooftop once every floor is done", () => {
    let p = EMPTY_VENTURE_TEST_PROGRESS;
    for (const floor of BASE_FLOORS) {
      expect(buildingCta(p, BASE_FLOORS)).toEqual({ kind: "level", level: floor.level, label: `Go to Level ${floor.level}` });
      expect(isBuildingDone(p, BASE_FLOORS)).toBe(false);
      p = doneThrough(p, allTaskIds([floor.level]));
    }
    expect(isBuildingDone(p, BASE_FLOORS)).toBe(true);
    expect(buildingCta(p, BASE_FLOORS)).toEqual({ kind: "rooftop", label: "Go to the rooftop" });
    expect(BASE_FLOORS.every((f) => floorAccess(p, BASE_FLOORS, f.level) === "enter")).toBe(true);
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

describe("test shortcuts (?rooftop=1, ?complete=all|<silver>, ?level=<n>)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parses the params: rooftop, then complete, then level; anything else is no shortcut", () => {
    expect(ventureTestShortcut({ rooftop: "1" })).toEqual({ kind: "all", land: "rooftop" });
    expect(ventureTestShortcut({ complete: "all" })).toEqual({ kind: "all", land: "building" });
    expect(ventureTestShortcut({ rooftop: "1", complete: "all" })).toEqual({ kind: "all", land: "rooftop" });
    expect(ventureTestShortcut({ complete: "l2-s1" })).toEqual({ kind: "through-silver", silverId: "l2-s1" });
    expect(ventureTestShortcut({ level: "2" })).toEqual({ kind: "level", level: 2 });
    expect(ventureTestShortcut({ complete: "l2-s1", level: "3" })).toEqual({ kind: "through-silver", silverId: "l2-s1" });
    expect(ventureTestShortcut({})).toBeNull();
    expect(ventureTestShortcut({ rooftop: "0", complete: "some" })).toBeNull();
    expect(ventureTestShortcut({ level: "0" })).toBeNull();
    expect(ventureTestShortcut({ level: "two" })).toBeNull();
    expect(VENTURE_TEST_SHORTCUT_DEFAULT_VENTURE).toBe("dog-walking");
  });

  it("?level=2 completes Level 1 only and lands in the Level 2 corridor", () => {
    const applied = applyVentureTestShortcut({ kind: "level", level: 2 }, FLOORS, EMPTY_VENTURE_TEST_PROGRESS)!;
    expect(applied.land).toEqual({ screen: "corridor", level: 2 });
    expect(floorState(applied.progress, FLOORS, 1)).toBe("done");
    expect(floorState(applied.progress, FLOORS, 2)).toBe("current");
    expect(silverStates(applied.progress, FLOORS, at(FLOORS, 1))).toEqual(["current", "locked"]);
    expect(applyVentureTestShortcut({ kind: "level", level: 99 }, FLOORS, EMPTY_VENTURE_TEST_PROGRESS)).toBeNull();
  });

  it("?complete=l2-s1 lands in Level 2 with Build your identity current, keeping saved answers", () => {
    const withAnswer = setProgressAnswer(EMPTY_VENTURE_TEST_PROGRESS, "l2-s2-identity", {
      kind: "business-identity",
      version: 2,
      shape: "circle",
    });
    const applied = applyVentureTestShortcut({ kind: "through-silver", silverId: "l2-s1" }, FLOORS, withAnswer)!;
    expect(applied.land).toEqual({ screen: "corridor", level: 2 });
    expect(silverStates(applied.progress, FLOORS, at(FLOORS, 1))).toEqual(["done", "current"]);
    expect(at(at(FLOORS, 1).silvers, 1).title).toBe("Build your identity");
    expect(identityAnswerOf(applied.progress.answers, "l2-s2-identity")?.shape).toBe("circle");
    expect(applyVentureTestShortcut({ kind: "through-silver", silverId: "l9-s9" }, FLOORS, withAnswer)).toBeNull();
  });

  it("marks every task complete, so the building is done and the button says Go to the rooftop", () => {
    const all = allTasksCompleteProgress(FLOORS);
    const taskCount = FLOORS.flatMap((f) => f.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks))).length;
    expect(all.completedTaskIds).toHaveLength(taskCount);
    expect(new Set(all.completedTaskIds).size).toBe(taskCount);
    expect(isBuildingDone(all, FLOORS)).toBe(true);
    expect(buildingCta(all, FLOORS)).toEqual({ kind: "rooftop", label: "Go to the rooftop" });
    for (const f of FLOORS) expect(floorState(all, FLOORS, f.level)).toBe("done");
  });

  it("survives a save and reload through the localStorage stub", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
    const all = allTasksCompleteProgress(FLOORS);
    saveVentureTestProgress("dog-walking", all);
    const reloaded = parseVentureTestProgress(store.get(ventureTestStorageKey("dog-walking")) ?? null);
    expect(isBuildingDone(reloaded, FLOORS)).toBe(true);
  });
});

describe("Planning (L2) silvers", () => {
  const L2 = at(FLOORS, 1);

  it("stays at two silvers, Know the product and its buyers then Build your identity", () => {
    expect(L2.silvers.map((s) => [s.id, s.title, s.placeholder])).toEqual([
      ["l2-s1", "Know the product and its buyers", false],
      ["l2-s2", "Build your identity", false],
    ]);
  });

  it("unlocks in order: silver 2 stays locked until silver 1 is done", () => {
    const l1Done = applyVentureTestShortcut({ kind: "level", level: 2 }, FLOORS, EMPTY_VENTURE_TEST_PROGRESS)!.progress;
    expect(silverStates(l1Done, FLOORS, L2)).toEqual(["current", "locked"]);
    const s1Done = doneThrough(
      l1Done,
      at(L2.silvers, 0).bronzes.flatMap((b) => b.tasks.map((t) => t.id)),
    );
    expect(silverStates(s1Done, FLOORS, L2)).toEqual(["done", "current"]);
    expect(bronzeStates(s1Done, at(L2.silvers, 1), true)).toEqual(["current", "locked"]);
  });
});

describe("saved answers live with progress", () => {
  const answer = { kind: "business-identity" as const, version: 2 as const, shape: "circle" as const, color: "#3FB7DA" };

  it("completeTask keeps answers", () => {
    const p = setProgressAnswer(EMPTY_VENTURE_TEST_PROGRESS, "l2-s2-identity", answer);
    expect(completeTask(p, "l1-s1-b1-t1").answers).toEqual({ "l2-s2-identity": answer });
  });

  it("round-trips through the storage parser and drops bad fields", () => {
    const raw = JSON.stringify({
      completedTaskIds: ["a"],
      answers: { "l2-s2-identity": { ...answer, color: "teal", icon: "rocket" }, "Bad Key": answer },
    });
    expect(parseVentureTestProgress(raw)).toEqual({
      completedTaskIds: ["a"],
      answers: { "l2-s2-identity": { kind: "business-identity", version: 2, shape: "circle" } },
    });
    expect(parseVentureTestProgress(JSON.stringify({ completedTaskIds: ["a"] }))).toEqual({ completedTaskIds: ["a"] });
  });

  it("migrates a saved version 1 identity answer to version 2 without crashing", () => {
    const v1 = {
      kind: "business-identity",
      version: 1,
      shape: "rounded-square",
      color: "#0A8FA8",
      icon: "leash",
      name: "Happy Paws",
      font: "fredoka-semibold",
      nameColor: "ink",
      finalized: true,
    };
    expect(parseVentureTestProgress(JSON.stringify({ completedTaskIds: [], answers: { "l2-s2-identity": v1 } }))).toEqual({
      completedTaskIds: [],
      answers: {
        "l2-s2-identity": {
          kind: "business-identity",
          version: 2,
          shape: "shield",
          color: "#3FB7DA",
          icon: "dog-face",
          name: "Happy Paws",
          font: "fredoka-semibold",
          nameColor: "ink",
          finalized: true,
        },
      },
    });
    // Unknown old values fall back to "not picked" instead of crashing.
    const odd = { kind: "business-identity", version: 1, shape: "star", color: "#123456", icon: "rocket" };
    expect(parseVentureTestProgress(JSON.stringify({ completedTaskIds: [], answers: { "l2-s2-identity": odd } }))).toEqual({
      completedTaskIds: [],
      answers: { "l2-s2-identity": { kind: "business-identity", version: 2 } },
    });
  });
});
