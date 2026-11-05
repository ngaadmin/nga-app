import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildDogWalkingLoad, RETIRED_WHY_ITEM_IDS, TEST_COME_BACK_LATER_TASK_IDS } from "@/lib/launchpad/load/dog-walking-load";
import { DOG_WALKING_LOAD_PATH, LAUNCHPAD_FRAMEWORK_SOURCE, LAUNCHPAD_TRACKER_SOURCE } from "@/lib/launchpad/load/paths";
import {
  LAUNCHPAD_FRAMEWORK_PATH,
  LAUNCHPAD_FRAMEWORK_SHEET,
  readFramework,
} from "@/lib/launchpad/load/read-framework";
import { LAUNCHPAD_TRACKER_PATH, readTracker, trackerLabel } from "@/lib/launchpad/load/read-tracker";
import type { TrackerRead, TrackerRow } from "@/lib/launchpad/load/read-tracker";
import type { LaunchpadLoadFile } from "@/lib/launchpad/load/types";

const FRAMEWORK_BYTES = readFileSync(LAUNCHPAD_FRAMEWORK_PATH);
const FRAMEWORK_MD5 = createHash("md5").update(FRAMEWORK_BYTES).digest("hex");
const FRAMEWORK = readFramework(FRAMEWORK_BYTES, 1);
const TRACKER = readTracker(readFileSync(LAUNCHPAD_TRACKER_PATH), 2);
const COMMITTED = JSON.parse(readFileSync(path.join(process.cwd(), DOG_WALKING_LOAD_PATH), "utf8")) as LaunchpadLoadFile;

function hybridRead(framework = FRAMEWORK, tracker = TRACKER): TrackerRead {
  const l2Rows = tracker.rows.filter((r) => r.level === 2 && /product and its buyers/i.test(r.silver));
  return {
    rows: [...framework.rows.filter((r) => r.level === 1), ...l2Rows] as TrackerRow[],
    notes: [
      ...framework.notes,
      ...tracker.notes,
      {
        date: "5 Nov 2026",
        note: `Hybrid: Module 1 from ${LAUNCHPAD_FRAMEWORK_SOURCE}; Level 2 from ${LAUNCHPAD_TRACKER_SOURCE}.`,
      },
    ],
    issues: [...framework.issues, ...tracker.issues],
  };
}

const SOURCE = {
  file: LAUNCHPAD_FRAMEWORK_SOURCE,
  md5: FRAMEWORK_MD5,
  sheet: LAUNCHPAD_FRAMEWORK_SHEET,
  visionTemplateFromHandbook: FRAMEWORK.visionTemplateFromHandbook,
};

const build = () => buildDogWalkingLoad(hybridRead(), SOURCE);
const screenOf = (load: LaunchpadLoadFile, bronzeId: string) =>
  load.levels.flatMap((l) => l.silvers.flatMap((s) => s.bronzes)).find((b) => b.id === bronzeId)!.tasks[0]!.screens[0]!.payload!;

