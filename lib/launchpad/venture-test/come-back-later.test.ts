import { describe, expect, it } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import {
  EMPTY_VENTURE_TEST_PROGRESS,
  advanceAfterTask,
  bronzeHasOpenTask,
  bronzeStates,
  completeTask,
  deferTask,
  draftPageOf,
  isSilverDone,
  isSilverSettled,
  isTaskOpen,
  openTaskCount,
  openTasksInSilver,
  restoreTaskDraft,
  setProgressAnswer,
  silverStates,
  floorState,
  taskStatus,
  type VentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-progress";
import { parseVentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-storage";
import type { LaunchpadAnswer } from "@/lib/launchpad/content/answers";
import { OPEN_TASKS_LABEL } from "@/lib/launchpad/venture-test/come-back-later";

const FLOORS = launchpadTestVentureSeed("dog-walking").floors;
const L1 = FLOORS[0]!;
const L1S1 = L1.silvers[0]!; // Define the business
const L1S2 = L1.silvers[1]!; // Set your goals
const IDS = L1.silvers[2]!; // The Brand
const ID_TASKS = IDS.bronzes.flatMap((b) => b.tasks.map((t) => t.id));
const L2 = FLOORS[1]!;
const L2S1 = L2.silvers[0]!;
const [B1, B2, B3] = L1S1.bronzes as [typeof L1S1.bronzes[0], typeof L1S1.bronzes[0], typeof L1S1.bronzes[0]];
const GOALS = L1S2.bronzes[0]!.tasks[0]!;
const DEMAND = L2S1.bronzes[1]!.tasks[0]!;
const NOW = "2026-11-04T10:00:00.000Z";

const money = (amount: number): LaunchpadAnswer => ({ kind: "fields", version: 1, values: { amount } });
const OFFER: LaunchpadAnswer = { kind: "selection", version: 1, selected: ["dog-walking"] };

function done(...ids: string[]): VentureTestProgress {
  return { completedTaskIds: ids };
}
const firstThree = () => done(B1.tasks[0]!.id, B2.tasks[0]!.id, B3.tasks[0]!.id);

describe("Come back to this later: which tasks allow it", () => {
  it("only the TEST sample steps (Set your goals, Find out if people want it) carry the flag", () => {
    const flagged = FLOORS.flatMap((f) => f.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks)))
      .filter((t) => t.canComeBackLater)
      .map((t) => t.id);
    expect(flagged).toEqual([GOALS.id, DEMAND.id]);
  });
});

describe("deferring a task", () => {
  it("defer, then the next step unlocks with no hard block", () => {
    const p = deferTask(done(), B1.tasks[0]!, { now: NOW });
    expect(isTaskOpen(p, B1.tasks[0]!.id)).toBe(true);
    expect(bronzeStates(p, L1S1)).toEqual(["current", "current", "locked"]);
    expect(taskStatus(p, FLOORS, B1.tasks[0]!.id)).toBe("open");
    expect(taskStatus(p, FLOORS, B2.tasks[0]!.id)).toBe("available");
    expect(taskStatus(p, FLOORS, B3.tasks[0]!.id)).toBe("locked");
    expect(bronzeHasOpenTask(p, B1)).toBe(true);
  });

  it("moves the partial answer into the draft, with the page and openedAt", () => {
    let p = firstThree();
    p = setProgressAnswer(p, "l1-goal-make-money", money(500));
    p = setProgressAnswer(p, "l1-offer", OFFER);
    const deferred = deferTask(p, GOALS, { page: 2, now: NOW });
    expect(deferred.answers?.["l1-goal-make-money"]).toBeUndefined();
    expect(deferred.answers?.["l1-offer"]).toEqual(OFFER);
    expect(deferred.tasks?.[GOALS.id]).toEqual({
      status: "open",
      draft: { "l1-goal-make-money": money(500) },
      draftPage: 2,
      openedAt: NOW,
    });
    expect(draftPageOf(deferred, GOALS.id)).toBe(2);
    // Deferring again keeps the first openedAt.
    expect(deferTask(deferred, GOALS, { now: "2026-11-05T00:00:00.000Z" }).tasks?.[GOALS.id]?.openedAt).toBe(NOW);
  });

  it("restores the draft on reopening; the task stays open until completed", () => {
    const p = setProgressAnswer(firstThree(), "l1-goal-make-money", money(500));
    const restored = restoreTaskDraft(deferTask(p, GOALS, { now: NOW }), GOALS.id);
    expect(restored.answers?.["l1-goal-make-money"]).toEqual(money(500));
    expect(restored.tasks?.[GOALS.id]?.draft).toBeUndefined();
    expect(isTaskOpen(restored, GOALS.id)).toBe(true);
  });

  it("completing an open task marks it done, drops the draft and keeps openedAt", () => {
    const p = completeTask(deferTask(firstThree(), GOALS, { now: NOW }), GOALS.id);
    expect(p.completedTaskIds).toContain(GOALS.id);
    expect(p.tasks?.[GOALS.id]).toEqual({ status: "done", openedAt: NOW });
    expect(isTaskOpen(p, GOALS.id)).toBe(false);
    expect(taskStatus(p, FLOORS, GOALS.id)).toBe("done");
    expect(isSilverDone(p, L1S2)).toBe(true);
    // A done task cannot be deferred.
    expect(deferTask(p, GOALS)).toBe(p);
  });
});

