/**
 * Copy Module 1 picture filenames from the bundled master into Screens1.csv.
 *
 * Only the three image columns change on a row the CSV already has.
 * A workbook row with no CSV screen (a scenario beat, or a new screen id)
 * is appended. Its text, settings, and error cells come from the master
 * because the row did not exist. Other columns on existing rows stay put.
 *
 *   npx tsx --tsconfig tsconfig.json tools/sync-screens1-images.ts
 *   npx tsx --tsconfig tsconfig.json tools/sync-screens1-images.ts --check
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { parseCsv, readWorkbookSheets } from "@/lib/academy/lessons/payload/parse-authoring-table";

const ROOT = process.cwd();
const CSV_PATH = path.join(ROOT, "lib/academy/lessons/payload/source/Screens1.csv");
const WORKBOOK_PATH = path.join(
  ROOT,
  "lib/academy/lessons/payload/source/master/module-1-screens.xlsx",
);
const SHEETS = ["M1 Explorer", "M1 Pathfinder", "M1 Maverick"] as const;
const IMAGE_HEADERS = ["Explorer Image", "Pathfinder Image", "Maverick Image"] as const;

type Row = string[];

function cell(values: readonly string[], index: number): string {
  return values[index] ?? "";
}

function keyOf(lesson: string, screen: string): string {
  return `${lesson.trim()}|${screen.trim()}`;
}

function quote(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function serialize(rows: readonly Row[]): string {
  return `${rows.map((row) => row.map(quote).join(",")).join("\r\n")}\r\n`;
}

function loadSheets(): Row[][] {
  const sheets = readWorkbookSheets(readFileSync(WORKBOOK_PATH));
  return SHEETS.map((name) => {
    const sheet = sheets.find((entry) => entry.name === name);
    if (!sheet) throw new Error(`Missing sheet ${name}.`);
    const header = sheet.rows[0]?.values ?? [];
    const imageCol = header.findIndex(
      (item) => /image$/i.test(item.trim()) && !/name$/i.test(item.trim()),
    );
    if (imageCol !== 5) throw new Error(`${name} picture column is not F.`);
    const rows = sheet.rows.slice(1).map((entry) => [...entry.values]);
    if (rows.length !== 110) throw new Error(`${name} has ${rows.length} rows, expected 110.`);
    return rows;
  });
}

function assertAligned(sheets: readonly Row[][]): void {
  for (let index = 0; index < 110; index += 1) {
    const keys = sheets.map((rows) =>
      [cell(rows[index] ?? [], 1), cell(rows[index] ?? [], 2), cell(rows[index] ?? [], 3)].join("|"),
    );
    if (new Set(keys).size !== 1) {
      throw new Error(`Row ${index + 2} is not the same screen in every cohort.`);
    }
  }
}

function columnIndex(header: readonly string[], name: string): number {
  const index = header.findIndex((item) => item.trim() === name);
  if (index < 0) throw new Error(`Screens1.csv is missing ${name}.`);
  return index;
}

type Compared = {
  diffs: { row: number; cohort: string; csv: string; workbook: string }[];
  oldNames: string[];
};

function compare(csvRows: readonly Row[], sheets: readonly Row[][]): Compared {
  const header = csvRows[0] ?? [];
  const lessonCol = columnIndex(header, "Lesson Number");
  const screenCol = columnIndex(header, "Screen");
  const imageCols = IMAGE_HEADERS.map((name) => columnIndex(header, name));
  const byKey = new Map<string, Row>();
  const beats: Row[] = [];
  for (const row of csvRows.slice(1)) {
    const lesson = cell(row, lessonCol).trim();
    if (lesson.toLowerCase() === "scenario beat") {
      beats.push(row);
      continue;
    }
    byKey.set(keyOf(lesson, cell(row, screenCol)), row);
  }

  const diffs: Compared["diffs"] = [];
  let beatIndex = 0;
  for (let index = 0; index < 110; index += 1) {
    const lesson = cell(sheets[0]?.[index] ?? [], 1).trim();
    const screen = cell(sheets[0]?.[index] ?? [], 2).trim();
    const csvRow =
      lesson.toLowerCase() === "scenario beat" ? beats[beatIndex++] : byKey.get(keyOf(lesson, screen));
    for (let cohort = 0; cohort < 3; cohort += 1) {
      const workbook = cell(sheets[cohort]?.[index] ?? [], 5).trim();
      const csv = cell(csvRow ?? [], imageCols[cohort] ?? -1).trim();
      if (csv !== workbook) {
        diffs.push({
          row: index + 2,
          cohort: SHEETS[cohort] ?? "",
          csv,
          workbook,
        });
      }
    }
  }
  if (beatIndex !== beats.length) {
    diffs.push({
      row: 0,
      cohort: "scenario beats",
      csv: String(beats.length),
      workbook: String(beatIndex),
    });
  }

  // These portraits are not in the master. lars-thinking and holly-thinking stay
  // where column F still names them (lesson 5 screen 3).
  const stale = ["aiden-thinking-512", "aiden-sitting-512", "lars-sitting-512", "holly-sitting-512"];
  const blob = csvRows.map((row) => imageCols.map((index) => cell(row, index)).join("\n")).join("\n");
  const oldNames = stale.filter((name) => blob.includes(name));
  return { diffs, oldNames };
}

function blankRow(width: number): Row {
  return Array.from({ length: width }, () => "");
}

function sync(): Row[] {
  const sheets = loadSheets();
  assertAligned(sheets);
  const csvRows = parseCsv(readFileSync(CSV_PATH, "utf8")).map((row) => [...row]);
  const header = csvRows[0];
  if (!header) throw new Error("Screens1.csv has no header.");
  const width = header.length;
  const lessonCol = columnIndex(header, "Lesson Number");
  const screenCol = columnIndex(header, "Screen");
  const gameCol = columnIndex(header, "Game Type");
  const textCols = [
    columnIndex(header, "Explorer Text"),
    columnIndex(header, "Pathfinder Text"),
    columnIndex(header, "Maverick Text"),
  ];
  const imageCols = IMAGE_HEADERS.map((name) => columnIndex(header, name));
  const settingsCols = [
    columnIndex(header, "Explorer Settings"),
    columnIndex(header, "Game Settings"),
    columnIndex(header, "Maverick Settings"),
  ];
  const errorCols = [
    columnIndex(header, "Error Explorer"),
    columnIndex(header, "Error Pathfinder"),
    columnIndex(header, "Error Maverick"),
  ];
  const notesCol = columnIndex(header, "Notes");
  const moduleCol = columnIndex(header, "Module Number");

  const byKey = new Map<string, Row>();
  const beats: Row[] = [];
  for (const row of csvRows.slice(1)) {
    while (row.length < width) row.push("");
    const lesson = cell(row, lessonCol).trim();
    if (lesson.toLowerCase() === "scenario beat") {
      beats.push(row);
      continue;
    }
    const key = keyOf(lesson, cell(row, screenCol));
    if (byKey.has(key)) throw new Error(`Duplicate Screens1 row ${key}.`);
    byKey.set(key, row);
  }

  const workbookBeats: number[] = [];
  for (let index = 0; index < 110; index += 1) {
    const lesson = cell(sheets[0]?.[index] ?? [], 1).trim();
    const screen = cell(sheets[0]?.[index] ?? [], 2).trim();
    if (lesson.toLowerCase() === "scenario beat") {
      workbookBeats.push(index);
      continue;
    }
    const key = keyOf(lesson, screen);
    let row = byKey.get(key);
    if (!row) {
      row = blankRow(width);
      row[moduleCol] = "1";
      row[lessonCol] = lesson;
      row[screenCol] = screen;
      row[gameCol] = cell(sheets[0]?.[index] ?? [], 3).trim();
      for (let cohort = 0; cohort < 3; cohort += 1) {
        const source = sheets[cohort]?.[index] ?? [];
        row[textCols[cohort] ?? 0] = cell(source, 4);
        row[settingsCols[cohort] ?? 0] = cell(source, 6);
        row[errorCols[cohort] ?? 0] = cell(source, 7);
      }
      row[notesCol] = cell(sheets[0]?.[index] ?? [], 8);
      byKey.set(key, row);
      csvRows.push(row);
    }
    for (let cohort = 0; cohort < 3; cohort += 1) {
      row[imageCols[cohort] ?? 0] = cell(sheets[cohort]?.[index] ?? [], 5).trim();
    }
    // 7-games is new in the master. The CSV's GO links do not name it, so a
    // game type would add an unreachable lesson 8 screen. The picture stays.
    if (screen === "7-games") row[gameCol] = "";
  }

  if (beats.length !== 0 && beats.length !== workbookBeats.length) {
    throw new Error(`Scenario beat rows are ${beats.length}, workbook has ${workbookBeats.length}.`);
  }
  workbookBeats.forEach((sheetIndex, beatNumber) => {
    let row = beats[beatNumber];
    if (!row) {
      row = blankRow(width);
      row[moduleCol] = "1";
      row[lessonCol] = "Scenario Beat";
      row[screenCol] = "";
      row[gameCol] = "";
      for (let cohort = 0; cohort < 3; cohort += 1) {
        const source = sheets[cohort]?.[sheetIndex] ?? [];
        row[textCols[cohort] ?? 0] = cell(source, 4);
        row[settingsCols[cohort] ?? 0] = cell(source, 6);
        row[errorCols[cohort] ?? 0] = cell(source, 7);
      }
      row[notesCol] = cell(sheets[0]?.[sheetIndex] ?? [], 8);
      csvRows.push(row);
    }
    for (let cohort = 0; cohort < 3; cohort += 1) {
      row[imageCols[cohort] ?? 0] = cell(sheets[cohort]?.[sheetIndex] ?? [], 5).trim();
    }
  });

  return csvRows;
}

const checkOnly = process.argv.includes("--check");
const sheets = loadSheets();
assertAligned(sheets);
if (!checkOnly) {
  const before = parseCsv(readFileSync(CSV_PATH, "utf8")).map((row) => [...row]);
  const next = sync();
  const header = before[0] ?? [];
  const imageCols = new Set(IMAGE_HEADERS.map((name) => columnIndex(header, name)));
  const lessonCol = columnIndex(header, "Lesson Number");
  const screenCol = columnIndex(header, "Screen");
  const gameCol = columnIndex(header, "Game Type");
  const beforeByKey = new Map<string, Row>();
  for (const row of before.slice(1)) {
    const lesson = cell(row, lessonCol).trim();
    if (lesson.toLowerCase() === "scenario beat") continue;
    beforeByKey.set(keyOf(lesson, cell(row, screenCol)), row);
  }
  for (const row of next.slice(1)) {
    const lesson = cell(row, lessonCol).trim();
    if (lesson.toLowerCase() === "scenario beat") continue;
    const prior = beforeByKey.get(keyOf(lesson, cell(row, screenCol)));
    if (!prior) continue;
    prior.forEach((value, index) => {
      if (imageCols.has(index)) return;
      if (cell(row, screenCol) === "7-games" && index === gameCol) return;
      if ((row[index] ?? "") !== value) {
        throw new Error(`Non-image column changed on ${lesson} screen ${cell(row, screenCol)} column ${index}.`);
      }
    });
  }
  writeFileSync(CSV_PATH, serialize(next));
}

const after = parseCsv(readFileSync(CSV_PATH, "utf8"));
const { diffs, oldNames } = compare(after, sheets);
console.log(`diff_count ${diffs.length}`);
for (const diff of diffs.slice(0, 20)) {
  console.log(`row ${diff.row} ${diff.cohort}: csv=${diff.csv || "(blank)"} workbook=${diff.workbook || "(blank)"}`);
}
console.log(`old_names ${oldNames.length === 0 ? "none" : oldNames.join(",")}`);
if (diffs.length !== 0 || oldNames.length !== 0) process.exit(1);
