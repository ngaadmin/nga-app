// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { salesWorkbookSheets } from "@/lib/launchpad/content/sales/workbook-sheets";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { launchpadLearnerSaveEnabled } from "@/lib/launchpad/learner-db/flag";
import { mergeLaunchpadLearnerSnapshot, type LaunchpadLearnerSnapshot } from "@/lib/launchpad/learner-db/merge";
import { answerRowsForSave, ventureRowForSave } from "@/lib/launchpad/learner-db/rows";
import {
  flushLaunchpadLearnerSave,
  hydrateLaunchpadLearnerProgress,
  launchpadLearnerMaySave,
  scheduleLaunchpadLearnerSave,
  setLaunchpadLearnerSaveDepsForTests,
  type LaunchpadLearnerGateway,
} from "@/lib/launchpad/learner-db/save";
import { handbookPages } from "@/lib/launchpad/venture-test/handbook";
import { saveVentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-storage";
import type { VentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-progress";

const payload = launchpadTestVentureSeed("dog-walking");
const floors = payload.floors;
const CHILD = { accountRole: "child" as const, accessMode: "registered" as const };
const USER = "child-user-1";

const offer = { kind: "selection" as const, version: 1 as const, selected: ["walks", "grooming"] };
const why = {
  kind: "ranking" as const,
  version: 1 as const,
  order: ["make-money", "help-others", "learn-new-skills", "be-my-own-boss", "extra"],
  notApplicable: [] as string[],
};

function progress(ids: string[], answers: LaunchpadAnswers = {}): VentureTestProgress {
  return { completedTaskIds: ids, ...(Object.keys(answers).length ? { answers } : {}) };
}

function snapshot(value: VentureTestProgress, stamps: Record<string, string> = {}, seen = false): LaunchpadLearnerSnapshot {
  return { progress: value, onboardingSeen: seen, answerUpdatedAt: stamps, taskUpdatedAt: {} };
}

function allTaskIds(): string[] {
  return floors.flatMap((floor) => floor.silvers.flatMap((silver) => silver.bronzes.flatMap((bronze) => bronze.tasks.map((task) => task.id))));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  setLaunchpadLearnerSaveDepsForTests(null);
});

describe("launchpad learner save flag", () => {
  it("stays off unless a flag is explicitly on", () => {
    expect(launchpadLearnerSaveEnabled({})).toBe(false);
    expect(launchpadLearnerSaveEnabled({ LAUNCHPAD_LEARNER_SAVE: "0" })).toBe(false);
    expect(launchpadLearnerSaveEnabled({ NEXT_PUBLIC_LAUNCHPAD_LEARNER_SAVE: "false" })).toBe(false);
    expect(launchpadLearnerSaveEnabled({ VERCEL_ENV: "preview" } as { LAUNCHPAD_LEARNER_SAVE?: string })).toBe(false);
    expect(launchpadLearnerSaveEnabled({ LAUNCHPAD_LEARNER_SAVE: "1" })).toBe(true);
    expect(launchpadLearnerSaveEnabled({ NEXT_PUBLIC_LAUNCHPAD_LEARNER_SAVE: "true" })).toBe(true);
  });

  it("refuses parents, teachers, and guests", () => {
    expect(launchpadLearnerMaySave(CHILD)).toBe(true);
    expect(launchpadLearnerMaySave({ accountRole: "parent_master", accessMode: "registered" })).toBe(false);
    expect(launchpadLearnerMaySave({ accountRole: "teacher", accessMode: "registered" })).toBe(false);
    expect(launchpadLearnerMaySave({ accountRole: "child", accessMode: "guest" })).toBe(false);
    expect(launchpadLearnerMaySave(null)).toBe(false);
  });
});

describe("mergeLaunchpadLearnerSnapshot", () => {
  it("never drops a completed task and keeps the newer answer", () => {
    const local = snapshot(
      progress(["l1-s1-b1-t1", "l2-s1-b1-t1"], { "l1-offer": offer, sales_channels: { kind: "sales-channels", version: 1, selected: ["flyers"], where: { flyers: ["school"] } } }),
      { "l1-offer": "2026-11-17T12:00:00.000Z", sales_channels: "2026-11-17T12:00:00.000Z" },
    );
    const remote = snapshot(
      progress(["l1-s1-b1-t1"], { "l1-offer": { kind: "selection", version: 1, selected: ["walks"] } }),
      { "l1-offer": "2026-11-17T11:00:00.000Z" },
    );
    const merged = mergeLaunchpadLearnerSnapshot(local, remote);
    expect(merged.progress.completedTaskIds).toEqual(["l1-s1-b1-t1", "l2-s1-b1-t1"]);
    expect(merged.progress.answers?.["l1-offer"]).toEqual(offer);
    expect(merged.progress.answers?.sales_channels).toEqual(local.progress.answers?.sales_channels);

    const ahead = mergeLaunchpadLearnerSnapshot(snapshot(progress(["a"])), snapshot(progress(["a", "b"])));
    expect(ahead.progress.completedTaskIds).toEqual(["a", "b"]);
  });
});

describe("workbook playback from the merged answers", () => {
  it("keeps every workbook sheet the browser copy could play", () => {
    const answers: LaunchpadAnswers = {
      "l1-offer": offer,
      "l1-why": why,
      sales_channels: { kind: "sales-channels", version: 1, selected: ["flyers"], where: { flyers: ["school"] } },
      "l2-price": {
        kind: "price",
        version: 1,
        prices: [{ serviceId: "dog-walking", price: 15, costPerJob: 0, keptPerJob: 15 }],
      },
    };
    const local = snapshot(progress(allTaskIds(), answers), { "l1-offer": "2026-11-17T12:00:00.000Z", sales_channels: "2026-11-17T12:00:00.000Z" });
    const remote = snapshot(progress(allTaskIds().slice(0, 1), { "l1-offer": { kind: "selection", version: 1, selected: ["walks"] } }), {
      "l1-offer": "2026-11-16T12:00:00.000Z",
    });
    const merged = mergeLaunchpadLearnerSnapshot(local, remote);
    const sheet = (value: VentureTestProgress) => handbookPages(value, floors).map((page) => page.sheet ?? page.kind);
    expect(sheet(merged.progress)).toEqual(sheet(local.progress));
    const played = JSON.stringify(salesWorkbookSheets(merged.progress.answers, "Happy Paws"));
    expect(played).toContain("Flyers or posters");
    expect(played).toContain("at school (with permission)");
  });
});

describe("launchpad learner save calls", () => {
  function gateway(): LaunchpadLearnerGateway & { venture: ReturnType<typeof vi.fn>; answers: ReturnType<typeof vi.fn> } {
    const venture = vi.fn(async () => ({ id: "row-1", error: null }));
    const answers = vi.fn(async () => ({ error: null }));
    return {
      venture,
      answers,
      userId: async () => USER,
      readVenture: async () => ({ row: null, error: null }),
      readAnswers: async () => ({ rows: [], error: null }),
      upsertVenture: venture,
      upsertAnswers: answers,
    };
  }

  function arm(
    client: LaunchpadLearnerGateway,
    session: { accountRole: "child" | "parent_master" | "teacher"; accessMode: "registered" | "guest" } = CHILD,
  ) {
    setLaunchpadLearnerSaveDepsForTests({
      gateway: async () => client,
      session: () => session,
      now: () => "2026-11-17T12:00:00.000Z",
    });
  }

  it("does not call the client when the flag is off", async () => {
    vi.useFakeTimers();
    const client = gateway();
    arm(client);
    scheduleLaunchpadLearnerSave({
      route: "dashboard",
      ventureId: "dog-walking",
      versionId: null,
      floors,
      progress: progress(["l1-s1-b1-t1"], { "l1-offer": offer }),
      onboardingSeen: true,
    });
    await vi.advanceTimersByTimeAsync(SAVE_WAIT);
    expect(client.venture).not.toHaveBeenCalled();
    expect(client.answers).not.toHaveBeenCalled();
  });

  it("writes this learner's venture row and round-trippable answers when the flag is on", async () => {
    vi.useFakeTimers();
    vi.stubEnv("LAUNCHPAD_LEARNER_SAVE", "1");
    const client = gateway();
    arm(client);
    const saved = progress(allTaskIds(), { "l1-offer": offer, "l1-why": why, "l1-goal-make-money": { kind: "fields", version: 1, values: { amount: 20, savingFor: "a bike" } } });
    scheduleLaunchpadLearnerSave({
      route: "dashboard",
      ventureId: "dog-walking",
      versionId: "11111111-1111-4111-8111-111111111111",
      floors,
      progress: saved,
      onboardingSeen: true,
    });
    await vi.advanceTimersByTimeAsync(SAVE_WAIT);
    expect(client.venture).toHaveBeenCalledTimes(1);
    const row = client.venture.mock.calls[0]![0];
    expect(row.user_id).toBe(USER);
    expect(row.venture_id).toBe("dog-walking");
    expect(row.content_version_id).toBe("11111111-1111-4111-8111-111111111111");
    expect(row.onboarding_seen_at).toBe("2026-11-17T12:00:00.000Z");
    expect(row).not.toHaveProperty("wrap_up_confirmed_at");
    expect(row).not.toHaveProperty("gold_earned_at");
    const answerCall = client.answers.mock.calls[0]?.[0] as { user_id: string; answer_key: string }[];
    expect(answerCall.map((item) => item.user_id)).toEqual([USER, USER]);
    expect(answerCall.map((item) => item.answer_key).sort()).toEqual(["business_offer", "my_why"]);
    expect(answerRowsForSave({ userId: USER, learnerVentureId: "row-1", progress: saved, floors, completedAt: "2026-11-17T12:00:00.000Z" }).some((item) => item.answer_key === "goal_make_money")).toBe(false);
  });

  it("keeps the browser copy when the write fails", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_LAUNCHPAD_LEARNER_SAVE", "1");
    saveVentureTestProgress("dog-walking", progress(["keep-me"]));
    const client = gateway();
    client.venture.mockResolvedValue({ id: null, error: "offline" });
    arm(client);
    scheduleLaunchpadLearnerSave({
      route: "dashboard",
      ventureId: "dog-walking",
      versionId: null,
      floors,
      progress: progress(["keep-me"]),
      onboardingSeen: false,
    });
    const result = await flushLaunchpadLearnerSave();
    expect(result).toBe("kept-browser");
    expect(JSON.parse(localStorage.getItem("lp-venture-test:v1:dog-walking") ?? "{}").completedTaskIds).toEqual(["keep-me"]);
  });

  it("never saves from the test route", async () => {
    vi.stubEnv("LAUNCHPAD_LEARNER_SAVE", "1");
    const client = gateway();
    arm(client);
    scheduleLaunchpadLearnerSave({
      route: "test",
      ventureId: "dog-walking",
      versionId: null,
      floors,
      progress: progress(["l1-s1-b1-t1"], { "l1-offer": offer }),
      onboardingSeen: true,
    });
    expect(await flushLaunchpadLearnerSave()).toBe("skipped");
    expect(client.venture).not.toHaveBeenCalled();
    const parent = gateway();
    arm(parent, { accountRole: "parent_master", accessMode: "registered" });
    scheduleLaunchpadLearnerSave({
      route: "dashboard",
      ventureId: "dog-walking",
      versionId: null,
      floors,
      progress: progress(["l1-s1-b1-t1"]),
      onboardingSeen: false,
    });
    expect(await flushLaunchpadLearnerSave()).toBe("skipped");
    expect(parent.venture).not.toHaveBeenCalled();
  });

  it("leaves the browser copy in place when the read fails", async () => {
    vi.stubEnv("LAUNCHPAD_LEARNER_SAVE", "1");
    saveVentureTestProgress("dog-walking", progress(["local-task"], { "l1-offer": offer }));
    const client = gateway();
    client.readVenture = async () => ({ row: null, error: "down" });
    arm(client);
    const merged = await hydrateLaunchpadLearnerProgress({
      route: "dashboard",
      ventureId: "dog-walking",
      versionId: null,
      floors,
      progress: progress(["local-task"], { "l1-offer": offer }),
      onboardingSeen: false,
    });
    expect(merged).toBeNull();
    expect(JSON.parse(localStorage.getItem("lp-venture-test:v1:dog-walking") ?? "{}").completedTaskIds).toEqual(["local-task"]);
  });
});

const SAVE_WAIT = 500;

describe("venture row level cap", () => {
  it("omits a level the table cannot store", () => {
    const row = ventureRowForSave({
      userId: USER,
      ventureId: "dog-walking",
      versionId: "not-a-uuid",
      progress: progress(allTaskIds()),
      floors,
      onboardingSeen: false,
      seenAt: "2026-11-17T12:00:00.000Z",
    });
    expect(row.content_version_id).toBeNull();
    expect(row.current_level).toBeUndefined();
  });
});
