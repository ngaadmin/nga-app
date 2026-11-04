import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readWorkbookSheets, type WorkbookSheet } from "@/lib/academy/lessons/payload/parse-authoring-table";
import { buildDogWalkingLoad, RETIRED_WHY_ITEM_IDS, TEST_COME_BACK_LATER_TASK_IDS } from "@/lib/launchpad/load/dog-walking-load";
import { DOG_WALKING_LOAD_PATH } from "@/lib/launchpad/load/paths";
import { LAUNCHPAD_TRACKER_PATH, LAUNCHPAD_TRACKER_SHEET, splitOptionsCell, trackerFromSheets } from "@/lib/launchpad/load/read-tracker";
import type { LaunchpadLoadFile } from "@/lib/launchpad/load/types";

const SHEETS = readWorkbookSheets(readFileSync(LAUNCHPAD_TRACKER_PATH));
const SOURCE = { file: "tracker.xlsx", md5: "test" };
const COMMITTED = JSON.parse(readFileSync(path.join(process.cwd(), DOG_WALKING_LOAD_PATH), "utf8")) as LaunchpadLoadFile;

/** The tracker with extra header columns after K and per-row cells for them. */
function withColumns(cols: string[], cells: Record<number, string[]>): WorkbookSheet[] {
  return SHEETS.map((sheet) =>
    sheet.name !== LAUNCHPAD_TRACKER_SHEET
      ? sheet
      : {
          ...sheet,
          rows: sheet.rows.map((r, i) => {
            const base = [...r.values, ...Array(Math.max(0, 11 - r.values.length)).fill("")].slice(0, 11);
            return { ...r, values: [...base, ...(i === 0 ? cols : (cells[r.row] ?? cols.map(() => "")))] };
          }),
        },
  );
}

const build = (sheets: WorkbookSheet[]) => buildDogWalkingLoad(trackerFromSheets(sheets, 2), SOURCE);
const screenOf = (load: LaunchpadLoadFile, bronzeId: string) =>
  load.levels.flatMap((l) => l.silvers.flatMap((s) => s.bronzes)).find((b) => b.id === bronzeId)!.tasks[0]!.screens[0]!.payload!;

