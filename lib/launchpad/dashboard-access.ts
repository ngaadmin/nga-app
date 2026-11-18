import "server-only";

import { launchpadLearnerMayEnterProfile } from "@/lib/launchpad/learner-access";
import { createClient } from "@/lib/supabase/server";

export { launchpadLearnerRoleAllowed } from "@/lib/launchpad/learner-access";

/**
 * The Auth user on this request, read as their own profile row.
 * A parent session stays a parent: this does not follow a linked child.
 * Launchpad requires a child whose profiles.account_status is active.
 */
export async function launchpadLearnerMayEnter(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error } = await supabase
      .from("profiles")
      .select("account_role, account_status")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !data) return false;
    return launchpadLearnerMayEnterProfile({
      accountRole: data.account_role,
      accountStatus: data.account_status,
    });
  } catch {
    return false;
  }
}

/**
 * True when the signed-in account is a parent. A parent has Launchpad on their
 * bar but is not a learner, so they see the "coming soon" page, not the route.
 */
export async function launchpadViewerIsParent(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("profiles")
      .select("account_role")
      .eq("id", user.id)
      .maybeSingle();
    return data?.account_role === "parent_master";
  } catch {
    return false;
  }
}
