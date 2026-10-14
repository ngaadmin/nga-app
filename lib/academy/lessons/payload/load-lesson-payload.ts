import { readFileSync } from "node:fs";
import path from "node:path";

import { parseAuthoringTable } from "@/lib/academy/lessons/payload/parse-authoring-table";
import type {
  AuthoringTableSource,
  LessonPayload,
  PayloadCohortCopy,
  PayloadScreenRow,
} from "@/lib/academy/lessons/payload/types";

const SOURCE_DIR = path.join(
  process.cwd(),
  "lib/academy/lessons/payload/source",
);

const SCREEN_COLUMNS = {
  module: "Module Number",
  lesson: "Lesson Number",
  screen: "Screen",
  gameType: "Game Type",
  explorerText: "Explorer Text",
  pathfinderText: "Pathfinder Text",
  maverickText: "Maverick Text",
  explorerImage: "Explorer Image",
  pathfinderImage: "Pathfinder Image",
  maverickImage: "Maverick Image",
  explorerSettings: "Explorer Settings",
  pathfinderSettings: "Game Settings",
  maverickSettings: "Maverick Settings",
  explorerError: "Error Explorer",
  pathfinderError: "Error Pathfinder",
  maverickError: "Error Maverick",
} as const;

function cell(row: readonly string[], index: number): string {
  return (row[index] ?? "").trim();
}

function columnIndex(headers: readonly string[], name: string): number {
  const target = name.trim().toLowerCase();
  const index = headers.findIndex((header) => header.trim().toLowerCase() === target);
  if (index < 0) {
    throw new Error(`Missing column "${name}".`);
  }
  return index;
}

function requireColumns(
  headers: readonly string[],
  names: readonly string[],
): Record<string, number> {
  const indexes: Record<string, number> = {};
  for (const name of names) {
    indexes[name] = columnIndex(headers, name);
  }
  return indexes;
}

function cohortCopy(
  row: readonly string[],
  indexes: Record<string, number>,
  explorer: string,
  pathfinder: string,
  maverick: string,
): PayloadCohortCopy {
  return {
    explorer: cell(row, indexes[explorer] ?? -1),
    pathfinder: cell(row, indexes[pathfinder] ?? -1),
    maverick: cell(row, indexes[maverick] ?? -1),
  };
}

function parseLessonDetails(
  rows: readonly (readonly string[])[],
  moduleNumber: number,
  lessonNumber: number,
): Omit<LessonPayload, "screens"> {
  if (rows.length === 0) {
    throw new Error("Lesson details table is empty.");
  }
  const headers = rows[0] ?? [];
  const indexes = requireColumns(headers, [
    "Module Number",
    "Lesson Number",
    "Field",
    "Value",
  ]);
  const fields = new Map<string, string>();

  for (const row of rows.slice(1)) {
    const rowModule = Number.parseInt(cell(row, indexes["Module Number"] ?? 0), 10);
    const lesson = Number.parseInt(cell(row, indexes["Lesson Number"] ?? 0), 10);
    if (rowModule !== moduleNumber || lesson !== lessonNumber) continue;
    const field = cell(row, indexes.Field ?? 0);
    if (!field) continue;
    fields.set(field, cell(row, indexes.Value ?? 0));
  }

  if (fields.size === 0) {
    throw new Error(
      `No lesson details for module ${moduleNumber} lesson ${lessonNumber}.`,
    );
  }

  const level = Number.parseInt(fields.get("Level") ?? "", 10);

  return {
    moduleNumber,
    lessonNumber,
    lessonTitle: fields.get("Lesson Title") ?? "",
    level: Number.isFinite(level) ? level : moduleNumber,
    characters: {
      explorer: fields.get("Explorer Character") ?? "",
      pathfinder: fields.get("Pathfinder Character") ?? "",
      maverick: fields.get("Maverick Character") ?? "",
      support: fields.get("Support Character") ?? "",
    },
    skillName: fields.get("Skill Name") ?? "",
    skillId: fields.get("Skill ID") ?? "",
  };
}

