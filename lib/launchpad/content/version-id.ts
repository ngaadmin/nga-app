const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when value is a launchpad_venture_versions id.
 * Client-safe: the content hash lives in content-hash.ts and uses node:crypto.
 */
export function isVersionId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
