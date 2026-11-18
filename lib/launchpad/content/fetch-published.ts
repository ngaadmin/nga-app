import "server-only";

import { checkLaunchpadVenturePayload } from "@/lib/launchpad/content/check-payload";
import { launchpadContentDbEnabled } from "@/lib/launchpad/content/content-flag";
import {
  dbContentSource,
  isVersionId,
  seedContentSource,
  type LaunchpadContentSource,
  type LaunchpadVersionSelector,
} from "@/lib/launchpad/content/content-sources";
import { LAUNCHPAD_DB_VENTURES } from "@/lib/launchpad/content/schema-version";
import type { LaunchpadVenturePayload } from "@/lib/launchpad/content/types";

export type LaunchpadVentureLoad =
  | {
      ok: true;
      venture: LaunchpadVenturePayload;
      versionId: string;
      contentHash: string;
      source: "current" | "draft" | "stale" | "seed";
    }
  | { ok: false; reason: string };

/** Last good venture per source and venture id, kept for a database outage. */
const lastGood = new Map<string, Extract<LaunchpadVentureLoad, { ok: true }>>();

export function launchpadContentLog(
  event:
    | "launchpad_venture_fetch_failed"
    | "launchpad_venture_served_stale"
    | "launchpad_venture_error_screen"
    | "launchpad_venture_draft_served",
  detail: Record<string, unknown>,
): void {
  // First-party server log line, same shape as Academy's. No user data.
  console.warn(JSON.stringify({ event, ...detail }));
}

/**
 * Draft override, honored only on a Vercel preview at runtime.
 * `?draft=<version id>` or `?draft=latest` wins over LAUNCHPAD_PREVIEW_VERSION_ID.
 */
export function launchpadDraftSelector(
  requested: string | undefined,
  env: Record<string, string | undefined> = process.env,
): LaunchpadVersionSelector {
  if (env.VERCEL_ENV !== "preview") return { kind: "current" };
  const value = (requested ?? env.LAUNCHPAD_PREVIEW_VERSION_ID ?? "").trim();
  if (value === "latest") return { kind: "draft", id: "latest" };
  if (isVersionId(value)) return { kind: "draft", id: value };
  return { kind: "current" };
}

/** Database when the flag is on and the venture is listed; otherwise the bundled seed. */
export function launchpadContentSourceFor(
  ventureId: string,
  env: Record<string, string | undefined> = process.env,
): LaunchpadContentSource {
  return launchpadContentDbEnabled(env) && LAUNCHPAD_DB_VENTURES.includes(ventureId) ? dbContentSource : seedContentSource;
}

/**
 * One venture's content. Order, as in Academy's loadMasterLessonTrio:
 * the version asked for (a preview draft falls back to current), then the
 * last good copy this server fetched, then `{ ok: false }` so the page shows
 * the error screen. Every fallback logs. The seed is a source, not a fallback:
 * a failed database read never serves the seed.
 */
export async function loadLaunchpadVenture(
  ventureId: string,
  options: { draft?: string; source?: LaunchpadContentSource } = {},
): Promise<LaunchpadVentureLoad> {
  const source = options.source ?? launchpadContentSourceFor(ventureId);
  const key = `${source.name}:${ventureId}`;
  const selector = source.name === "seed" ? ({ kind: "current" } as const) : launchpadDraftSelector(options.draft);
  let fetched = await readVersion(source, ventureId, selector);
  if (!fetched.ok && selector.kind === "draft") {
    launchpadContentLog("launchpad_venture_fetch_failed", { ventureId, selector: selector.id, reason: fetched.reason });
    fetched = await readVersion(source, ventureId, { kind: "current" });
  }
  if (fetched.ok) {
    if (fetched.source === "current" || fetched.source === "seed") lastGood.set(key, fetched);
    if (fetched.source === "draft") {
      launchpadContentLog("launchpad_venture_draft_served", { ventureId, versionId: fetched.versionId });
    }
    return fetched;
  }
  launchpadContentLog("launchpad_venture_fetch_failed", { ventureId, source: source.name, selector: "current", reason: fetched.reason });
  const stale = lastGood.get(key);
  if (stale) {
    launchpadContentLog("launchpad_venture_served_stale", { ventureId, versionId: stale.versionId });
    return { ...stale, source: "stale" };
  }
  launchpadContentLog("launchpad_venture_error_screen", { ventureId, reason: fetched.reason });
  return fetched;
}

/** Test hook. */
export function resetLaunchpadContentCacheForTests(): void {
  lastGood.clear();
}

async function readVersion(
  source: LaunchpadContentSource,
  ventureId: string,
  selector: LaunchpadVersionSelector,
): Promise<LaunchpadVentureLoad> {
  try {
    const row = await source.read(ventureId, selector);
    if (!row) {
      return {
        ok: false,
        reason: selector.kind === "current" ? `No current version for ${ventureId}.` : `Draft ${selector.id} not found.`,
      };
    }
    const check = checkLaunchpadVenturePayload(row.payload, ventureId);
    if (!check.ok) return { ok: false, reason: check.reason };
    return {
      ok: true,
      venture: check.payload,
      versionId: row.id,
      contentHash: row.contentHash,
      source: source.name === "seed" ? "seed" : selector.kind === "current" ? "current" : "draft",
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "fetch failed" };
  }
}