describe("dog walking load reader (Final framework Module 1 + tracker L2)", () => {
  it("rebuilds the committed load from the hybrid sources with no issues", () => {
    const { load, issues } = build();
    expect(issues).toEqual([]);
    expect(JSON.parse(JSON.stringify(load))).toEqual(COMMITTED);
  });

  it("Module 1 is three silvers: Define the business, Set your goals, The Brand (D26/D27)", () => {
    const { load } = build();
    expect(load.levels[0]!.silvers.map((s) => [s.id, s.title, s.build])).toEqual([
      ["l1-s1", "Define the business", "load"],
      ["l1-s2", "Set your goals", "load"],
      ["l1-s3", "The Brand", "locked"],
    ]);
    expect(load.levels[0]!.silvers[2]!.seedSilverId).toBe("l2-s2");
  });

  it("Find the why has exactly four items; the retired item is dropped", () => {
    const why = screenOf(build().load, "l1-s1-b2");
    if (why.type !== "rank-order") throw new Error("expected rank-order");
    expect(why.items.map((i) => i.label)).toEqual(["Make money", "Help others", "Learn new skills", "Be my own boss"]);
    expect(why.items.some((i) => RETIRED_WHY_ITEM_IDS.includes(i.id))).toBe(false);
    expect(JSON.stringify(COMMITTED)).not.toMatch(/\bprove|prove-i-can/i);
  });

  it("Offer options include Dog sitting (Final Option 3 / D29)", () => {
    const offer = screenOf(build().load, "l1-s1-b1");
    if (offer.type !== "choice-capture") throw new Error("expected choice-capture");
    expect(offer.options.map((o) => o.label)).toEqual(
      expect.arrayContaining(["Dog walking", "Dog sitting"]),
    );
  });

  it("Set your goals lives on l1-s2: intro on the loop, Support a cause from Know your impact, weeks or months", () => {
    const bronze = build().load.levels[0]!.silvers[1]!.bronzes.find((b) => b.id === "l1-s2-b1")!;
    const screens = bronze.tasks[0]!.screens;
    expect(screens.some((s) => s.payload?.type === "context")).toBe(false);
    const loop = screens[0]!.payload!;
    if (loop.type !== "goal-loop") throw new Error("expected goal-loop first");
    expect(loop.context).toBeTruthy();
    const cause = loop.goals.find((g) => g.screen.answerKey === "l1-goal-support-a-cause")!;
    expect(cause.rankItemId).toBeUndefined();
    expect(cause.position).toBe("after-ranked");
    expect(loop.skipRankItemIds).toEqual([]);
    const help = loop.goals.find((g) => g.rankItemId === "help-others")!;
    if (help.screen.type !== "short-text") throw new Error("expected short-text");
    expect(help.screen.fields.map((f) => f.name)).toEqual(["customerCount", "benefit"]);
    for (const g of loop.goals) {
      expect((g.screen as { notApplicableLabel?: string }).notApplicableLabel).toBeUndefined();
      if (g.screen.type !== "short-text") continue;
      const unit = g.screen.fields.find((f) => f.name === "timeframeUnit");
      if (unit) {
        expect(unit.options!.map((o) => o.id)).toEqual(["weeks", "months"]);
      }
    }
  });

  it("Make money goal: I'm saving for is capped at 60 characters (V6)", () => {
    const bronze = build().load.levels[0]!.silvers[1]!.bronzes.find((b) => b.id === "l1-s2-b1")!;
    const loop = bronze.tasks[0]!.screens[0]!.payload!;
    if (loop.type !== "goal-loop") throw new Error("expected goal-loop first");
    const money = loop.goals.find((g) => g.screen.answerKey === "l1-goal-make-money")!;
    if (money.screen.type !== "short-text") throw new Error("expected short-text");
    expect(money.screen.fields.find((f) => f.name === "savingFor")!.maxLength).toBe(60);
  });

  it("L2 product silver keeps Decide what to sell and Know who your customers are (Final title)", () => {
    const { load } = build();
    const s = load.levels[1]!.silvers[0]!;
    expect(s.title).toBe("The product and its buyers");
    expect(s.bronzes.map((b) => b.title)).toEqual(["Decide what to sell", "Know who your customers are"]);
  });

  it("decisions include D26–D30 (Storybird draft outcomes flagged pending Cath)", () => {
    const { load } = build();
    expect(load.decisions.map((d) => d.id)).toEqual(
      expect.arrayContaining(["D26", "D27", "D28", "D29", "D30"]),
    );
    expect(load.decisions.find((d) => d.id === "D28")?.status).toBe("default-pending-cath");
  });
});

describe("handbook column (AB) — TEST validation only", () => {
  it("row 14 handbook yields a vision template with {business-type}", () => {
    expect(FRAMEWORK.visionTemplateFromHandbook).toMatch(/\{business-type\}/);
    expect(FRAMEWORK.handbookByRow.get(14)?.content.length).toBeGreaterThan(20);
  });

  it("identity wrap vision uses the handbook template", () => {
    const brand = build().load.levels[0]!.silvers[2]!;
    expect(brand.wrapUp?.vision?.template).toBe(FRAMEWORK.visionTemplateFromHandbook);
  });

  it("every Module 1 row 2–14 is consumed by the load (except unused handbook-only notes)", () => {
    const { load, issues } = build();
    expect(issues).toEqual([]);
    const used = new Set<number>();
    for (const s of load.levels[0]!.silvers) {
      for (const b of s.bronzes) for (const t of b.tasks) for (const sc of t.screens) used.add(sc.sourceRow);
      for (const r of s.lockedRows ?? []) used.add(r.sourceRow);
      if (s.wrapUp) used.add(s.wrapUp.sourceRow);
    }
    for (const r of FRAMEWORK.rows.filter((row) => row.level === 1 && row.row >= 2 && row.row <= 14)) {
      expect(used.has(r.row), `row ${r.row} ${trackerLabel(r.bronze)} unused`).toBe(true);
    }
  });
});

describe("'Come back later'", () => {
  const flagged = (load: LaunchpadLoadFile) =>
    load.levels
      .flatMap((l) => l.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks)))
      .filter((t) => t.canComeBackLater)
      .map((t) => t.id);

  it("with no column, only the TEST sample override applies (D22)", () => {
    const { load } = build();
    expect(flagged(load)).toEqual([...TEST_COME_BACK_LATER_TASK_IDS]);
    const d22 = load.decisions.find((d) => d.id === "D22");
    expect(d22).toMatchObject({ topic: "Come back later", status: "sample-pending-tracker-column" });
  });
});
