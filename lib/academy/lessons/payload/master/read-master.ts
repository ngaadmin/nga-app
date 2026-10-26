import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { ACADEMY_MODULE_TITLES } from "@/lib/dashboard/academy-content";
import type { AcademyLevelId } from "@/lib/dashboard/academy-state";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { STORY_CREDIT } from "@/lib/academy/lessons/story-audio/audio-base";
import { rehomeBetweenLessonBeats } from "@/lib/academy/lessons/payload/explorer-m1/convert-explorer-workbook";
import {
  readWorkbookSheets,
  type WorkbookSheet,
} from "@/lib/academy/lessons/payload/parse-authoring-table";
import type { LessonPayload, PayloadCohortCopy, PayloadScreenRow } from "@/lib/academy/lessons/payload/types";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";
import { resolveAcademyAudioUrl, resolveAcademyImageUrl } from "@/lib/academy/lessons/payload/master/media-url";
import { payloadGameDropsNamedPicture } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";

export const MASTER_WORKBOOK_PATH = path.join(
  process.cwd(),
  "lib/academy/lessons/payload/source/master/module-1-screens.xlsx",
);

const GAME_TYPES = new Set([
  "word-drop",
  "true-false",
  "drag-to-target",
  "savings-goal",
  "binary-choice",
  "multiple-choice",
  "tap-reveal",
  "bucket-sort",
  "spotlight-rounds",
  "rank-order",
  "link-match",
  "allocation-slider",
  "budget-select",
  "hold-to-fill",
  "scenario-beat",
  "completion",
]);

const COHORTS: MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

export type MasterRowIssue = {
  sheet: string;
  row: number;
  reason: string;
};

export type MissingMasterAsset = {
  sheet: string;
  row: number;
  kind: "audio" | "image";
  name: string;
};

export type MasterModule = {
  byCohort: Record<MasteryCohort, LessonPayload[]>;
  missing: MissingMasterAsset[];
  /** Any entry rejects the whole module. The last good publish stays current. */
  issues: MasterRowIssue[];
  contentHash: string;
};

const FOLLOW_LINE = "Are you ready? Let's go!";

function cell(values: readonly string[], index: number): string {
  return (values[index] ?? "").trim();
}

function headerIndex(headers: readonly string[], name: string): number {
  const target = name.trim().toLowerCase();
  return headers.findIndex((header) => header.trim().toLowerCase() === target);
}

function requireHeader(
  issues: MasterRowIssue[],
  sheet: string,
  headers: readonly string[],
  name: string,
): number {
  const index = headerIndex(headers, name);
  if (index < 0) {
    issues.push({ sheet, row: 1, reason: `Missing column "${name}".` });
  }
  return index;
}

function mirror(value: string): PayloadCohortCopy {
  return { explorer: value, pathfinder: value, maverick: value };
}

function sheetFor(sheets: readonly WorkbookSheet[], pattern: RegExp): WorkbookSheet | undefined {
  return sheets.find((sheet) => pattern.test(sheet.name.trim()) && !/^notes\b/i.test(sheet.name.trim()));
}

/** "M1 Explorer". Older workbooks used "Explorer M1"; that name is still accepted. */
function moduleOneTabName(cohort: MasteryCohort): string {
  return `M1 ${cohort.charAt(0).toUpperCase()}${cohort.slice(1)}`;
}

function moduleOneCohortSheet(
  sheets: readonly WorkbookSheet[],
  cohort: MasteryCohort,
): WorkbookSheet | undefined {
  const current = new RegExp(`^M1\\s+${cohort}$`, "i");
  const legacy = new RegExp(`^${cohort}\\s+M1$`, "i");
  return (
    sheets.find((sheet) => current.test(sheet.name.trim())) ??
    sheets.find((sheet) => legacy.test(sheet.name.trim()))
  );
}

function pictureCell(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "not allowed") return "";
  return trimmed;
}

function beatId(fileName: string, row: number): string {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const hashed = stem.match(/^(.*)-[0-9a-f]{8}$/i);
  if (hashed?.[1]) return hashed[1];
  if (stem) return stem;
  return `scenario-beat-${row}`;
}

function splitFollow(text: string): { narrative: string; follow: string } {
  const lines = text.split("\n");
  const last = lines[lines.length - 1]?.trim() ?? "";
  if (last === FOLLOW_LINE && lines.length > 1) {
    return { narrative: lines.slice(0, -1).join("\n").trim(), follow: last };
  }
  return { narrative: text.trim(), follow: "" };
}

