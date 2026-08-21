"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LinkedHouseholdChild = {
  userId: string;
  username: string;
  birthYear: number | null;
  curriculumCohort: "explorer" | "pathfinder" | "maverick" | null;
  accountStatus: "pending_consent" | "active";
  consentApprovedAt: string | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  birth_year: number | null;
  account_role: string | null;
  account_status: string | null;
  curriculum_cohort: string | null;
  consent_approved_at: string | null;
};

type LinkedChildQueryRow = {
  child_id: string;
  profiles: ProfileRow | ProfileRow[] | null;
};

function asProfile(value: ProfileRow | ProfileRow[] | null): ProfileRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toLinkedChild(row: ProfileRow): LinkedHouseholdChild | null {
  if (row.account_role !== "child" || !row.username?.trim()) return null;
  const cohort = row.curriculum_cohort;
  return {
    userId: row.id,
    username: row.username.trim(),
    birthYear: row.birth_year,
    curriculumCohort:
      cohort === "explorer" || cohort === "pathfinder" || cohort === "maverick"
        ? cohort
        : null,
    accountStatus:
      row.account_status === "pending_consent" ? "pending_consent" : "active",
    consentApprovedAt: row.consent_approved_at,
  };
}

/**
 * Linked children for the signed-in parent master.
 * One parent_child → profiles query (not a sequential waterfall).
 */
export async function listLinkedChildrenForCurrentParent(): Promise<
  | { ok: true; children: LinkedHouseholdChild[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in as a parent to see linked children." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not load linked children.",
    };
  }

  const { data: rows, error } = await admin
    .from("parent_child")
    .select(
      "child_id, profiles!child_id (id, username, birth_year, account_role, account_status, curriculum_cohort, consent_approved_at)",
    )
    .eq("parent_id", user.id);

  if (!error) {
    const children = ((rows ?? []) as LinkedChildQueryRow[])
      .map((row) => asProfile(row.profiles))
      .filter((row): row is ProfileRow => Boolean(row))
      .map(toLinkedChild)
      .filter((row): row is LinkedHouseholdChild => Boolean(row))
      .sort((a, b) => a.username.localeCompare(b.username));
    return { ok: true, children };
  }

  const { data: links, error: linkError } = await admin
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", user.id);

  if (linkError) {
    return { ok: false, error: error.message || linkError.message || "Could not load linked children." };
  }

  const childIds = [
    ...new Set((links ?? []).map((row) => row.child_id).filter(Boolean)),
  ];
  if (childIds.length === 0) {
    return { ok: true, children: [] };
  }

  const { data: profileRows, error: profileError } = await admin
    .from("profiles")
    .select(
      "id, username, birth_year, account_role, account_status, curriculum_cohort, consent_approved_at",
    )
    .in("id", childIds);

  if (profileError) {
    return {
      ok: false,
      error: profileError.message || "Could not load linked children.",
    };
  }

  const children = ((profileRows ?? []) as ProfileRow[])
    .map(toLinkedChild)
    .filter((row): row is LinkedHouseholdChild => Boolean(row))
    .sort((a, b) => a.username.localeCompare(b.username));

  return { ok: true, children };
}
