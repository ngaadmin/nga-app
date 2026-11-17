/** Payload shape version stored in launchpad_venture_versions.payload. Bump on a shape change. */
export const LAUNCHPAD_PAYLOAD_SCHEMA_VERSION = 4;

/**
 * Versions this app can read. v2 adds the capture templates (context,
 * choice-capture, rank-order, short-text, goal-loop), the workbook-summary
 * wrap-up and the gold completion screen; a v1 payload is a valid v2 one
 * without them, so it still reads. v3 puts Level Up statements and Reflect,
 * Improve, and Grow copy on the level-up screen. A v1 or v2 payload still
 * reads when it has no level-up screen. v4 adds surface, the shared
 * learner-facing strings. Older payloads still read without it.
 */
export const LAUNCHPAD_READABLE_SCHEMA_VERSIONS = [1, 2, 3, 4] as const;
export type LaunchpadReadableSchemaVersion = (typeof LAUNCHPAD_READABLE_SCHEMA_VERSIONS)[number];

/**
 * Ventures read from launchpad_venture_versions when the database flag is on.
 * dog-walking has a published schema 4 version. Every other venture reads the
 * bundled seed. Production keeps that id.
 */
export const LAUNCHPAD_DB_VENTURES: readonly string[] = ["dog-walking"];

/**
 * Preview deployments of this branch read a separate row so publishing the
 * seed inserts dog-walking-r2 and leaves the dog-walking current pointer alone.
 * LAUNCHPAD_VENTURE_ID_RE allows this id.
 */
export const LAUNCHPAD_PREVIEW_DB_VENTURE_ID = "dog-walking-r2";

/** Database venture ids for this environment. Preview does not read dog-walking. */
export function launchpadDbVentureIds(env: Record<string, string | undefined> = process.env): readonly string[] {
  const vercel = env.NEXT_PUBLIC_VERCEL_ENV ?? env.VERCEL_ENV;
  if (vercel === "preview") return [LAUNCHPAD_PREVIEW_DB_VENTURE_ID];
  return LAUNCHPAD_DB_VENTURES;
}

/**
 * The id the test route asks the database for. On preview, dog walking is the
 * r2 row. Production and local keep dog-walking.
 */
export function launchpadServedVentureId(ventureId: string, env: Record<string, string | undefined> = process.env): string {
  const vercel = env.NEXT_PUBLIC_VERCEL_ENV ?? env.VERCEL_ENV;
  if (vercel === "preview" && ventureId === "dog-walking") return LAUNCHPAD_PREVIEW_DB_VENTURE_ID;
  return ventureId;
}