function scenarioSettings(input: {
  id: string;
  audioUrl?: string;
  brief: string;
  follow: string;
  credit: boolean;
}): string {
  const lines = [`ID: ${input.id}`];
  if (input.audioUrl) {
    lines.push(`AUDIO: ${input.audioUrl}`, "AUDIO_MS: 0");
  }
  if (input.brief) lines.push(`IMAGE_BRIEF: ${input.brief}`);
  if (input.credit) lines.push(`CREDIT: ${STORY_CREDIT}`);
  if (input.follow) lines.push(`FOLLOW: ${input.follow}`);
  return lines.join("\n");
}

const EMPTY_COHORTS: Record<MasteryCohort, LessonPayload[]> = {
  explorer: [],
  pathfinder: [],
  maverick: [],
};

export function readMasterModule(bytes: Uint8Array): MasterModule {
  return masterModuleFromSheets(readWorkbookSheets(bytes));
}

export function masterModuleFromSheets(sheets: readonly WorkbookSheet[]): MasterModule {
  const issues: MasterRowIssue[] = [];
  const missing: MissingMasterAsset[] = [];
  const byCohort: Record<MasteryCohort, LessonPayload[]> = {
    explorer: [],
    pathfinder: [],
    maverick: [],
  };

  const details = sheetFor(sheets, /^lesson details$/i);
  if (!details) {
    issues.push({ sheet: "Lesson Details", row: 1, reason: "Lesson Details sheet is missing." });
  }
  for (const cohort of COHORTS) {
    const sheet = moduleOneCohortSheet(sheets, cohort);
    if (!sheet) {
      const expected = moduleOneTabName(cohort);
      issues.push({ sheet: expected, row: 1, reason: `No sheet named "${expected}".` });
    }
  }
  if (issues.length > 0 || !details) {
    return { byCohort: EMPTY_COHORTS, missing, issues, contentHash: "" };
  }

  const detailLessons = readLessonDetails(details, issues);
  for (const cohort of COHORTS) {
    const sheet = moduleOneCohortSheet(sheets, cohort);
    if (!sheet) continue;
    byCohort[cohort] = readCohortSheet(sheet, cohort, detailLessons, issues, missing);
  }

  if (issues.length > 0) {
    return { byCohort: EMPTY_COHORTS, missing, issues, contentHash: "" };
  }
  const contentHash = createHash("sha256").update(JSON.stringify(byCohort)).digest("hex");
  return { byCohort, missing, issues, contentHash };
}

type DetailLesson = {
  row: number;
  title: string;
  level: number;
  lead: string;
  support: string;
  skillName: string;
  skillId: string;
};

function readLessonDetails(
  sheet: WorkbookSheet,
  issues: MasterRowIssue[],
): Map<string, DetailLesson> {
  const header = sheet.rows[0]?.values ?? [];
  const cohortCol = requireHeader(issues, sheet.name, header, "Cohort");
  const moduleCol = requireHeader(issues, sheet.name, header, "Module Number");
  const lessonCol = requireHeader(issues, sheet.name, header, "Lesson Number");
  const titleCol = requireHeader(issues, sheet.name, header, "Lesson Title");
  const levelCol = requireHeader(issues, sheet.name, header, "Level");
  const leadCol = requireHeader(issues, sheet.name, header, "Main Character");
  const supportCol = headerIndex(header, "Support Character");
  const skillNameCol = requireHeader(issues, sheet.name, header, "Skill Name");
  const skillIdCol = requireHeader(issues, sheet.name, header, "Skill ID");
  const found = new Map<string, DetailLesson>();
  if (issues.some((issue) => issue.sheet === sheet.name && issue.row === 1)) return found;

  for (const entry of sheet.rows.slice(1)) {
    const cohortName = cell(entry.values, cohortCol).toLowerCase();
    const cohort = COHORTS.find((item) => item === cohortName);
    const lessonNumber = Number(cell(entry.values, lessonCol));
    const moduleNumber = Number(cell(entry.values, moduleCol));
    const title = cell(entry.values, titleCol);
    const lead = cell(entry.values, leadCol);
    const skillName = cell(entry.values, skillNameCol);
    const skillId = cell(entry.values, skillIdCol);
    const level = Number(cell(entry.values, levelCol));
    if (!cohort) {
      issues.push({ sheet: sheet.name, row: entry.row, reason: "Cohort must be Explorer, Pathfinder, or Maverick." });
      continue;
    }
    if (moduleNumber !== 1) {
      issues.push({ sheet: sheet.name, row: entry.row, reason: "Module Number must be 1." });
      continue;
    }
    if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > 9) {
      issues.push({ sheet: sheet.name, row: entry.row, reason: "Lesson Number must be 1 through 9." });
      continue;
    }
    if (!title || !lead) {
      issues.push({
        sheet: sheet.name,
        row: entry.row,
        reason: "Lesson Title and Main Character are required.",
      });
      continue;
    }
    if (skillId && !getSkillRegistryRecord(skillId)) {
      issues.push({ sheet: sheet.name, row: entry.row, reason: `Unknown Skill ID "${skillId}".` });
      continue;
    }
    const key = `${cohort}:${lessonNumber}`;
    if (found.has(key)) {
      issues.push({ sheet: sheet.name, row: entry.row, reason: `Duplicate ${cohort} lesson ${lessonNumber}.` });
      continue;
    }
    found.set(key, {
      row: entry.row,
      title,
      level: Number.isFinite(level) && level > 0 ? level : 1,
      lead,
      support: supportCol >= 0 ? cell(entry.values, supportCol) : "",
      skillName,
      skillId,
    });
  }

  for (const cohort of COHORTS) {
    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      if (!found.has(`${cohort}:${lessonNumber}`)) {
        issues.push({
          sheet: sheet.name,
          row: 1,
          reason: `Missing ${cohort} lesson ${lessonNumber}.`,
        });
      }
    }
  }
  return found;
}

