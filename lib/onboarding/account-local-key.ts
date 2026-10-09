import { readUserSession } from "@/lib/onboarding/guest-session";

/**
 * Stable localStorage bucket for the signed-in or guest profile on this device.
 * Registered accounts use Auth uid so sign-out cannot mix their flags with a guest.
 */
export function currentAccountLocalKey(): string | null {
  const session = readUserSession();
  if (!session) return null;

  if (session.accessMode === "registered") {
    const userId = session.supabaseUserId?.trim();
    if (userId) return `user:${userId}`;
    const username = session.username.trim().toLowerCase();
    return username ? `name:${username}` : null;
  }

  const guestId = session.genericProfileId?.trim();
  if (guestId) return `guest:${guestId}`;
  const username = session.username.trim().toLowerCase();
  return username ? `guest:${username}` : "guest";
}
