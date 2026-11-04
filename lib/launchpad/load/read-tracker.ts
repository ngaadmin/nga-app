import path from "node:path";
import { readWorkbookSheets, type WorkbookSheet } from "@/lib/academy/lessons/payload/parse-authoring-table";

/**
 * Reads the Launchpad bronze task tracker (one row per bronze or wrap-up),
 * the same way the Academy master reader reads its module workbook: tabs by
 * name, header row checked, every row kept with its sheet row number so
 * issues and the export point back at the source cell.
 */

export const LAUNCHPAD_TRACKER_PATH = path.join(
  process.cwd(),
  "lib/launchpad/content/source/dog-walking/bronze-task-tracker.xlsx",
);
export const LAUNCHPAD_TRACKER_SHEET = "Bronze Task Tracker";
export const LAUNCHPAD_TRACKER_NOTES_SHEET = "Notes";

/** Columns A to K, in order. */
export const TRACKER_COLUMNS = [
  "Module",
  "Silver",
  "Bronze",
  "Payload version",
  "Task (what the learner does)",
  "Context (why this step matters)",
  "Guidance (how to do it)",
  "Question (prompt shown to the learner)",
  "Data Input (interaction type and payload fields)",
  "Screen template (Academy screen type borrowed)",
  "Notes",
] as const;

export type TrackerRow = {
  row: number;
  /** Level number from column A ("1 Vision and Goals" -> 1). */
  level: number;
  levelName: string;
  silver: string;
  bronze: string;
  payloadVersion: string;
  task: string;
  context: string;
  guidance: string;
  question: string;
  dataInput: string;
  template: string;
  notes: string;
};

export type TrackerIssue = { sheet: string; row: number; reason: string };

export type TrackerRead = {
  rows: TrackerRow[];
  notes: { date: string; note: string }[];
  issues: TrackerIssue[];
};

/** "1 Vision and Goals" -> [1, "Vision and Goals"]. */
function splitNumbered(cell: string): [number | null, string] {
  const m = /^(\d+)\s+(.*)$/.exec(cell.trim());
  return m ? [Number(m[1]), m[2]!.trim()] : [null, cell.trim()];
}

/** Column C/B label without its leading number ("4a Set your goals: Make money" -> "Set your goals: Make money"). */
export function trackerLabel(cell: string): string {
  return cell.trim().replace(/^\d+[a-z]?\s+/, "");
}

/** "N/A" and blank both mean empty. */
function cellText(value: string | undefined): string {
  const t = (value ?? "").replace(/\r\n?/g, "\n").trim();
  return /^N\/A$/i.test(t) ? "" : t;
}

export function trackerFromSheets(sheets: readonly WorkbookSheet[], maxLevel = Number.POSITIVE_INFINITY): TrackerRead {
  const issues: TrackerIssue[] = [];
  const sheet = sheets.find((s) => s.name === LAUNCHPAD_TRACKER_SHEET);
  if (!sheet) throw new Error(`Tracker workbook has no "${LAUNCHPAD_TRACKER_SHEET}" tab.`);
  const [header, ...body] = sheet.rows;
  TRACKER_COLUMNS.forEach((col, i) => {
    if ((header?.values[i] ?? "").trim() !== col) {
      issues.push({ sheet: sheet.name, row: header?.row ?? 1, reason: `Column ${String.fromCharCode(65 + i)} should be "${col}".` });
    }
  });
  const rows: TrackerRow[] = [];
  for (const { row, values } of body) {
    if (values.every((v) => !v.trim())) continue;
    const [level, levelName] = splitNumbered(values[0] ?? "");
    if (level === null) {
      issues.push({ sheet: sheet.name, row, reason: `Module "${values[0]}" has no level number.` });
      continue;
    }
    if (level > maxLevel) continue;
    rows.push({
      row,
      level,
      levelName,
      silver: (values[1] ?? "").trim(),
      bronze: (values[2] ?? "").trim(),
      payloadVersion: cellText(values[3]),
      task: cellText(values[4]),
      context: cellText(values[5]),
      guidance: cellText(values[6]),
      question: cellText(values[7]),
      dataInput: cellText(values[8]),
      template: cellText(values[9]),
      notes: cellText(values[10]),
    });
  }
  const notesSheet = sheets.find((s) => s.name === LAUNCHPAD_TRACKER_NOTES_SHEET);
  const notes = (notesSheet?.rows ?? [])
    .slice(1)
    .filter((r) => r.values.some((v) => v.trim()))
    .map((r) => ({ date: (r.values[0] ?? "").trim(), note: (r.values[1] ?? "").trim() }));
  return { rows, notes, issues };
}

export function readTracker(bytes: Uint8Array, maxLevel?: number): TrackerRead {
  return trackerFromSheets(readWorkbookSheets(bytes), maxLevel);
}
