import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  parentApprovalRequestedAt,
  parentApprovalStatus,
} from "@/lib/launchpad/parent-approval/model";
import { LAUNCHPAD_CATEGORIES } from "@/lib/launchpad/venture-test/launchpad-home-data";

/**
 * Server-only helper (not a server action, so the browser can't call it with
 * someone else's ids). The Parent Hub loader passes in the children it has
 * already checked against parent_child.
 */

/** One waiting or answered request, as the Parent Hub shows it. */
export type LaunchpadApprovalItem = {
  learnerId: string;
  childUsername: string;
  ventureId: string;
  ventureName: string;
  requestedAt: string;
  /** pending: waiting. declined: the parent said not now and may change it. */
  status: "pending" | "declined";
};

/** Display name of a live venture, from the Launchpad tiles. */
export function ventureDisplayName(ventureId: string): string | null {
  for (const category of LAUNCHPAD_CATEGORIES) {
    for (const tile of category.tiles) {
      if (tile.kind === "idea" && tile.ventureId === ventureId) return tile.name;
    }
  }
  return null;
}

const VENTURE_NAME_FALLBACK = "business";

/** Requests for already-verified linked learners. Pending first, then not now. */
export async function listLaunchpadApprovals(
  children: readonly { id: string; username: string }[],
): Promise<LaunchpadApprovalItem[]> {
  if (children.length === 0) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("launchpad_learner_ventures")
    .select("user_id, venture_id, wrap_up_confirmed_at")
    .in(
      "user_id",
      children.map((child) => child.id),
    );
  const names = new Map(children.map((child) => [child.id, child.username]));
  const items: LaunchpadApprovalItem[] = [];
  for (const row of (data ?? []) as {
    user_id: string;
    venture_id: string;
    wrap_up_confirmed_at: Record<string, unknown> | null;
  }[]) {
    const status = parentApprovalStatus(row.wrap_up_confirmed_at);
    if (status !== "pending" && status !== "declined") continue;
    const requestedAt = parentApprovalRequestedAt(row.wrap_up_confirmed_at);
    const childUsername = names.get(row.user_id);
    if (!requestedAt || !childUsername) continue;
    items.push({
      learnerId: row.user_id,
      childUsername,
      ventureId: row.venture_id,
      ventureName: ventureDisplayName(row.venture_id) ?? VENTURE_NAME_FALLBACK,
      requestedAt,
      status,
    });
  }
  return items.sort((a, b) =>
    a.status === b.status
      ? a.requestedAt.localeCompare(b.requestedAt)
      : a.status === "pending"
        ? -1
        : 1,
  );
}
