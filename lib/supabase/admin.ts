import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS and the profiles protect-column trigger.
 * Server-only — never import this from a Client Component.
 *
 * Used to finish signup (set account_status / account_role) because:
 * - Those columns are locked for authenticated clients.
 * - Email confirmation means signUp often has no session yet, so RLS
 *   would also block a user-scoped update.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in the server environment.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
