/**
 * Spreadsheet ↔ ScreenConfig mapping constants.
 * Aligns Explorer workbook columns with Design Doc / Lesson Scaffold.
 */

import type { PedagogicalStage } from "@/lib/academy/lessons/types";

/** Explorer workbook column headers (row 1). */
export const EXPLORER_SHEET_COLUMNS = [
  "lessonId",
  "screenNumber",
  "objective",
  "gameArchetype",
  "simpleScreenText",
  "theAction",
  "contentForGame",
  "errorMessage",
] as const;

export type ExplorerSheetColumn = (typeof EXPLORER_SHEET_COLUMNS)[number];

/** One row from Explorer M1 Lessons workbook (after header). */
export type ExplorerSpreadsheetRow = {
  lessonId?: string;
  screenNumber: number;
  objective: string;
  gameArchetype: string;
  simpleScreenText: string;
  theAction: string;
  contentForGame: string;
  errorMessage: string;
};

/** Lesson scaffold row (NGA Academy Lesson Scaffold.xlsx → Lesson Scaffold sheet). */
export type LessonScaffoldRow = {
  moduleNumber: number;
  lessonNumber: number;
  skillHubId: string;
  skillName: string;
  learningArc: string;
  focus: string;
  learningOutcome: string;
  conceptTruth?: string;
  behaviourShift?: string;
  newPossibility?: string;
  ruleEnforcement?: string;
};

/** Map screen index (1–8) to pedagogical stage (Scaffold → Screens sheet). */
export const SCREEN_INDEX_TO_STAGE: Record<number, PedagogicalStage> = {
  1: "hook",
  2: "core",
  3: "core",
  4: "core",
  5: "apply",
  6: "apply",
  7: "reward",
  8: "close",
};

/** Design Doc / workbook game archetype → internal renderer type. */
export const GAME_ARCHETYPE_TO_TYPE: Record<string, string> = {
  "the fill-the-blank drop": "word-drop",
  "fill-the-blank drop": "word-drop",
  "the sentence finisher": "multiple-choice",
  "sentence finisher": "multiple-choice",
  "the flash tap": "tap-reveal",
  "flash tap": "tap-reveal",
  "the sorting game": "bucket-sort",
  "stacked sorting triage": "bucket-sort",
  "the quick choice": "multiple-choice",
  "quick choice": "multiple-choice",
  "the 24-hour freeze": "hold-to-fill",
  "24-hour freeze": "hold-to-fill",
  "the celebration": "narrative-bonus",
  "celebration": "narrative-bonus",
  "milestone splash page": "completion",
  "lesson recap screen": "completion",
  "the fact finder": "true-false",
  "fact finder": "true-false",
  "the pick one / spotlight (3-round challenge)": "spotlight-rounds",
  "pick one / spotlight (3-round challenge)": "spotlight-rounds",
  "the budget balance": "budget-select",
  "budget balance": "budget-select",
  "the allocation slider": "allocation-slider",
  "allocation slider": "allocation-slider",
  "the sequence stack": "rank-order",
  "sequence stack": "rank-order",
  "the link match": "link-match",
  "link match": "link-match",
  "the rank order": "rank-order",
  "rank order": "rank-order",
  "the savings goal": "savings-goal",
  "savings goal": "savings-goal",
  "the drag to target": "drag-to-target",
  "drag to target": "drag-to-target",
  "the reveal tap": "drag-to-target",
  "reveal tap": "drag-to-target",
};

export function normalizeArchetype(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function pedagogicalStageForScreen(screenNumber: number): PedagogicalStage {
  return SCREEN_INDEX_TO_STAGE[screenNumber] ?? "core";
}
