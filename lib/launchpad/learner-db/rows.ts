import type { LaunchpadAnswer, LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { isVersionId } from "@/lib/launchpad/content/content-sources";
import type { LaunchpadFloor, LaunchpadTaskScreen } from "@/lib/launchpad/content/types";
import { currentLevel, isSilverDone, type VentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-progress";

/** App answer key to the Level 1 column value. Keys absent here cannot be stored yet. */
const APP_TO_DB: Readonly<Record<string, string>> = {
  "l1-offer": "business_offer",
  "l1-why": "my_why",
  "l1-cause": "my_cause",
  "l1-goal-be-my-own-boss": "goal_be_my_own_boss",
  "l1-goal-support-a-cause": "goal_support_cause",
  "l1-goal-other": "goal_other",
};

const DB_TO_APP: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(APP_TO_DB).map(([app, db]) => [db, app]),
);

const SILVER_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ID_RE = /^[a-z0-9][a-z0-9-]{0,95}$/;

export type LearnerVentureWrite = {
  user_id: string;
  venture_id: string;
  content_version_id: string | null;
  current_level?: number;
  current_silver_id?: string | null;
  onboarding_seen_at?: string | null;
};

export type LearnerAnswerWrite = {
  learner_venture_id: string;
  user_id: string;
  task_id: string;
  bronze_id: string;
  answer_key: string;
  answer: Record<string, unknown>;
  status: "locked" | "available" | "open" | "done";
  draft: Record<string, unknown> | null;
  draft_page: number | null;
  opened_at: string | null;
  completed_at: string | null;
};

export type StoredAnswerRow = {
  answer_key: string;
  answer: Record<string, unknown>;
  status: string;
  updated_at: string;
  completed_at: string | null;
};

function whole(value: unknown, lo: number, hi: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < lo || value > hi) return null;
  return value;
}

function unit(value: unknown): "weeks" | "months" | null {
  return value === "weeks" || value === "months" ? value : null;
}

function idList(value: readonly string[], lo: number, hi: number): string[] | null {
  if (value.length < lo || value.length > hi) return null;
  if (new Set(value).size !== value.length) return null;
  if (value.some((item) => typeof item !== "string" || item.length === 0)) return null;
  return [...value];
}

/** Map one saved answer onto a Level 1 `answer` object, or null when a field would be dropped. */
export function toStoredAnswer(appKey: string, answer: LaunchpadAnswer): Record<string, unknown> | null {
  const dbKey = APP_TO_DB[appKey];
  if (!dbKey) return null;
  if (answer.kind === "selection" && answer.version === 1) {
    if (dbKey === "business_offer") {
      const selected = idList(answer.selected, 0, 5);
      return selected ? { selected_options: selected } : null;
    }
    if (dbKey === "my_cause" && answer.selected.length === 1) return { cause_area: answer.selected[0] };
    if (dbKey === "goal_be_my_own_boss" && answer.selected.length === 1) return { top_reason: answer.selected[0] };
    return null;
  }
  if (answer.kind === "ranking" && answer.version === 1 && dbKey === "my_why") {
    const ranking = idList(answer.order, 0, 5);
    const notApplicable = idList(answer.notApplicable, 0, 5);
    if (!ranking || !notApplicable) return null;
    return { ranking, not_applicable: notApplicable };
  }
  if (answer.kind !== "fields" || answer.version !== 1) return null;
  const values = answer.values;
  if (dbKey === "goal_support_cause") {
    if (Object.keys(values).some((key) => key !== "donatePercent")) return null;
    const percent = whole(values.donatePercent, 1, 100);
    return percent === null ? null : { donate_percent: percent };
  }
  if (dbKey === "goal_other") {
    const allowed = new Set(["goalText", "timeframeNumber", "timeframeUnit"]);
    if (Object.keys(values).some((key) => !allowed.has(key))) return null;
    const text = typeof values.goalText === "string" ? values.goalText : "";
    if (text.length > 120) return null;
    const out: Record<string, unknown> = {};
    if (text.trim()) out.goal_text = text;
    if (values.timeframeNumber !== undefined) {
      const number = whole(values.timeframeNumber, 1, 99);
      const timeframe = unit(values.timeframeUnit);
      if (number === null || !timeframe) return null;
      out.timeframe_number = number;
      out.timeframe_unit = timeframe;
    }
    return out;
  }
  return null;
}

export function fromStoredAnswer(dbKey: string, answer: Record<string, unknown>): LaunchpadAnswer | null {
  const appKey = DB_TO_APP[dbKey];
  if (!appKey) return null;
  if (dbKey === "business_offer" && Array.isArray(answer.selected_options)) {
    return { kind: "selection", version: 1, selected: answer.selected_options.filter((item): item is string => typeof item === "string") };
  }
  if (dbKey === "my_why" && Array.isArray(answer.ranking)) {
    const order = answer.ranking.filter((item): item is string => typeof item === "string");
    const notApplicable = Array.isArray(answer.not_applicable)
      ? answer.not_applicable.filter((item): item is string => typeof item === "string")
      : [];
    return { kind: "ranking", version: 1, order, notApplicable };
  }
  if ((dbKey === "my_cause" || dbKey === "goal_be_my_own_boss") && typeof (answer.cause_area ?? answer.top_reason) === "string") {
    const selected = String(answer.cause_area ?? answer.top_reason);
    return { kind: "selection", version: 1, selected: [selected] };
  }
  if (dbKey === "goal_support_cause" && typeof answer.donate_percent === "number") {
    return { kind: "fields", version: 1, values: { donatePercent: answer.donate_percent } };
  }
  if (dbKey === "goal_other") {
    const values: Record<string, string | number> = {};
    if (typeof answer.goal_text === "string") values.goalText = answer.goal_text;
    if (typeof answer.timeframe_number === "number") values.timeframeNumber = answer.timeframe_number;
    if (answer.timeframe_unit === "weeks" || answer.timeframe_unit === "months") values.timeframeUnit = answer.timeframe_unit;
    return { kind: "fields", version: 1, values };
  }
  return null;
}

