import "server-only";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/keys";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  loadBundledMasterModule,
  type MasterModule,
} from "@/lib/academy/lessons/payload/master/read-master";

const COHORTS: MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

export type MasterLessonTrio = {
  explorer: LessonPayload;
  pathfinder: LessonPayload;
  maverick: LessonPayload;
};

/**
 * Published module, or the bundled workbook when the table is empty or missing.
 * Returns undefined when the workbook itself fails validation.
 */
export async function loadMasterLessonTrio(
  lessonNumber: number,
): Promise<MasterLessonTrio | undefined> {
  const published = await fetchPublishedMasterModule();
  const source = published?.contentHash ? published : loadBundledMasterModule();
  if (!source.contentHash) return undefined;
  const pick = (cohort: MasteryCohort) =>
    source.byCohort[cohort].find((lesson) => lesson.lessonNumber === lessonNumber);
  const explorer = pick("explorer");
  const pathfinder = pick("pathfinder");
  const maverick = pick("maverick");
  if (!explorer || !pathfinder || !maverick) return undefined;
  return { explorer, pathfinder, maverick };
}

export async function fetchPublishedMasterModule(): Promise<MasterModule | null> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  try {
    const current = await restGet(url, key, "academy_lesson_current?module_number=eq.1&select=version_id");
    const versionId = current?.[0]?.version_id;
    if (typeof versionId !== "string" || !/^[0-9a-f-]{36}$/i.test(versionId)) return null;
    const versions = await restGet(
      url,
      key,
      `academy_lesson_versions?id=eq.${versionId}&select=content_hash,payload`,
    );
    const row = versions?.[0];
    if (!row || typeof row.content_hash !== "string" || !row.payload || typeof row.payload !== "object") {
      return null;
    }
    const payload = row.payload as Record<string, unknown>;
    const byCohort = {
      explorer: lessonList(payload.explorer),
      pathfinder: lessonList(payload.pathfinder),
      maverick: lessonList(payload.maverick),
    };
    if (COHORTS.some((cohort) => byCohort[cohort].length !== 9)) return null;
    return {
      byCohort,
      missing: [],
      issues: [],
      contentHash: row.content_hash,
    };
  } catch {
    return null;
  }
}

async function restGet(
  url: string,
  key: string,
  query: string,
): Promise<Array<Record<string, unknown>> | null> {
  const response = await fetch(`${url}/rest/v1/${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const body: unknown = await response.json();
  if (!Array.isArray(body)) return null;
  return body.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
}

function lessonList(value: unknown): LessonPayload[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (lesson): lesson is LessonPayload =>
      !!lesson &&
      typeof lesson === "object" &&
      typeof (lesson as LessonPayload).lessonNumber === "number" &&
      Array.isArray((lesson as LessonPayload).screens),
  );
}
