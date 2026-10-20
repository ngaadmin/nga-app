/**
 * Removes activity rows for one username before that username can be registered again.
 * Matching is case-insensitive inside delete_usage_events_for_username.
 */

type UsageDeleteClient = {
  rpc: (
    fn: string,
    args: { target_username: string },
  ) => PromiseLike<{ error: { message?: string } | null }>;
};

export async function deleteUsageEventsForUsername(
  admin: UsageDeleteClient,
  username: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const target = username.trim();
  if (!target || target.includes("@")) return { ok: true };

  const { error } = await admin.rpc("delete_usage_events_for_username", {
    target_username: target,
  });
  if (error) {
    return {
      ok: false,
      error: error.message?.trim() || "Could not delete activity records.",
    };
  }
  return { ok: true };
}
