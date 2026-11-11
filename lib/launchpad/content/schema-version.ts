/** Payload shape version stored in launchpad_venture_versions.payload. Bump on a shape change. */
export const LAUNCHPAD_PAYLOAD_SCHEMA_VERSION = 3;

/**
 * Versions this app can read. v2 adds the capture templates (context,
 * choice-capture, rank-order, short-text, goal-loop), the workbook-summary
 * wrap-up and the gold completion screen; a v1 payload is a valid v2 one
 * without them, so it still reads. v3 puts Level Up statements and Reflect,
 * Improve, and Grow copy on the level-up screen. A v1 or v2 payload still
 * reads when it has no level-up screen.
 */
export const LAUNCHPAD_READABLE_SCHEMA_VERSIONS = [1, 2, 3] as const;
export type LaunchpadReadableSchemaVersion = (typeof LAUNCHPAD_READABLE_SCHEMA_VERSIONS)[number];

/**
 * Ventures whose content is read from launchpad_venture_versions when the
 * database flag is on. Empty until the migration is applied and a version is
 * published and promoted. Every other venture reads the bundled seed.
 */
export const LAUNCHPAD_DB_VENTURES: readonly string[] = [];
