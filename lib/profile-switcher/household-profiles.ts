import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

/** One profile in the switcher list: the parent or one linked child. */
export type HouseholdProfile = {
  userId: string;
  name: string;
  role: "parent" | "child";
  /** Track for children. Null for the parent. */
  cohort: MasteryCohort | null;
  isCurrent: boolean;
};

export type HouseholdProfiles = {
  currentUserId: string;
  profiles: HouseholdProfile[];
};

/**
 * Switching between profiles is not built yet. Parent and child are separate
 * Supabase Auth users with their own passwords, so a real no-PIN switch needs
 * a new session for the other user (see the switcher report). Until that is
 * decided, other rows show as "coming soon" and do nothing.
 */
export const PROFILE_SWITCHING_AVAILABLE = false;

export type HouseholdProfileRow = {
  id: string;
  username: string | null;
  account_role: string | null;
  account_status: string | null;
  curriculum_cohort: string | null;
};

function asCohort(value: string | null): MasteryCohort | null {
  return value === "explorer" || value === "pathfinder" || value === "maverick"
    ? value
    : null;
}

/**
 * Parent first, then active linked children by name. The signed-in profile
 * is always listed (marked current). Returns null unless there is at least
 * one other profile to show, so single-profile accounts keep the plain avatar.
 */
export function buildHouseholdProfiles(input: {
  currentUserId: string;
  parent: HouseholdProfileRow | null;
  children: HouseholdProfileRow[];
}): HouseholdProfiles | null {
  const { currentUserId } = input;
  if (!currentUserId) return null;

  const profiles: HouseholdProfile[] = [];
  const parent = input.parent;
  if (
    parent &&
    parent.account_role === "parent_master" &&
    parent.username?.trim()
  ) {
    profiles.push({
      userId: parent.id,
      name: parent.username.trim(),
      role: "parent",
      cohort: null,
      isCurrent: parent.id === currentUserId,
    });
  }

  const seen = new Set(profiles.map((profile) => profile.userId));
  const children = input.children
    .filter(
      (row) =>
        row.account_role === "child" &&
        Boolean(row.username?.trim()) &&
        (row.account_status === "active" || row.id === currentUserId),
    )
    .sort((a, b) =>
      String(a.username).localeCompare(String(b.username), "en", {
        sensitivity: "base",
      }),
    );
  for (const row of children) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    profiles.push({
      userId: row.id,
      name: String(row.username).trim(),
      role: "child",
      cohort: asCohort(row.curriculum_cohort),
      isCurrent: row.id === currentUserId,
    });
  }

  if (!profiles.some((profile) => profile.isCurrent)) return null;
  if (profiles.length < 2) return null;
  return { currentUserId, profiles };
}
