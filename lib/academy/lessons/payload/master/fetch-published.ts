import "server-only";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/keys";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { MASTER_PAYLOAD_SCHEMA_VERSION } from "@/lib/academy/lessons/payload/master/schema-version";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

/** Next data-cache tag. Promote calls revalidateTag on it. */
export const ACADEMY_LESSONS_CACHE_TAG = "academy-lessons";
/** Safety net if a promote's revalidate call is missed. Seconds. */
export const ACADEMY_LESSONS_REVALIDATE_SECONDS = 300;

export type MasterLessonTrio = {
  explorer: LessonPayload;
  pathfinder: LessonPayload;
  maverick: LessonPayload;
};

export type MasterLessonLoad =
  | {
      ok: true;
      trio: MasterLessonTrio;
      versionId: string;
      contentHash: string;
      /** academy-media base stored with the version. */
      mediaBase: string;
      source: "current" | "draft" | "stale";
    }
  | { ok: false; reason: string };

type VersionSelector = { kind: "current" } | { kind: "draft"; id: string | "latest" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Last good lesson per module and lesson, kept for a database outage. */
const lastGood = new Map<string, Extract<MasterLessonLoad, { ok: true }>>();

export function academyLessonLog(
  event: "academy_lesson_fetch_failed" | "academy_lesson_served_stale" | "academy_lesson_error_screen" | "academy_lesson_draft_served",
  detail: Record<string, unknown>,
): void {
  // First-party server log line. Vercel runtime logs keep it. No user data.
  console.warn(JSON.stringify({ event, ...detail }));
}

/**
 * Draft override, honored only on a Vercel preview deployment at runtime.
 * `?draft=<version id>` or `?draft=latest` wins over ACADEMY_PREVIEW_VERSION_ID.
 * A production build or deployment never reads a draft.
 */
export function previewDraftSelector(
  requested: string | undefined,
  env: Record<string, string | undefined> = process.env,
): VersionSelector {
  if (env.VERCEL_ENV !== "preview") return { kind: "current" };
  const value = (requested ?? env.ACADEMY_PREVIEW_VERSION_ID ?? "").trim();
  if (value === "latest") return { kind: "draft", id: "latest" };
  if (UUID_RE.test(value)) return { kind: "draft", id: value };
  return { kind: "current" };
}

/**
 * One lesson for all three cohorts.
 * Order: the version asked for, then the last good copy this server fetched,
 * then `{ ok: false }` so the page shows the error screen. Every fallback logs.
 * There is no bundled-workbook fallback.
 */
export async function loadMasterLessonTrio(
  moduleNumber: number,
  lessonNumber: number,
  options: { draft?: string } = {},
): Promise<MasterLessonLoad> {
  const key = `${moduleNumber}:${lessonNumber}`;
  const selector = previewDraftSelector(options.draft);
  let fetched: MasterLessonLoad;
  try {
    fetched = await fetchLessonTrio(moduleNumber, lessonNumber, selector);
  } catch (error) {
    fetched = { ok: false, reason: error instanceof Error ? error.message : "fetch failed" };
  }
  if (!fetched.ok && selector.kind === "draft") {
    academyLessonLog("academy_lesson_fetch_failed", {
      moduleNumber,
      lessonNumber,
      selector: selector.id,
      reason: fetched.reason,
    });
    try {
      fetched = await fetchLessonTrio(moduleNumber, lessonNumber, { kind: "current" });
    } catch (error) {
      fetched = { ok: false, reason: error instanceof Error ? error.message : "fetch failed" };
    }
  }
  if (fetched.ok) {
    if (fetched.source === "current") lastGood.set(key, fetched);
    if (fetched.source === "draft") {
      academyLessonLog("academy_lesson_draft_served", {
        moduleNumber,
        lessonNumber,
        versionId: fetched.versionId,
      });
    }
    return fetched;
  }
  academyLessonLog("academy_lesson_fetch_failed", {
    moduleNumber,
    lessonNumber,
    selector: "current",
    reason: fetched.reason,
  });
  const stale = lastGood.get(key);
  if (stale) {
    academyLessonLog("academy_lesson_served_stale", {
      moduleNumber,
      lessonNumber,
      versionId: stale.versionId,
    });
    return { ...stale, source: "stale" };
  }
  academyLessonLog("academy_lesson_error_screen", { moduleNumber, lessonNumber, reason: fetched.reason });
  return fetched;
}

/** Test hook. */
export function resetAcademyLessonCacheForTests(): void {
  lastGood.clear();
}

function lessonColumns(lessonNumber: number): string {
  const index = lessonNumber - 1;
  return [
    "id",
    "content_hash",
    "schema:payload->schemaVersion",
    "module:payload->moduleNumber",
    "media_base:payload->>mediaBase",
    ...COHORTS.map((cohort) => `${cohort}:payload->${cohort}->${index}`),
  ].join(",");
}

async function fetchLessonTrio(
  moduleNumber: number,
  lessonNumber: number,
  selector: VersionSelector,
): Promise<MasterLessonLoad> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return { ok: false, reason: "Supabase is not configured." };
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > 9) {
    return { ok: false, reason: `Lesson ${lessonNumber} is out of range.` };
  }
  const columns = lessonColumns(lessonNumber);
  let row: Record<string, unknown> | undefined;
  if (selector.kind === "current") {
    const rows = await restGet(
      url,
      key,
      `academy_lesson_current?module_number=eq.${moduleNumber}&select=version:academy_lesson_versions(${columns})`,
      "cached",
    );
    const joined = rows[0]?.version;
    row = (Array.isArray(joined) ? joined[0] : joined) as Record<string, unknown> | undefined;
    if (!row) return { ok: false, reason: `No current version for module ${moduleNumber}.` };
  } else {
    const filter =
      selector.id === "latest"
        ? `module_number=eq.${moduleNumber}&order=created_at.desc&limit=1`
        : `id=eq.${selector.id}&module_number=eq.${moduleNumber}`;
    const rows = await restGet(url, key, `academy_lesson_versions?${filter}&select=${columns}`, "fresh");
    row = rows[0];
    if (!row) return { ok: false, reason: `Draft ${selector.id} not found.` };
  }
  return trioFromRow(row, moduleNumber, lessonNumber, selector.kind === "current" ? "current" : "draft");
}