describe("wrap-up and the gold stay blocked while a task is open", () => {
  it("Set your goals is settled but not done while its task is open; The Brand and L2 stay locked", () => {
    const defineDone = firstThree();
    const p = deferTask(defineDone, GOALS, { now: NOW });
    expect(isSilverSettled(p, L1S2)).toBe(true);
    expect(isSilverDone(p, L1S2)).toBe(false);
    expect(openTasksInSilver(p, L1S2, 1)).toEqual([
      { level: 1, silverId: L1S2.id, bronzeId: L1S2.bronzes[0]!.id, taskId: GOALS.id, taskIndex: 0, title: L1S2.bronzes[0]!.title },
    ]);
    expect(floorState(p, FLOORS, 2)).toBe("locked");
    // The Brand (l1-s3) also has to be done before L2 unlocks.
    const withIdentity = { ...p, completedTaskIds: [...p.completedTaskIds, ...ID_TASKS] };
    expect(floorState(withIdentity, FLOORS, 2)).toBe("locked");
    expect(floorState(completeTask(withIdentity, GOALS.id), FLOORS, 2)).not.toBe("locked");
  });

  it("The Brand stays locked while Set your goals is open", () => {
    const p = deferTask(firstThree(), GOALS, { now: NOW });
    expect(silverStates(p, FLOORS, L1)).toEqual(["done", "current", "locked"]);
    expect(silverStates(completeTask(p, GOALS.id), FLOORS, L1)).toEqual(["done", "done", "current"]);
  });

  it("finishing a Define bronze while another stays open goes back to the doors; finishing the last is silver-done (D30 no wrap)", () => {
    // B1 still open → finishing B3 returns to the doors.
    const mid = completeTask(deferTask(done(B2.tasks[0]!.id), B1.tasks[0]!), B3.tasks[0]!.id);
    expect(advanceAfterTask(mid, L1, L1S1, B3, 0)).toEqual({ kind: "bronze-done" });
    // All three Define bronzes done, no wrap-up → silver-done.
    const last = completeTask(mid, B1.tasks[0]!.id);
    expect(advanceAfterTask(last, L1, L1S1, B1, 0)).toEqual({ kind: "silver-done" });
  });
});

describe("home count", () => {
  it("counts open tasks across the business; the wording is one constant", () => {
    expect(openTaskCount(EMPTY_VENTURE_TEST_PROGRESS, FLOORS)).toBe(0);
    const p = deferTask(deferTask(firstThree(), GOALS, { now: NOW }), DEMAND, { now: NOW });
    expect(openTaskCount(p, FLOORS)).toBe(2);
    expect(openTaskCount(completeTask(p, DEMAND.id), FLOORS)).toBe(1);
    expect(OPEN_TASKS_LABEL(2)).toBe("2 open");
  });
});

describe("storage stays backward compatible", () => {
  it("progress saved before the feature parses as before, with no tasks map", () => {
    const old = { completedTaskIds: ["l1-s1-b1-t1"], answers: { "l1-offer": OFFER } };
    const parsed = parseVentureTestProgress(JSON.stringify(old));
    expect(parsed).toEqual(old);
    expect(openTaskCount(parsed, FLOORS)).toBe(0);
    expect(parseVentureTestProgress(JSON.stringify({ completedTaskIds: [] }))).toEqual({ completedTaskIds: [] });
  });

  it("round-trips open tasks and drops bad entries", () => {
    const p = deferTask(setProgressAnswer(firstThree(), "l1-goal-make-money", money(5)), GOALS, {
      page: 3,
      now: NOW,
    });
    expect(parseVentureTestProgress(JSON.stringify(p))).toEqual(p);
    const messy = {
      completedTaskIds: ["a"],
      tasks: { a: { status: "open", draft: { "l1-offer": OFFER } }, b: { status: "weird" }, c: "nope", d: { status: "open", draftPage: -1, openedAt: NOW } },
    };
    expect(parseVentureTestProgress(JSON.stringify(messy)).tasks).toEqual({ a: { status: "done" }, d: { status: "open", openedAt: NOW } });
  });
});