function answerKeysOn(screen: LaunchpadTaskScreen): string[] {
  const keys: string[] = [];
  if ("answerKey" in screen && typeof screen.answerKey === "string") keys.push(screen.answerKey);
  if (screen.type === "goal-loop") {
    for (const goal of screen.goals) {
      if (typeof goal.screen.answerKey === "string") keys.push(goal.screen.answerKey);
    }
  }
  return keys;
}

export function locateAnswerTask(
  floors: readonly LaunchpadFloor[],
  appKey: string,
): { taskId: string; bronzeId: string } | null {
  for (const floor of floors) {
    for (const silver of floor.silvers) {
      for (const bronze of silver.bronzes) {
        if (!ID_RE.test(bronze.id)) continue;
        for (const task of bronze.tasks) {
          if (!ID_RE.test(task.id)) continue;
          if (task.screens.some((screen) => answerKeysOn(screen).includes(appKey))) {
            return { taskId: task.id, bronzeId: bronze.id };
          }
        }
      }
    }
  }
  return null;
}

function doneEnough(dbKey: string, answer: Record<string, unknown>): boolean {
  if (dbKey === "business_offer") return Array.isArray(answer.selected_options) && answer.selected_options.length >= 1;
  if (dbKey === "my_why") return Array.isArray(answer.ranking) && answer.ranking.length === 5;
  if (dbKey === "my_cause") return typeof answer.cause_area === "string" && answer.cause_area.length > 0;
  if (dbKey === "goal_be_my_own_boss") return typeof answer.top_reason === "string" && answer.top_reason.length > 0;
  if (dbKey === "goal_other") return true;
  if (dbKey === "goal_support_cause") return typeof answer.donate_percent === "number";
  return false;
}

export function ventureRowForSave(input: {
  userId: string;
  ventureId: string;
  versionId: string | null;
  progress: VentureTestProgress;
  floors: readonly LaunchpadFloor[];
  onboardingSeen: boolean;
  seenAt: string;
}): LearnerVentureWrite {
  const level = input.floors.length ? currentLevel(input.progress, input.floors) : 1;
  const floor = input.floors.find((item) => item.level === level);
  const silver = floor?.silvers.find((item) => !isSilverDone(input.progress, item)) ?? floor?.silvers.at(-1);
  const row: LearnerVentureWrite = {
    user_id: input.userId,
    venture_id: input.ventureId,
    content_version_id: input.versionId && isVersionId(input.versionId) ? input.versionId : null,
  };
  if (level >= 1 && level <= 6) row.current_level = level;
  if (silver && SILVER_RE.test(silver.id) && level >= 1 && level <= 6) row.current_silver_id = silver.id;
  if (input.onboardingSeen) row.onboarding_seen_at = input.seenAt;
  return row;
}

export function answerRowsForSave(input: {
  userId: string;
  learnerVentureId: string;
  progress: VentureTestProgress;
  floors: readonly LaunchpadFloor[];
  completedAt: string;
}): LearnerAnswerWrite[] {
  const answers: LaunchpadAnswers = input.progress.answers ?? {};
  const rows: LearnerAnswerWrite[] = [];
  for (const [appKey, answer] of Object.entries(answers)) {
    const dbKey = APP_TO_DB[appKey];
    const stored = dbKey ? toStoredAnswer(appKey, answer) : null;
    const where = stored ? locateAnswerTask(input.floors, appKey) : null;
    if (!dbKey || !stored || !where) continue;
    const taskDone = input.progress.completedTaskIds.includes(where.taskId);
    const open = input.progress.tasks?.[where.taskId]?.status === "open";
    const status = taskDone && doneEnough(dbKey, stored) ? "done" : open ? "open" : "available";
    rows.push({
      learner_venture_id: input.learnerVentureId,
      user_id: input.userId,
      task_id: where.taskId,
      bronze_id: where.bronzeId,
      answer_key: dbKey,
      answer: stored,
      status,
      draft: null,
      draft_page: open ? (input.progress.tasks?.[where.taskId]?.draftPage ?? null) : null,
      opened_at: input.progress.tasks?.[where.taskId]?.openedAt ?? null,
      completed_at: status === "done" ? input.completedAt : null,
    });
  }
  return rows;
}

export function answersFromStoredRows(rows: readonly StoredAnswerRow[]): {
  answers: LaunchpadAnswers;
  answerUpdatedAt: Record<string, string>;
} {
  const answers: Record<string, LaunchpadAnswer> = {};
  const answerUpdatedAt: Record<string, string> = {};
  for (const row of rows) {
    const appKey = DB_TO_APP[row.answer_key];
    const answer = appKey ? fromStoredAnswer(row.answer_key, row.answer) : null;
    if (!appKey || !answer) continue;
    answers[appKey] = answer;
    if (row.updated_at) answerUpdatedAt[appKey] = row.updated_at;
  }
  return { answers, answerUpdatedAt };
}
