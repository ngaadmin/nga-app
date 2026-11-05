/**
 * Reads the Final Service Business Framework sheet (Cath's SBF workbook).
 * Module 1 rows are remapped per Final columns D/E (and the Revised sequence
 * sheet) so the loader can find Define the business / Set your goals / The Brand.
 * Handbook content (column AB) is kept for validation tests only — never built.
 */
import path from "node:path";
import { readWorkbookSheets, type WorkbookSheet } from "@/lib/academy/lessons/payload/parse-authoring-table";
import {
  TRACKER_INPUT_TYPES,
  trackerLabel,
  type TrackerInputType,
  type TrackerIssue,
  type TrackerRead,
  type TrackerRow,
} from "@/lib/launchpad/load/read-tracker";

export const LAUNCHPAD_FRAMEWORK_PATH = path.join(
  process.cwd(),
  "lib/launchpad/content/source/dog-walking/service-business-framework.xlsx",
);
export const LAUNCHPAD_FRAMEWORK_SHEET = "Final Service Business Framewor";
export const LAUNCHPAD_REVISED_SHEET = "Revised sequence (5 Nov)";

/** Final sheet columns A–AB (0-based indexes). */
const COL = {
  module: 0,
  silver: 1,
  bronze: 2,
  inRevised: 3,
  status: 4,
  task: 5,
  context: 6,
  guidance: 7,
  question: 8,
  dataInput: 9,
  template: 10,
  notes: 11,
  inputType: 12,
  option1: 13, // Option 1..7 = 13..19
  answerKey: 20,
  fields: 21,
  minPicks: 22,
  maxPicks: 23,
  required: 24,
  feedsWrapUp: 25,
  wrapUpEdit: 26,
  handbook: 27,
} as const;

function cellText(value: string | undefined): string {
  const t = (value ?? "").replace(/\r\n?/g, "\n").trim();
  return /^N\/A$/i.test(t) ? "" : t;
}

function splitNumbered(cell: string): [number | null, string] {
  const m = /^(\d+)\s+(.*)$/.exec(cell.trim());
  return m ? [Number(m[1]), m[2]!.trim()] : [null, cell.trim()];
}

/**
 * Apply Final D/E + Revised remaps for Module 1 so rows match loader lookups.
 * Rows keep their Final sheet row numbers for issue reporting.
 */
