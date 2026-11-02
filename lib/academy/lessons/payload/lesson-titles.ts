import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import { parseAuthoringTable } from "@/lib/academy/lessons/payload/parse-authoring-table";

const DETAILS_PATH = path.join(
  process.cwd(),
  "lib/academy/lessons/payload/source/Lesson-Details.csv",
);

type LessonTitleRow = {
  moduleNumber: number;
  lessonNumber: number;
  title: string;
  skillId: string;
};

let cached: LessonTitleRow[] | null = null;

/** Build title rows from the Lesson-Details table (read only, never edited). */
export function lessonTitleRowsFromTable(
  rows: readonly (readonly string[])[],
): LessonTitleRow[] {
  const headers = rows[0] ?? [];
  const col = (name: string) => headers.findIndex((header) => header.trim() === name);
  const moduleCol = col("Module Number");
  const lessonCol = col("Lesson Number");
  const fieldCol = col("Field");
  const valueCol = col("Value");
  if ([moduleCol, lessonCol, fieldCol, valueCol].some((index) => index < 0)) return [];

  const byKey = new Map<string, LessonTitleRow>();
  for (const row of rows.slice(1)) {
    const moduleNumber = Number.parseInt(row[moduleCol] ?? "", 10);
    const lessonNumber = Number.parseInt(row[lessonCol] ?? "", 10);
    if (!Number.isFinite(moduleNumber) || !Number.isFinite(lessonNumber)) continue;
    const key = `${moduleNumber}:${lessonNumber}`;
    const entry =
      byKey.get(key) ?? { moduleNumber, lessonNumber, title: "", skillId: "" };
    const field = (row[fieldCol] ?? "").trim();
    const value = (row[valueCol] ?? "").trim();
    if (field === "Lesson Title") entry.title = value;
    if (field === "Skill ID") entry.skillId = value;
    byKey.set(key, entry);
  }
  return [...byKey.values()].filter((entry) => entry.title);
}

function readRows(): LessonTitleRow[] {
  if (cached) return cached;
  try {
    cached = lessonTitleRowsFromTable(
      parseAuthoringTable({
        filename: "Lesson-Details.csv",
        text: readFileSync(DETAILS_PATH, "utf8"),
      }),
    );
  } catch {
    cached = [];
  }
  return cached;
}

/**
 * Pick the lesson title for a usage event. Usage events store the lesson
 * number inside its module, so a skill slug narrows the module when it is
 * known. Returns null when the match is not unique.
 */
export function pickLessonTitle(
  rows: readonly LessonTitleRow[],
  lessonNumber: number | null | undefined,
  skillSlug: string | undefined,
): string | null {
  if (typeof lessonNumber !== "number" || lessonNumber <= 0) return null;
  let matches = rows.filter((row) => row.lessonNumber === lessonNumber);
  if (skillSlug && matches.length > 1) {
    const bySkill = matches.filter((row) => row.skillId === skillSlug);
    if (bySkill.length > 0) matches = bySkill;
  }
  return matches.length === 1 ? (matches[0]?.title ?? null) : null;
}

export function lessonTitleFor(
  lessonNumber: number | null | undefined,
  skillSlug: string | undefined,
): string | null {
  return pickLessonTitle(readRows(), lessonNumber, skillSlug);
}
