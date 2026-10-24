import type { AccountProgressPayload } from "@/lib/dashboard/account-progress";

/**
 * A sign-in that already loaded progress passes `remotePayload`, including null.
 * A later sync that omits the key still needs a fetch.
 */
export function suppliedRemoteProgress(
  input: { remotePayload?: AccountProgressPayload | null } | undefined,
): { supplied: boolean; payload: AccountProgressPayload | null } {
  if (!input || !Object.prototype.hasOwnProperty.call(input, "remotePayload")) {
    return { supplied: false, payload: null };
  }
  return { supplied: true, payload: input.remotePayload ?? null };
}
