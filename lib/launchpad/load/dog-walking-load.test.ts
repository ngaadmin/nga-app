import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readWorkbookSheets, type WorkbookSheet } from "@/lib/academy/lessons/payload/parse-authoring-table";
import { buildDogWalkingLoad, RETIRED_WHY_ITEM_IDS } from "@/lib/launchpad/load/dog-walking-load";
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

  it("Find the why has exactly five items; the retired item is dropped even if the sheet lists it", () => {
    const why = screenOf(build(SHEETS).load, "l1-s1-b2");
    if (why.type !== "rank-order") throw new Error("expected rank-order");
    expect(why.items.map((i) => i.label)).toEqual(["Make money", "Help others", "Learn new skills", "Be my own boss", "Support a cause"]);
    expect(why.items.some((i) => RETIRED_WHY_ITEM_IDS.includes(i.id))).toBe(false);
    expect(JSON.stringify(COMMITTED)).not.toMatch(/\bprove|prove-i-can/i);
  });

  it("splits a pipe-separated Options cell", () => {
    expect(splitOptionsCell(" Dog walking |Training||  Pet   sitting ")).toEqual(["Dog walking", "Training", "Pet sitting"]);
  });

  it("structured Options and Input type columns win over the Data Input sentence", () => {
    const { load, issues } = build(
      withColumns(["Options", "Input type"], {
        2: ["Dog walking | Pet sitting | Puppy training", "multi-choice"],
        3: ["Make money | Help others | Learn new skills | Be my own boss | Support a cause | Prove I can do it", "rank"],
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
    expect(why.items).toHaveLength(5);
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
