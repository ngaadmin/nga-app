"use server";

import "server-only";

import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { assessParentPin, PARENT_PIN_GATE_COPY } from "@/lib/dashboard/parent-pin-gate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { deleteUsageEventsForUsername } from "@/lib/privacy/delete-usage-events";
import {
  deleteHouseholdAccounts,
  type HouseholdChildRecord,
} from "@/lib/onboarding/delete-household-accounts";
import { EMAIL_PATTERN } from "@/lib/validation/email";

export type DeleteHouseholdMasterResult =
  | { success: true }
  | { success: false; error: string };

const GENERIC_ERROR =
  "We could not delete this household. Your parent login is still active. Try again.";

/**
 * Permanently deletes the signed-in parent master, every linked learner Auth
 * user, and household rows (parent_child, consent_requests). Activity rows for
 * those usernames go first. Profiles cascade from auth.users. Does not report
 * success unless the parent Auth user is gone.
 * Requires the parent PIN stored on the parent profile.
 */
export async function deleteHouseholdMasterAccount(
  parentPin: string,
): Promise<DeleteHouseholdMasterResult> {
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
    .select("id, account_role, username, parent_pin_hash")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.account_role !== "parent_master") {
    return {
      success: false,
      error: "Only the parent master can delete this household.",
    };
  }

  const storedPin =
    typeof profile.parent_pin_hash === "string" ? profile.parent_pin_hash.trim() : "";
  if (storedPin) {
    const pinLimit = consumeRateLimit(`parent-pin:${user.id}`, 8, 15 * 60 * 1000);
    if (!pinLimit.allowed) {
      return { success: false, error: PARENT_PIN_GATE_COPY.limited };
    }
  }
  const pin = assessParentPin(parentPin, profile.parent_pin_hash);
  if (!pin.ok) return { success: false, error: pin.error };

  const parentEmail = user.email?.trim().toLowerCase() || null;
  const collected = await collectHouseholdChildren(admin, user.id, parentEmail);
  if (!collected.ok) {
    return { success: false, error: collected.error };
  }

  const childUsernames = collected.children
    .filter((child) => child.role === "child")
    .map((child) => child.username.trim())
    .filter(Boolean);
  if (parentEmail && EMAIL_PATTERN.test(parentEmail)) {
    try {
      await sendOnboardingEmail({
        type: "ACCOUNT_DELETED_MASTER",
        recipientEmail: parentEmail,
        data: { childUsernames },
      });
    } catch {
      // Deletion must still complete if the notice cannot be sent.
    }
  }

  const deleted = await deleteHouseholdAccounts(
    {
      async deleteUsageEvents(username) {
        return deleteUsageEventsForUsername(admin, username);
      },
      async deleteAuthUser(userId) {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error && !isAlreadyGone(error)) {
          return { ok: false, error: error.message ?? GENERIC_ERROR };
        }
        return { ok: true };
      },
      async deleteLeftoverRows() {
        const leftoverError = await deleteLeftoverHouseholdRows(
          admin,
          user.id,
          parentEmail,
        );
        return leftoverError ? { ok: false, error: leftoverError } : { ok: true };
      },
      async confirmParentGone() {
        const { data: stillThere } = await admin.auth.admin.getUserById(user.id);
        if (stillThere.user) return { ok: false, error: GENERIC_ERROR };
        return { ok: true };
      },
    },
    {
      id: user.id,
      username: typeof profile.username === "string" ? profile.username : "",
    },
    collected.children,
  );
  if (!deleted.ok) return { success: false, error: deleted.error };

  try {
    await supabase.auth.signOut();
  } catch {
    // Auth user is already gone; local logout still runs on the client.
  }

  return { success: true };
}

async function collectHouseholdChildren(
  admin: ReturnType<typeof createAdminClient>,
  parentId: string,
  parentEmail: string | null,
): Promise<{ ok: true; children: HouseholdChildRecord[] } | { ok: false; error: string }> {
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

  const children: HouseholdChildRecord[] = [];
  for (const childId of ids) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, account_role, username")
      .eq("id", childId)
      .maybeSingle();
    if (error) return { ok: false, error: GENERIC_ERROR };
    if (!data?.id) continue;
    children.push({
      id: data.id,
      role: typeof data.account_role === "string" ? data.account_role : "",
      username: typeof data.username === "string" ? data.username : "",
    });
  }

  return { ok: true, children };
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
