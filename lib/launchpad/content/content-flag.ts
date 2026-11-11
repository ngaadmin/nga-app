/**
 * Launchpad venture content from the database.
 * Same rule as Academy's master flag. An explicit LAUNCHPAD_CONTENT_DB
 * (or NEXT_PUBLIC_LAUNCHPAD_CONTENT_DB) of 1/true or 0/false wins.
 * Otherwise it is on when VERCEL_ENV or NEXT_PUBLIC_VERCEL_ENV is preview,
 * and off in production and local. Listed ventures then read
 * launchpad_venture_versions. Every other venture stays on the bundled seed.
 */
export function launchpadContentDbEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const explicit = env.LAUNCHPAD_CONTENT_DB ?? env.NEXT_PUBLIC_LAUNCHPAD_CONTENT_DB;
  if (explicit === "1" || explicit === "true") return true;
  if (explicit === "0" || explicit === "false") return false;
  const vercel = env.NEXT_PUBLIC_VERCEL_ENV ?? env.VERCEL_ENV;
  return vercel === "preview";
}
