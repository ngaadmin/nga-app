import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

/**
 * Keys a bucket-sort cell may use. `STEP1:` is not one of them: a reorder
 * belongs on `rank-order` as one `ITEMS:` line per card plus `ORDER:`.
 */
const BUCKET_KEY =
  /^(?:ITEMS|SHORT|LONG|NEED|WANT|YES|NO|SPENT|TOTAL|RUSHING|THINKING)$/;

/** `STEP1:` / `TOTAL:` — a settings key, not a sentence that happens to contain a colon. */
const SETTING_LINE = /^([A-Za-z][A-Za-z0-9 ]{0,40}):\s*(.*)$/;

export type SortGameType = "rank-order" | "bucket-sort";

export type SortAuthoringIssue = {
  lessonNumber: number;
  screenLabel: string;
  cohort: MasteryCohort;
  gameType: SortGameType;
  kind: "no-items" | "unrecognised-line";
  detail: string;
};

export function isUnrecognisedSettingLine(gameType: SortGameType, line: string): boolean {
  const match = SETTING_LINE.exec(line.trim());
  if (!match) return false;
  const key = (match[1] ?? "").replace(/\s+/g, " ").trim().toUpperCase();
  if (gameType === "rank-order") return key !== "ITEMS" && key !== "ORDER";
  return !BUCKET_KEY.test(key);
}

/** Keyed lines the game does not read, plus bucket prose the parser would drop. */
export function unrecognisedSortLines(gameType: SortGameType, raw: string): string[] {
  const found: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (gameType === "bucket-sort" && !SETTING_LINE.test(trimmed)) {
      found.push(trimmed);
      continue;
    }
    if (isUnrecognisedSettingLine(gameType, trimmed)) found.push(trimmed);
  }
  return found;
}

export function sortAuthoringIssues(input: {
  lessonNumber?: number;
  screenLabel: string;
  cohort: MasteryCohort;
  gameType: string;
  raw: string;
  itemCount: number;
}): SortAuthoringIssue[] {
  if (input.gameType !== "rank-order" && input.gameType !== "bucket-sort") return [];
  const gameType: SortGameType = input.gameType;
  const issues: SortAuthoringIssue[] = [];
  const base = {
    lessonNumber: input.lessonNumber ?? 0,
    screenLabel: input.screenLabel,
    cohort: input.cohort,
    gameType,
  };
  if (input.itemCount === 0) {
    issues.push({ ...base, kind: "no-items", detail: "no parsed items" });
  }
  for (const line of unrecognisedSortLines(gameType, input.raw)) {
    issues.push({ ...base, kind: "unrecognised-line", detail: line });
  }
  return issues;
}

/** Throws when a reorder or bucket screen has no items or an unrecognised line. */
export function assertSortAuthoring(issues: readonly SortAuthoringIssue[]): void {
  if (issues.length === 0) return;
  const first = issues[0];
  if (!first) return;
  const details = issues.map((issue) =>
    issue.kind === "no-items" ? "no parsed items" : `unrecognised line "${issue.detail}"`,
  );
  const lesson = first.lessonNumber > 0 ? `Lesson ${first.lessonNumber} ` : "";
  throw new Error(
    `${lesson}screen ${first.screenLabel} (${first.gameType}, ${first.cohort}) cannot ship: ${details.join("; ")}.`,
  );
}
