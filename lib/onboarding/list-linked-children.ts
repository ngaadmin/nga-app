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

/**
 * Linked children for the signed-in parent master.
 * Source of truth: parent_child + profiles (not device-local household lists).
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

  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_role !== "parent_master") {
    return { ok: false, error: "Only a parent master can see linked children." };
  }

  const { data: links, error: linkError } = await admin
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", user.id);

  if (linkError) {
    return { ok: false, error: linkError.message || "Could not load linked children." };
  }

  const childIds = [...new Set((links ?? []).map((row) => row.child_id).filter(Boolean))];
  if (childIds.length === 0) {
    return { ok: true, children: [] };
  }

  const { data: rows, error: profileError } = await admin
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

  const children = ((rows ?? []) as ProfileRow[])
    .filter(
      (row): row is ProfileRow & { username: string } =>
        row.account_role === "child" && Boolean(row.username?.trim()),
    )
    .map((row) => {
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
      } satisfies LinkedHouseholdChild;
    })
    .sort((a, b) => a.username.localeCompare(b.username));

  return { ok: true, children };
}