function remapModule1(row: TrackerRow): TrackerRow {
  if (row.level !== 1) return row;
  const bronze = trackerLabel(row.bronze);
  const silverRaw = trackerLabel(row.silver);

  // Gold wrap-up (row 14) — workbook validation source; silver stays "Gold".
  if (/^Gold wrap-up/i.test(silverRaw) || /^Wrap-up \(Gold/i.test(bronze)) {
    return { ...row, silver: "Gold", bronze: row.bronze };
  }

  // Offer → Define the business / Pick what kind of business you'll run
  if (/Pick what your business will offer/i.test(bronze) || /Pick what kind of business you'll run/i.test(bronze)) {
    return {
      ...row,
      silver: "1 Define the business",
      bronze: "1 Pick what kind of business you'll run",
      // Keep a findable alias on notes for the old title.
    };
  }
  if (/^Find the why$/i.test(bronze)) {
    return { ...row, silver: "1 Define the business", bronze: "2 Find the why" };
  }
  if (/^Know your impact$/i.test(bronze)) {
    return { ...row, silver: "1 Define the business", bronze: "3 Know your impact" };
  }

  // Goals → Set your goals silver
  if (/^Set your goals \(sequence\)/i.test(bronze)) {
    return { ...row, silver: "2 Set your goals", bronze: "1 Set your goals (sequence)" };
  }
  if (/^Set your goals:/i.test(bronze) || /^4[a-e]\s+Set your goals:/i.test(row.bronze.trim()) || /^1[a-e]\s+Set your goals:/i.test(row.bronze.trim())) {
    // Preserve letter suffix for goal matching (4a / 1a → keep "Set your goals: …").
    const titled = bronze.replace(/^Set your goals:\s*/, "Set your goals: ");
    const letter = /^(\d+)([a-e])\s+/i.exec(row.bronze.trim());
    const prefix = letter ? `1${letter[2]!.toLowerCase()} ` : "";
    return { ...row, silver: "2 Set your goals", bronze: `${prefix}${titled.startsWith("Set your goals:") ? titled : `Set your goals: ${titled}`}` };
  }
  if (/^Add another goal/i.test(bronze)) {
    return { ...row, silver: "2 Set your goals", bronze: "2 Add another goal (optional, final)" };
  }

  // The Brand — name before logo (Revised order)
  if (/^Design the logo$/i.test(bronze) || /^Design your logo$/i.test(bronze)) {
    return { ...row, silver: "3 The Brand", bronze: "2 Design the logo" };
  }
  if (/^Name the business$/i.test(bronze) || /^Name your business$/i.test(bronze)) {
    return { ...row, silver: "3 The Brand", bronze: "1 Name the business" };
  }

  return row;
}

export type FrameworkHandbook = {
  row: number;
  content: string;
  /** Sheet answer-key cell (Final U), when present. */
  sheetAnswerKey?: string;
  bronze: string;
  silver: string;
};

export type FrameworkRead = TrackerRead & {
  /** Handbook content by Final sheet row — validation only, never built. */
  handbookByRow: Map<number, FrameworkHandbook>;
  /** Vision template extracted from row 14 handbook (AB14), when present. */
  visionTemplateFromHandbook: string | null;
};

function extractVisionTemplate(handbook: string): string | null {
  const m = /\{vision-sentence\}\s*=\s*([\s\S]+?)(?:\n\n|\nFooter:|$)/.exec(handbook);
  if (!m) return null;
  return m[1]!.replace(/\s+/g, " ").trim();
}

export function frameworkFromSheets(sheets: readonly WorkbookSheet[], maxLevel = Number.POSITIVE_INFINITY): FrameworkRead {
  const issues: TrackerIssue[] = [];
  const sheet = sheets.find((s) => s.name === LAUNCHPAD_FRAMEWORK_SHEET);
  if (!sheet) throw new Error(`Framework workbook has no "${LAUNCHPAD_FRAMEWORK_SHEET}" tab.`);

  const [header, ...body] = sheet.rows;
  const expectedStart = ["Module", "Silver", "Bronze"];
  expectedStart.forEach((col, i) => {
    if ((header?.values[i] ?? "").trim() !== col) {
      issues.push({ sheet: sheet.name, row: header?.row ?? 1, reason: `Column ${String.fromCharCode(65 + i)} should be "${col}".` });
    }
  });

  const handbookByRow = new Map<number, FrameworkHandbook>();
  const rows: TrackerRow[] = [];

  for (const { row, values } of body) {
    if (values.every((v) => !v.trim())) continue;
    const [level, levelName] = splitNumbered(values[COL.module] ?? "");
    if (level === null) {
      issues.push({ sheet: sheet.name, row, reason: `Module "${values[COL.module]}" has no level number.` });
      continue;
    }
    if (level > maxLevel) continue;

    const optionCells: string[] = [];
    for (let i = 0; i < 7; i++) {
      const v = cellText(values[COL.option1 + i]).replace(/\s+/g, " ");
      if (v) optionCells.push(v);
    }

    const rawType = cellText(values[COL.inputType]).toLowerCase();
    const inputType = (TRACKER_INPUT_TYPES as readonly string[]).includes(rawType)
      ? (rawType as TrackerInputType)
      : undefined;
    if (rawType && !inputType) {
      issues.push({
        sheet: sheet.name,
        row,
        reason: `Input type "${rawType}" is not one of ${TRACKER_INPUT_TYPES.join(", ")}.`,
      });
    }

    const handbook = cellText(values[COL.handbook]);
    const sheetAnswerKey = cellText(values[COL.answerKey]);
    if (handbook) {
      handbookByRow.set(row, {
        row,
        content: handbook,
        ...(sheetAnswerKey ? { sheetAnswerKey } : {}),
        bronze: (values[COL.bronze] ?? "").trim(),
        silver: (values[COL.silver] ?? "").trim(),
      });
    }

    const base: TrackerRow = {
      row,
      level,
      levelName,
      silver: (values[COL.silver] ?? "").trim(),
      bronze: (values[COL.bronze] ?? "").trim(),
      // Final has no Payload version column; D/E are notes. Leave blank.
      payloadVersion: "",
      task: cellText(values[COL.task]),
      context: cellText(values[COL.context]),
      guidance: cellText(values[COL.guidance]),
      question: cellText(values[COL.question]),
      dataInput: cellText(values[COL.dataInput]),
      template: cellText(values[COL.template]),
      notes: [cellText(values[COL.notes]), cellText(values[COL.inRevised]), cellText(values[COL.status])]
        .filter(Boolean)
        .join(" | "),
      ...(optionCells.length ? { options: optionCells } : {}),
      ...(inputType ? { inputType } : {}),
    };
    rows.push(remapModule1(base));
  }

  const ab14 = handbookByRow.get(14)?.content ?? "";
  return {
    rows,
    notes: [],
    issues,
    handbookByRow,
    visionTemplateFromHandbook: extractVisionTemplate(ab14),
  };
}

export function readFramework(bytes: Uint8Array, maxLevel?: number): FrameworkRead {
  return frameworkFromSheets(readWorkbookSheets(bytes), maxLevel);
}

/** Module 1 only (Final rows 2–14 after remap). */
export function module1Rows(read: FrameworkRead): TrackerRow[] {
  return read.rows.filter((r) => r.level === 1 && r.row >= 2 && r.row <= 14);
}
