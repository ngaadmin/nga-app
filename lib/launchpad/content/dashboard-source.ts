import { launchpadContentDbEnabled } from "@/lib/launchpad/content/content-flag";
import {
  dbContentSource,
  type LaunchpadContentSource,
} from "@/lib/launchpad/content/content-sources";
import {
  launchpadContentSourceFor,
  loadLaunchpadVenture,
  type LaunchpadVentureLoad,
} from "@/lib/launchpad/content/fetch-published";

/** A signed-in learner. Parents, teachers, and guests are not learners. */
export function launchpadLearnerRoleAllowed(accountRole: string | null | undefined): boolean {
  return accountRole === "child";
}

/**
 * Production (either Vercel env) must not fall through to the bundled seed.
 * Preview and local keep today's source choice.
 */
export function launchpadProductionRequiresDatabase(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.VERCEL_ENV === "production" || env.NEXT_PUBLIC_VERCEL_ENV === "production";
}

/**
 * Optional pin for the signed-in Launchpad route. Unset means current is fine.
 * A set value must match the version id or the content hash.
 */
export function launchpadPinnedVersionMatches(
  versionId: string,
  contentHash: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const pinned = (env.LAUNCHPAD_PINNED_VERSION_ID ?? "").trim();
  if (!pinned) return true;
  return pinned === versionId || pinned === contentHash;
}

function reject(reason: string): LaunchpadVentureLoad {
  return { ok: false, reason };
}

function acceptPinned(load: LaunchpadVentureLoad, env: Record<string, string | undefined>): LaunchpadVentureLoad {
  if (!load.ok) return load;
  if (launchpadProductionRequiresDatabase(env) && load.source === "seed") {
    return reject("Production does not serve the bundled Launchpad seed.");
  }
  if (!launchpadPinnedVersionMatches(load.versionId, load.contentHash, env)) {
    return reject("Pinned Launchpad version does not match.");
  }
  return load;
}

/**
 * Content for /dashboard/launchpad. The test route does not call this.
 * Production fails closed when the flag is off or the database has nothing
 * to serve. It never reads the bundled seed. Preview uses the same source
 * choice as today (database unless the flag is explicitly off).
 */
export async function loadDashboardLaunchpadVenture(
  ventureId: string,
  env: Record<string, string | undefined> = process.env,
  source?: LaunchpadContentSource,
): Promise<LaunchpadVentureLoad> {
  if (launchpadProductionRequiresDatabase(env)) {
    if (!launchpadContentDbEnabled(env)) {
      return reject("Launchpad content flag is off in production.");
    }
    return acceptPinned(await loadLaunchpadVenture(ventureId, { source: source ?? dbContentSource }), env);
  }
  const chosen = source ?? launchpadContentSourceFor(ventureId, env);
  return acceptPinned(await loadLaunchpadVenture(ventureId, { source: chosen }), env);
}