function readCohortSheet(
  sheet: WorkbookSheet,
  cohort: MasteryCohort,
  details: Map<string, DetailLesson>,
  issues: MasterRowIssue[],
  missing: MissingMasterAsset[],
): LessonPayload[] {
  const header = sheet.rows[0]?.values ?? [];
  const moduleCol = requireHeader(issues, sheet.name, header, "Module Number");
  const lessonCol = requireHeader(issues, sheet.name, header, "Lesson Number");
  const screenCol = requireHeader(issues, sheet.name, header, "Screen");
  const gameCol = requireHeader(issues, sheet.name, header, "Game Type");
  const textCol = header.findIndex((item) => item.trim().toLowerCase().endsWith("text"));
  const imageCol = header.findIndex((item) => /image$/i.test(item.trim()) && !/name$/i.test(item.trim()));
  const settingsCol = header.findIndex((item) => item.trim().toLowerCase().endsWith("settings"));
  const errorCol = header.findIndex((item) => item.trim().toLowerCase().startsWith("error"));
  const briefCol = headerIndex(header, "Image Name");
  const audioCol = headerIndex(header, "Audio File Name");
  if (textCol < 0) issues.push({ sheet: sheet.name, row: 1, reason: "Missing a Text column." });
  if (imageCol < 0) issues.push({ sheet: sheet.name, row: 1, reason: "Missing an Image column." });
  if (settingsCol < 0) issues.push({ sheet: sheet.name, row: 1, reason: "Missing a Settings column." });
  if (audioCol < 0) issues.push({ sheet: sheet.name, row: 1, reason: 'Missing column "Audio File Name".' });
  if (issues.some((issue) => issue.sheet === sheet.name)) return [];

  const lessons = new Map<number, PayloadScreenRow[]>();
  let currentLesson = 0;

  for (const entry of sheet.rows.slice(1)) {
    const lessonCell = cell(entry.values, lessonCol);
    const moduleNumber = Number(cell(entry.values, moduleCol));
    if (moduleNumber !== 1) {
      issues.push({ sheet: sheet.name, row: entry.row, reason: "Module Number must be 1." });
      continue;
    }
    const text = cell(entry.values, textCol);
    const imageRaw = cell(entry.values, imageCol);
    const image = pictureCell(imageRaw);
    const audioName = cell(entry.values, audioCol);
    const brief = briefCol >= 0 ? cell(entry.values, briefCol) : "";

    const gameTypeRaw = cell(entry.values, gameCol).toLowerCase();
    const settingsRaw = settingsCol >= 0 ? cell(entry.values, settingsCol) : "";
    if (
      image &&
      !payloadGameDropsNamedPicture(gameTypeRaw, settingsRaw) &&
      !resolveAcademyImageUrl(image)
    ) {
      missing.push({ sheet: sheet.name, row: entry.row, kind: "image", name: image });
    }
    if (audioName && !resolveAcademyAudioUrl(audioName)) {
      missing.push({ sheet: sheet.name, row: entry.row, kind: "audio", name: audioName });
    }

    if (lessonCell.toLowerCase() === "scenario beat") {
      if (!text) {
        issues.push({ sheet: sheet.name, row: entry.row, reason: "Scenario beat has no text." });
        continue;
      }
      const lessonNumber = currentLesson || 1;
      const spoken = splitFollow(text);
      const audioUrl = audioName ? resolveAcademyAudioUrl(audioName) : undefined;
      const imageUrl = image ? resolveAcademyImageUrl(image) : undefined;
      const row: PayloadScreenRow = {
        screenNumber: 0,
        screenLabel: beatId(audioName, entry.row),
        gameType: "scenario-beat",
        text: mirror(spoken.narrative),
        image: mirror(imageUrl ? image : ""),
        settings: mirror(
          scenarioSettings({
            id: beatId(audioName, entry.row),
            audioUrl,
            brief: imageUrl ? brief : "",
            follow: spoken.follow,
            credit: false,
          }),
        ),
        error: mirror(""),
      };
      const screens = lessons.get(lessonNumber) ?? [];
      screens.push(row);
      lessons.set(lessonNumber, screens);
      continue;
    }

    const lessonNumber = Number(lessonCell);
    const gameType = cell(entry.values, gameCol).toLowerCase();
    const screenLabel = cell(entry.values, screenCol);
    if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > 9) {
      issues.push({ sheet: sheet.name, row: entry.row, reason: "Lesson Number must be 1 through 9 or Scenario Beat." });
      continue;
    }
    if (!GAME_TYPES.has(gameType)) {
      issues.push({
        sheet: sheet.name,
        row: entry.row,
        reason: gameType ? `Unknown game type "${gameType}".` : "Game Type is blank.",
      });
      continue;
    }
    if (!screenLabel) {
      issues.push({ sheet: sheet.name, row: entry.row, reason: "Screen is blank." });
      continue;
    }
    currentLesson = lessonNumber;
    const screenNumber = Number.parseInt(screenLabel, 10);
    const screens = lessons.get(lessonNumber) ?? [];
    screens.push({
      screenNumber: Number.isFinite(screenNumber) ? screenNumber : screens.length + 1,
      screenLabel,
      gameType,
      text: mirror(text),
      image: mirror(image && resolveAcademyImageUrl(image) ? image : ""),
      settings: mirror(cell(entry.values, settingsCol)),
      error: mirror(errorCol >= 0 ? cell(entry.values, errorCol) : ""),
    });
    lessons.set(lessonNumber, screens);
  }

  if (issues.some((issue) => issue.sheet === sheet.name)) return [];

  try {
    rehomeBetweenLessonBeats(lessons);
  } catch (error) {
    issues.push({
      sheet: sheet.name,
      row: 1,
      reason: error instanceof Error ? error.message : "Could not place story beats.",
    });
    return [];
  }
  const payloads: LessonPayload[] = [];
  for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
    const meta = details.get(`${cohort}:${lessonNumber}`);
    const screens = creditOpeningBeat(lessons.get(lessonNumber) ?? []);
    if (!meta || screens.length === 0) {
      issues.push({
        sheet: sheet.name,
        row: 1,
        reason: `Lesson ${lessonNumber} has no screens.`,
      });
      continue;
    }
    const moduleName =
      lessonNumber >= 1 && lessonNumber <= 6
        ? ACADEMY_MODULE_TITLES[1 as AcademyLevelId]
        : ACADEMY_MODULE_TITLES[1];
    payloads.push({
      moduleNumber: 1,
      lessonNumber,
      lessonTitle: meta.title,
      moduleName,
      level: meta.level,
      characters: {
        explorer: meta.lead,
        pathfinder: meta.lead,
        maverick: meta.lead,
        support: meta.support,
      },
      skillName: meta.skillName,
      skillId: meta.skillId,
      screens,
    });
  }
  if (issues.some((issue) => issue.sheet === sheet.name)) return [];
  return payloads;
}

function creditOpeningBeat(screens: PayloadScreenRow[]): PayloadScreenRow[] {
  const index = screens.findIndex(
    (screen) =>
      screen.gameType === "scenario-beat" && /(?:^|\n)AUDIO:/.test(screen.settings.explorer),
  );
  if (index < 0) return screens;
  return screens.map((screen, screenIndex) => {
    if (screenIndex !== index) return screen;
    const current = screen.settings.explorer;
    if (current.includes("CREDIT:")) return screen;
    return { ...screen, settings: mirror(`${current}\nCREDIT: ${STORY_CREDIT}`) };
  });
}

let cached: MasterModule | null = null;

export function loadBundledMasterModule(): MasterModule {
  if (cached) return cached;
  cached = readMasterModule(readFileSync(MASTER_WORKBOOK_PATH));
  return cached;
}
