"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteHouseholdMasterResult =
  | { success: true }
  | { success: false; error: string };

const GENERIC_ERROR =
  "We could not delete this household. Your parent login is still active. Try again.";

/**
 * Permanently deletes the signed-in parent master, every linked learner Auth
 * user, and household rows (parent_child, consent_requests). Profiles cascade
 * from auth.users. Does not report success unless the parent Auth user is gone.
 */
export async function deleteHouseholdMasterAccount(): Promise<DeleteHouseholdMasterResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.id) {
    return {
      success: false,
      error: "Sign in as the parent to delete this household.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : GENERIC_ERROR,
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.account_role !== "parent_master") {
    return {
      success: false,
      error: "Only the parent master can delete this household.",
    };
  }

  const parentEmail = user.email?.trim().toLowerCase() || null;
  const collected = await collectHouseholdChildIds(admin, user.id, parentEmail);
  if (!collected.ok) {
    return { success: false, error: collected.error };
  }

  for (const childId of collected.ids) {
    const { data: child } = await admin
      .from("profiles")
      .select("id, account_role")
      .eq("id", childId)
      .maybeSingle();
    if (child && child.account_role !== "child") continue;

    const { error } = await admin.auth.admin.deleteUser(childId);
    if (error && !isAlreadyGone(error)) {
      return {
        success: false,
        error:
          "We could not delete every linked learner account. Your parent login is still active. Try again.",
      };
    }
  }

  const leftoverError = await deleteLeftoverHouseholdRows(
    admin,
    user.id,
    parentEmail,
  );
  if (leftoverError) {
    return {
      success: false,
      error:
        "We could not finish deleting household records. Your parent login is still active. Try again.",
    };
  }

  const { error: parentError } = await admin.auth.admin.deleteUser(user.id);
  if (parentError && !isAlreadyGone(parentError)) {
    return {
      success: false,
      error:
        "Linked learners were removed, but we could not delete the parent account. Try again.",
    };
  }

  const { data: stillThere } = await admin.auth.admin.getUserById(user.id);
  if (stillThere.user) {
    return { success: false, error: GENERIC_ERROR };
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Auth user is already gone; local logout still runs on the client.
  }

  return { success: true };
}

async function collectHouseholdChildIds(
  admin: ReturnType<typeof createAdminClient>,
  parentId: string,
  parentEmail: string | null,
): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  const ids = new Set<string>();

  const { data: links, error: linksError } = await admin
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", parentId);
  if (linksError) return { ok: false, error: GENERIC_ERROR };
  for (const row of links ?? []) {
    if (row.child_id) ids.add(row.child_id);
  }

  if (parentEmail) {
    const { data: byEmail, error: emailError } = await admin
      .from("consent_requests")
      .select("child_id")
      .eq("parent_email", parentEmail);
    if (emailError) return { ok: false, error: GENERIC_ERROR };
    for (const row of byEmail ?? []) {
      if (row.child_id) ids.add(row.child_id);
    }
  }

  const { data: byParent, error: parentError } = await admin
    .from("consent_requests")
    .select("child_id")
    .eq("parent_id", parentId);
  if (parentError) return { ok: false, error: GENERIC_ERROR };
  for (const row of byParent ?? []) {
    if (row.child_id) ids.add(row.child_id);
  }

  return { ok: true, ids: [...ids] };
}

async function deleteLeftoverHouseholdRows(
  admin: ReturnType<typeof createAdminClient>,
  parentId: string,
  parentEmail: string | null,
): Promise<string | null> {
  if (parentEmail) {
    const { error } = await admin
      .from("consent_requests")
      .delete()
      .eq("parent_email", parentEmail);
    if (error) return GENERIC_ERROR;
  }

  const { error: byParentId } = await admin
    .from("consent_requests")
    .delete()
    .eq("parent_id", parentId);
  if (byParentId) return GENERIC_ERROR;

  const { error: links } = await admin
    .from("parent_child")
    .delete()
    .eq("parent_id", parentId);
  if (links) return GENERIC_ERROR;

  return null;
}

function isAlreadyGone(error: { message?: string; code?: string }): boolean {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    code.includes("not_found") ||
    message.includes("not found") ||
    message.includes("does not exist")
  );
}
