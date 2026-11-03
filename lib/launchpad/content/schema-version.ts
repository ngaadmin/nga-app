/** Payload shape version stored in launchpad_venture_versions.payload. Bump on a shape change. */
export const LAUNCHPAD_PAYLOAD_SCHEMA_VERSION = 1;

/**
 * Ventures whose content is read from launchpad_venture_versions when the
 * database flag is on. Empty until the migration is applied and a version is
 * published and promoted. Every other venture reads the bundled seed.
 */
export const LAUNCHPAD_DB_VENTURES: readonly string[] = [];