function parseScreens(
  rows: readonly (readonly string[])[],
  moduleNumber: number,
  lessonNumber: number,
): PayloadScreenRow[] {
  if (rows.length === 0) {
    throw new Error("Screens table is empty.");
  }
  const headers = rows[0] ?? [];
  const indexes = requireColumns(headers, Object.values(SCREEN_COLUMNS));
  const screens: PayloadScreenRow[] = [];

  for (const row of rows.slice(1)) {
    const rowModule = Number.parseInt(cell(row, indexes[SCREEN_COLUMNS.module] ?? 0), 10);
    const lesson = Number.parseInt(cell(row, indexes[SCREEN_COLUMNS.lesson] ?? 0), 10);
    const screenLabel = cell(row, indexes[SCREEN_COLUMNS.screen] ?? 0).trim();
    const screenNumber = Number.parseInt(screenLabel, 10);
    const gameType = cell(row, indexes[SCREEN_COLUMNS.gameType] ?? 0).toLowerCase();
    if (rowModule !== moduleNumber || lesson !== lessonNumber) continue;
    if (!Number.isFinite(screenNumber) || !gameType) continue;

    screens.push({
      screenNumber,
      screenLabel: screenLabel || String(screenNumber),
      gameType,
      text: cohortCopy(
        row,
        indexes,
        SCREEN_COLUMNS.explorerText,
        SCREEN_COLUMNS.pathfinderText,
        SCREEN_COLUMNS.maverickText,
      ),
      image: cohortCopy(
        row,
        indexes,
        SCREEN_COLUMNS.explorerImage,
        SCREEN_COLUMNS.pathfinderImage,
        SCREEN_COLUMNS.maverickImage,
      ),
      settings: cohortCopy(
        row,
        indexes,
        SCREEN_COLUMNS.explorerSettings,
        SCREEN_COLUMNS.pathfinderSettings,
        SCREEN_COLUMNS.maverickSettings,
      ),
      error: cohortCopy(
        row,
        indexes,
        SCREEN_COLUMNS.explorerError,
        SCREEN_COLUMNS.pathfinderError,
        SCREEN_COLUMNS.maverickError,
      ),
    });
  }

  screens.sort((a, b) => a.screenNumber - b.screenNumber);
  if (screens.length === 0) {
    throw new Error(
      `No screens for module ${moduleNumber} lesson ${lessonNumber}.`,
    );
  }
  return screens;
}

/**
 * Read one module lesson from a Screens workbook/CSV and a Lesson-Details table.
 * Both inputs may be .xlsx or .csv. Older repo authoring sheets are not read.
 */
export function loadLessonPayload(input: {
  moduleNumber: number;
  lessonNumber: number;
  screens: AuthoringTableSource;
  lessonDetails: AuthoringTableSource;
}): LessonPayload {
  const details = parseLessonDetails(
    parseAuthoringTable(input.lessonDetails),
    input.moduleNumber,
    input.lessonNumber,
  );
  const screens = parseScreens(
    parseAuthoringTable(input.screens),
    input.moduleNumber,
    input.lessonNumber,
  );
  return { ...details, screens };
}

/** Checked-in Screens1.csv + Lesson-Details.csv. The CSV is the source of truth. */
export function loadBundledLessonPayload(
  moduleNumber: number,
  lessonNumber: number,
): LessonPayload {
  const screensPath = path.join(SOURCE_DIR, "Screens1.csv");
  const detailsPath = path.join(SOURCE_DIR, "Lesson-Details.csv");
  return loadLessonPayload({
    moduleNumber,
    lessonNumber,
    screens: {
      filename: "Screens1.csv",
      text: readFileSync(screensPath, "utf8"),
    },
    lessonDetails: {
      filename: "Lesson-Details.csv",
      text: readFileSync(detailsPath, "utf8"),
    },
  });
}