export function trioFromRow(
  row: Record<string, unknown>,
  moduleNumber: number,
  lessonNumber: number,
  source: "current" | "draft",
): MasterLessonLoad {
  if (row.schema !== MASTER_PAYLOAD_SCHEMA_VERSION) {
    return { ok: false, reason: `Unsupported schemaVersion ${String(row.schema)}.` };
  }
  if (row.module !== moduleNumber) return { ok: false, reason: "Version is for another module." };
  if (typeof row.id !== "string" || typeof row.content_hash !== "string") {
    return { ok: false, reason: "Version row is malformed." };
  }
  if (typeof row.media_base !== "string" || !/^https:\/\//.test(row.media_base)) {
    return { ok: false, reason: "Version has no media base." };
  }
  const trio = {} as MasterLessonTrio;
  for (const cohort of COHORTS) {
    const lesson = row[cohort];
    if (!isLesson(lesson, moduleNumber, lessonNumber)) {
      return { ok: false, reason: `${cohort} lesson ${lessonNumber} is missing or malformed.` };
    }
    trio[cohort] = lesson;
  }
  return {
    ok: true,
    trio,
    versionId: row.id,
    contentHash: row.content_hash,
    mediaBase: row.media_base.replace(/\/+$/, ""),
    source,
  };
}

function isLesson(value: unknown, moduleNumber: number, lessonNumber: number): value is LessonPayload {
  if (!value || typeof value !== "object") return false;
  const lesson = value as LessonPayload;
  return (
    lesson.moduleNumber === moduleNumber &&
    lesson.lessonNumber === lessonNumber &&
    typeof lesson.lessonTitle === "string" &&
    Array.isArray(lesson.screens) &&
    lesson.screens.length > 0
  );
}

async function restGet(
  url: string,
  key: string,
  query: string,
  mode: "cached" | "fresh",
): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(`${url}/rest/v1/${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
    ...(mode === "cached"
      ? { next: { revalidate: ACADEMY_LESSONS_REVALIDATE_SECONDS, tags: [ACADEMY_LESSONS_CACHE_TAG] } }
      : { cache: "no-store" as const }),
  });
  if (!response.ok) throw new Error(`Lesson read failed (${response.status}).`);
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error("Lesson read returned no rows array.");
  return body.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
}
