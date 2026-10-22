"use server";

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LeaderboardPlayer = {
  username: string;
  coinsEarned: number;
};

/**
 * Real players who opted in. A missing table or function returns an empty
 * board so the page still loads.
 */
export async function loadOptedInLeaderboard(): Promise<LeaderboardPlayer[]> {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return [];

    const admin = createAdminClient();
    const { data: selfPref, error: prefError } = await admin
      .from("leaderboard_prefs")
      .select("enabled")
      .eq("profile_id", userId)
      .maybeSingle();
    if (prefError) return [];

    let allowed = selfPref?.enabled === true;
    if (!allowed) {
      const { data: profile } = await admin
        .from("profiles")
        .select("teacher_id")
        .eq("id", userId)
        .maybeSingle();
      const teacherId = profile?.teacher_id as string | null | undefined;
      if (teacherId) {
        const { data: classPref } = await admin
          .from("leaderboard_prefs")
          .select("enabled")
          .eq("profile_id", teacherId)
          .maybeSingle();
        allowed = classPref?.enabled === true;
      }
    }
    if (!allowed) return [];

    const { data: prefs, error: listError } = await admin
      .from("leaderboard_prefs")
      .select("profile_id")
      .eq("enabled", true);
    if (listError || !prefs?.length) return [];

    const ids = prefs
      .map((row) => (typeof row.profile_id === "string" ? row.profile_id : ""))
      .filter(Boolean);
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username, account_role, account_status")
      .in("id", ids);
    const visible = (profiles ?? []).filter(
      (row) =>
        row.account_role === "child" &&
        row.account_status === "active" &&
        typeof row.username === "string" &&
        row.username.trim(),
    );
    if (visible.length === 0) return [];

    const { data: progressRows } = await admin
      .from("learner_progress")
      .select("user_id, payload")
      .in(
        "user_id",
        visible.map((row) => row.id),
      );
    const coinsByUser = new Map<string, number>();
    for (const row of progressRows ?? []) {
      const wallet = (row.payload as { wallet?: { lifetimePointsEarned?: unknown } } | null)
        ?.wallet;
      const raw = wallet?.lifetimePointsEarned;
      const coins =
        typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
      coinsByUser.set(String(row.user_id), coins);
    }

    return visible
      .map((row) => ({
        username: String(row.username).trim(),
        coinsEarned: coinsByUser.get(row.id) ?? 0,
      }))
      .sort((left, right) => {
        if (right.coinsEarned !== left.coinsEarned) return right.coinsEarned - left.coinsEarned;
        return left.username.localeCompare(right.username);
      });
  } catch {
    return [];
  }
}
