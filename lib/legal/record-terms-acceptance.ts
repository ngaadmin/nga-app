import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";
import { termsAcceptanceHistoryRow } from "@/lib/legal/terms-consent";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Records that this profile ticked the Terms box. Uses the existing
 * account_history table, so no new column or migration is needed.
 * Call only after the box was ticked, for the person who ticked it.
 */
export async function recordTermsAcceptance(
  admin: Admin,
  profileId: string,
  acceptedAt: string = new Date().toISOString(),
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin
    .from("account_history")
    .insert(termsAcceptanceHistoryRow({ profileId, acceptedAt }));
  if (error) {
    console.error("[terms-acceptance] could not record acceptance");
    return {
      ok: false,
      error: "We could not save your agreement to the Terms. Please try again.",
    };
  }
  return { ok: true };
}
