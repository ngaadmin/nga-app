import { createHash } from "node:crypto";

/** JSON with object keys sorted, so the same content always hashes the same. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

/** sha256 of the canonical payload. Unique per venture in launchpad_venture_versions. */
export function launchpadContentHash(payload: unknown): string {
  return createHash("sha256").update(canonicalJson(payload)).digest("hex");
}
