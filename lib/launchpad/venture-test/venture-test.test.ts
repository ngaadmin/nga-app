import { describe, expect, it } from "vitest";
import { VENTURE_TEST_FLOORS, getVentureTestFloor } from "@/lib/launchpad/venture-test/venture-test-structure";
import {
  EMPTY_VENTURE_TEST_PROGRESS,
  advanceAfterTask,
  bronzeStates,
  completeTask,
  currentLevel,
  floorState,
  silverStates,
  type VentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-progress";
import { parseVentureTestProgress, ventureTestStorageKey } from "@/lib/launchpad/venture-test/venture-test-storage";
import { isVentureTestEnabled } from "@/lib/launchpad/venture-test/venture-test-gate";

const L1 = getVentureTestFloor(1);

function at<T>(list: readonly T[], i: number): T {
  const v = list[i];
  if (v === undefined) throw new Error(`missing index ${i}`);
  return v;
}

function doneThrough(progress: VentureTestProgress, ids: string[]): VentureTestProgress {
  return ids.reduce(completeTask, progress);
}

describe("venture test structure", () => {
  it("has five floors with the design window counts", () => {
    expect(VENTURE_TEST_FLOORS.map((f) => f.silvers.length)).toEqual([3, 3, 6, 4, 4]);
    expect(L1.silvers.map((s) => s.title)).toEqual(["Define the business", "Find your why", "Set your goals"]);
  });
});

describe("venture test progress", () => {
  it("starts on level 1 with only the first plaque and door open", () => {
    const p = EMPTY_VENTURE_TEST_PROGRESS;
    expect(currentLevel(p)).toBe(1);
    expect(floorState(p, 2)).toBe("locked");
    expect(silverStates(p, L1)).toEqual(["current", "locked", "locked"]);
    expect(bronzeStates(p, at(L1.silvers, 0))).toEqual(["current", "locked", "locked"]);
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
    expect(silverStates(p, L1)).toEqual(["done", "current", "locked"]);
    p = doneThrough(p, L1.silvers.flatMap((x) => x.bronzes.flatMap((b) => b.tasks.map((t) => t.id))));
    const s3 = at(L1.silvers, 2);
    const b3 = at(s3.bronzes, s3.bronzes.length - 1);
    expect(advanceAfterTask(p, L1, s3, b3, b3.tasks.length - 1)).toEqual({ kind: "floor-done" });
    expect(floorState(p, 1)).toBe("done");
    expect(currentLevel(p)).toBe(2);
    expect(floorState(p, 2)).toBe("current");
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

describe("venture test gate", () => {
  it("is on for preview and dev, off for production", () => {
    expect(isVentureTestEnabled({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(true);
    expect(isVentureTestEnabled({ VERCEL_ENV: "production", NODE_ENV: "production" })).toBe(false);
    expect(isVentureTestEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isVentureTestEnabled({ NODE_ENV: "development" })).toBe(true);
  });
});
