/**
 * Launchpad venture content from the database.
 * Same env shape as Academy's ACADEMY_MASTER_PAYLOAD flag, with one
 * difference: it is OFF unless explicitly on, previews included, because
 * the launchpad_venture_* tables are not applied yet and previews share the
 * production database. With the flag off the loader reads the bundled seed
 * through the same code path.
 */
export function launchpadContentDbEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const explicit = env.LAUNCHPAD_CONTENT_DB ?? env.NEXT_PUBLIC_LAUNCHPAD_CONTENT_DB;
  return explicit === "1" || explicit === "true";
}
