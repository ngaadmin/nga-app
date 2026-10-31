"use server";

import "server-only";

import {
  buildHouseholdProfiles,
  type HouseholdProfileRow,
  type HouseholdProfiles,
} from "@/lib/profile-switcher/household-profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PROFILE_COLUMNS =
  "id, username, account_role, account_status, curriculum_cohort";

/**
 * Profiles in the signed-in user's household, for the top-bar switcher.
 * Reads only. The caller is taken from the Auth session, never from input:
 * a parent sees themselves and their linked children; a child sees their
 * parent and siblings. Usernames, roles and tracks only (no emails).
 */
export async function loadHouseholdProfiles(): Promise<HouseholdProfiles | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = createAdminClient();
    const { data: me } = await admin
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();
    if (!me) return null;

    let parentId: string | null = null;
    if (me.account_role === "parent_master") {
      parentId = user.id;
    } else if (me.account_role === "child") {
      const { data: links } = await admin
        .from("parent_child")
        .select("parent_id")
        .eq("child_id", user.id);
      const parentIds = [
        ...new Set((links ?? []).map((row) => row.parent_id).filter(Boolean)),
      ].sort() as string[];
      parentId = parentIds[0] ?? null;
    }
    if (!parentId) return null;

    const { data: parent } =
      parentId === user.id
        ? { data: me }
        : await admin
            .from("profiles")
            .select(PROFILE_COLUMNS)
            .eq("id", parentId)
            .maybeSingle();

    const { data: links } = await admin
      .from("parent_child")
      .select("child_id")
      .eq("parent_id", parentId);
    const childIds = [
      ...new Set((links ?? []).map((row) => row.child_id).filter(Boolean)),
    ] as string[];
    const { data: childRows } = childIds.length
      ? await admin.from("profiles").select(PROFILE_COLUMNS).in("id", childIds)
      : { data: [] as HouseholdProfileRow[] };

    return buildHouseholdProfiles({
      currentUserId: user.id,
      parent: (parent as HouseholdProfileRow | null) ?? null,
      children: (childRows ?? []) as HouseholdProfileRow[],
    });
  } catch {
    return null;
  }
}
