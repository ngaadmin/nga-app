import "server-only";

import { launchpadLearnerRoleAllowed } from "@/lib/launchpad/content/dashboard-source";
import { createClient } from "@/lib/supabase/server";

export { launchpadLearnerRoleAllowed };

/**
 * The Auth user on this request, read as their own profile row.
 * A parent session stays a parent: this does not follow a linked child.
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
      .select("account_role")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !data) return false;
    return launchpadLearnerRoleAllowed(data.account_role);
  } catch {
    return false;
  }
}
