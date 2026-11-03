import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/keys";
import { launchpadContentHash } from "@/lib/launchpad/content/content-hash";
import { LAUNCHPAD_VENTURE_ID_RE } from "@/lib/launchpad/content/check-payload";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";

/** Next data-cache tag for database reads. */
export const LAUNCHPAD_CONTENT_CACHE_TAG = "launchpad-content";
/** Safety net for a missed revalidate. Seconds. Same as Academy. */
export const LAUNCHPAD_CONTENT_REVALIDATE_SECONDS = 300;

export type LaunchpadVersionSelector = { kind: "current" } | { kind: "draft"; id: string | "latest" };

/** One stored version, before validation. */
export type LaunchpadVersionRow = { id: string; contentHash: string; payload: unknown };

/**
 * Where venture content comes from. The loader treats every source the same:
 * read, validate, cache the last good copy, log every fallback.
 */
export type LaunchpadContentSource = {
  name: "db" | "seed";
  read: (ventureId: string, selector: LaunchpadVersionSelector) => Promise<LaunchpadVersionRow | null>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVersionId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Bundled seed. TEST-ONLY: it serves the same test venture for every venture
 * id (as the old structure file did). Drafts are ignored. The id is a fixed
 * label, not a database id.
 */
export const seedContentSource: LaunchpadContentSource = {
  name: "seed",
  async read(ventureId) {
    const payload = launchpadTestVentureSeed(ventureId);
    return { id: "seed", contentHash: launchpadContentHash(payload), payload };
  },
};

/**
 * launchpad_venture_current + launchpad_venture_versions over Supabase REST
 * with the anon key (read-only RLS). Two reads, pointer then version by id,
 * the same as Academy's current read.
 */
export const dbContentSource: LaunchpadContentSource = {
  name: "db",
  async read(ventureId, selector) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    if (!url || !key) throw new Error("Supabase is not configured.");
    if (!LAUNCHPAD_VENTURE_ID_RE.test(ventureId)) throw new Error("Venture id is malformed.");
    const venture = encodeURIComponent(ventureId);
    const columns = "id,content_hash,payload";
    let rows: Array<Record<string, unknown>>;
    if (selector.kind === "current") {
      const pointers = await restGet(url, key, `launchpad_venture_current?venture_id=eq.${venture}&select=version_id`, "cached");
      const versionId = pointers[0]?.version_id;
      if (!isVersionId(versionId)) return null;
      rows = await restGet(
        url,
        key,
        `launchpad_venture_versions?id=eq.${versionId}&venture_id=eq.${venture}&select=${columns}`,
        "cached",
      );
    } else {
      const filter =
        selector.id === "latest"
          ? `venture_id=eq.${venture}&order=created_at.desc&limit=1`
          : `id=eq.${selector.id}&venture_id=eq.${venture}`;
      rows = await restGet(url, key, `launchpad_venture_versions?${filter}&select=${columns}`, "fresh");
    }
    const row = rows[0];
    if (!row) return null;
    if (!isVersionId(row.id) || typeof row.content_hash !== "string") throw new Error("Version row is malformed.");
    return { id: row.id, contentHash: row.content_hash, payload: row.payload };
  },
};

async function restGet(
  url: string,
  key: string,
  query: string,
  mode: "cached" | "fresh",
): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    ...(mode === "cached"
      ? { next: { revalidate: LAUNCHPAD_CONTENT_REVALIDATE_SECONDS, tags: [LAUNCHPAD_CONTENT_CACHE_TAG] } }
      : { cache: "no-store" as const }),
  });
  if (!response.ok) throw new Error(`Venture read failed (${response.status}).`);
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error("Venture read returned no rows array.");
  return body.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
}
