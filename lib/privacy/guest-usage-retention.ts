/**
 * Guest activity retention.
 *
 * insertGuestUsageRow writes a usage_events row only when no profile has that
 * username. profiles.username is citext, so the lookup ignores letter case.
 * usage_events has no user id. A row belongs to a real account when any profile
 * username matches, ignoring case. Every other row is a guest row.
 *
 * The nightly cron deletes guest rows older than 30 days in one statement,
 * purge_guest_usage_events(). This function is that same rule.
 */

export const GUEST_USAGE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** RPC the privacy cron calls. Defined in the guest-usage migration. */
export const PURGE_GUEST_USAGE_RPC = "purge_guest_usage_events";

export type GuestUsageRow = {
  id: number;
  username: string;
  createdAt: string;
};

export function isRealAccountUsageUsername(
  username: string,
  profileUsernames: readonly (string | null | undefined)[],
): boolean {
  const key = username.toLowerCase();
  for (const profileName of profileUsernames) {
    if (typeof profileName !== "string") continue;
    if (profileName.toLowerCase() === key) return true;
  }
  return false;
}

/**
 * Drops guest rows whose createdAt is strictly before now minus 30 days.
 * Real-account rows stay, at any age. Newer guest rows stay.
 */
export function deleteExpiredGuestUsageRows<T extends GuestUsageRow>(
  rows: readonly T[],
  profileUsernames: readonly (string | null | undefined)[],
  now: Date,
): { kept: T[]; removed: T[] } {
  const cutoff = now.getTime() - GUEST_USAGE_RETENTION_MS;
  const kept: T[] = [];
  const removed: T[] = [];

  for (const row of rows) {
    if (isRealAccountUsageUsername(row.username, profileUsernames)) {
      kept.push(row);
      continue;
    }
    const created = Date.parse(row.createdAt);
    if (Number.isFinite(created) && created < cutoff) {
      removed.push(row);
      continue;
    }
    kept.push(row);
  }

  return { kept, removed };
}