describe("dog walking load reader", () => {
  it("rebuilds the committed load from the tracker with no issues", () => {
    const { load, issues } = build(SHEETS);
    expect(issues).toEqual([]);
    expect({ ...load, source: COMMITTED.source }).toEqual(COMMITTED);
  });

  it("Find the why has exactly four items (Support a cause removed 4 Nov 8:44pm); the retired item is dropped even if the sheet lists it", () => {
    const why = screenOf(build(SHEETS).load, "l1-s1-b2");
    if (why.type !== "rank-order") throw new Error("expected rank-order");
    expect(why.items.map((i) => i.label)).toEqual(["Make money", "Help others", "Learn new skills", "Be my own boss"]);
    expect(why.items.some((i) => RETIRED_WHY_ITEM_IDS.includes(i.id))).toBe(false);
    expect(JSON.stringify(COMMITTED)).not.toMatch(/\bprove|prove-i-can/i);
  });

  it("Set your goals: intro on the loop (step 1), Support a cause from Know your impact, no goal-level not applicable, 'in' before the timeframe, weeks or months", () => {
    const bronze = build(SHEETS).load.levels[0]!.silvers[0]!.bronzes.find((b) => b.id === "l1-s1-b4")!;
    const screens = bronze.tasks[0]!.screens;
    expect(screens.some((s) => s.payload?.type === "context")).toBe(false);
    const loop = screens[0]!.payload!;
    if (loop.type !== "goal-loop") throw new Error("expected goal-loop first");
    expect(loop.context).toBeTruthy();
    expect(loop.guidance).toBe(
      "Finish the sentence for each reason you ranked above the line. Use a number and a timeframe so you can check your progress later. Reasons you moved below the line don't need a goal.",
    );
    const cause = loop.goals.find((g) => g.screen.answerKey === "l1-goal-support-a-cause")!;
    expect(cause.rankItemId).toBeUndefined();
    expect(cause.position).toBe("after-ranked");
    expect(loop.skipRankItemIds).toEqual([]);
    // Help others: benefit only, no timeframe (Cath, 4 Nov 8:50pm, tracker H7/U7).
    const help = loop.goals.find((g) => g.rankItemId === "help-others")!;
    if (help.screen.type !== "short-text") throw new Error("expected short-text");
    expect(help.screen.fields.map((f) => f.name)).toEqual(["benefit"]);
    expect(help.screen.parts.map((p) => (p.kind === "text" ? p.text : "_")).join("")).toBe("I want my customers to _.");
    for (const g of loop.goals) {
      expect((g.screen as { notApplicableLabel?: string }).notApplicableLabel).toBeUndefined();
      if (g.screen.type !== "short-text") continue;
      const text = g.screen.parts.map((p) => (p.kind === "text" ? p.text : "_")).join("");
      expect(text).not.toMatch(/ by _/);
      const unit = g.screen.fields.find((f) => f.name === "timeframeUnit");
      if (unit) {
        // Add another goal shows its timeframe as labelled fields under the sentence, not in it.
        if (g.screen.parts.some((p) => p.kind === "field" && p.field === "timeframeNumber")) expect(text).toMatch(/ in _ _\.$/);
        expect(unit.options!.map((o) => o.id)).toEqual(["weeks", "months"]);
        expect(g.screen.fields.find((f) => f.name === "timeframeNumber")!.hint).toBe("1–99");
      }
    }
  });

  it("splits a pipe-separated Options cell", () => {
    expect(splitOptionsCell(" Dog walking |Training||  Pet   sitting ")).toEqual(["Dog walking", "Training", "Pet sitting"]);
  });

  it("structured Options and Input type columns win over the Data Input sentence", () => {
    const { load, issues } = build(
      withColumns(["Options", "Input type"], {
        2: ["Dog walking | Pet sitting | Puppy training", "multi-choice"],
        3: ["Make money | Help others | Learn new skills | Be my own boss | Prove I can do it", "rank"],
      }),
    );
    expect(issues).toEqual([]);
    const offer = screenOf(load, "l1-s1-b1");
    if (offer.type !== "choice-capture") throw new Error("expected choice-capture");
    expect(offer.options).toEqual([
      { id: "dog-walking", label: "Dog walking" },
      { id: "pet-sitting", label: "Pet sitting" },
      { id: "puppy-training", label: "Puppy training" },
    ]);
    const why = screenOf(load, "l1-s1-b2");
    if (why.type !== "rank-order") throw new Error("expected rank-order");
    expect(why.items).toHaveLength(4);
  });

  it("Option N columns win over the pipe Options column and keep the current ids", () => {
    const { load, issues } = build(
      withColumns(["Input type", "Option 2", "Option 1", "Options", "Option 3"], {
        2: ["multi-choice", "Grooming", "Dog walking", "Ignored | Pipe", "Pet  sitting"],
        4: ["single-choice", "", "", "Animals | Environment", ""],
      }),
    );
    expect(issues).toEqual([]);
    const offer = screenOf(load, "l1-s1-b1");
    if (offer.type !== "choice-capture") throw new Error("expected choice-capture");
    expect(offer.options).toEqual([
      { id: "dog-walking", label: "Dog walking" },
      { id: "grooming", label: "Grooming" },
      { id: "pet-sitting", label: "Pet sitting" },
    ]);
    const cause = screenOf(load, "l1-s1-b3");
    if (cause.type !== "choice-capture") throw new Error("expected choice-capture");
    expect(cause.options.map((o) => o.id)).toEqual(["animals", "environment"]);
  });

  it("the 4 Nov options-columns workbook layout rebuilds the committed load", () => {
    const rows: Record<number, string[]> = {
      2: ["multi-choice", "Dog walking", "Grooming", "Bookings", "Training", "Manage bookings for others", "", ""],
      3: ["rank", "Make money", "Help others", "Learn new skills", "Be my own boss", "", "", ""],
      4: ["single-choice", "Animals", "The environment", "Kids in need", "People who are hungry", "Older people", "", ""],
      9: ["single-choice", "Choosing when I work (my own schedule and hours)", "Keeping the money I make", "Working where I want", "Making things my own way", "", "", ""],
      6: ["fill-in", "", "", "", "", "", "", ""],
      11: ["fill-in", "", "", "", "", "", "", ""],
      14: ["fill-in", "", "", "", "", "", "", ""],
      15: ["fill-in", "", "", "", "", "", "", ""],
    };
    const cols = ["Input type", ...Array.from({ length: 7 }, (_, i) => `Option ${i + 1}`)];
    const { load, issues } = build(withColumns(cols, rows));
    expect(issues).toEqual([]);
    expect({ ...load, source: COMMITTED.source }).toEqual(COMMITTED);
  });

  it("blank structured cells fall back to parsing the sentence", () => {
    const { load, issues } = build(withColumns(["Input type", "Options"], {}));
    expect(issues).toEqual([]);
    expect({ ...load, source: COMMITTED.source }).toEqual(COMMITTED);
  });

  it("reports an unknown Input type, and one the row cannot use", () => {
    const { issues } = build(withColumns(["Options", "Input type"], { 2: ["", "slider"], 4: ["", "rank"] }));
    expect(issues.map((i) => i.row)).toEqual(expect.arrayContaining([2, 4]));
    expect(issues.find((i) => i.row === 2)?.reason).toMatch(/not one of/);
    expect(issues.find((i) => i.row === 4)?.reason).toMatch(/not supported/);
  });
});

describe("'Come back later' tracker column", () => {
  const flagged = (load: LaunchpadLoadFile) =>
    load.levels.flatMap((l) => l.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks))).filter((t) => t.canComeBackLater).map((t) => t.id);

  it("with no column, only the TEST sample override applies, recorded as decision D22 (sample, pending tracker column)", () => {
    const { load } = build(SHEETS);
    expect(flagged(load)).toEqual([...TEST_COME_BACK_LATER_TASK_IDS]);
    expect(load.levels.flatMap((l) => l.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks))).every((t) => typeof t.canComeBackLater === "boolean")).toBe(true);
    const d22 = load.decisions.find((d) => d.id === "D22");
    expect(d22).toMatchObject({ topic: "Come back later", status: "sample-pending-tracker-column", rows: [5, 15] });
  });

  it("once the column exists it is read by header name (Yes/No) and the override stops", () => {
    const { load, issues } = build(withColumns(["Come back later"], { 2: ["Yes"], 5: ["No"], 15: ["no"] }));
    expect(issues).toEqual([]);
    expect(flagged(load)).toEqual(["l1-s1-b1-t1"]);
  });

  it("reports a cell that is not Yes or No", () => {
    const { issues } = build(withColumns(["Come back later"], { 3: ["Maybe"] }));
    expect(JSON.stringify(issues)).toMatch(/Yes or No/);
  });
});
