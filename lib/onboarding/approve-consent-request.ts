"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { lookupConsentRequestByToken } from "@/lib/onboarding/lookup-consent-request";
import {
  findAuthUserIdByEmail,
  findParentMasterByEmail,
} from "@/lib/onboarding/parent-master-lookup";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,20}$/;
const MIN_PASSWORD_LENGTH = 6;

export type ApproveConsentResult =
  | {
      success: true;
      kind: "vpc" | "parent_claim";
      childId: string;
      parentId: string;
      parentUsername: string;
      parentEmail: string;
      childUsername: string;
      childBirthYear: number | null;
    }
  | {
      success: false;
      error: string;
      needsParentAccount?: boolean;
    };

/**
 * Approve a valid, unexpired consent token and link parent ↔ child.
 * Parent is resolved from the request email — never from a client-supplied id.
 */
export async function approveConsentRequest(
  token: string,
): Promise<ApproveConsentResult> {
  const lookup = await lookupConsentRequestByToken(token);
  if (lookup.status === "expired") {
    return {
      success: false,
      error: "This approval link has expired. Resend a fresh email to continue.",
    };
  }
  if (lookup.status !== "valid") {
    return {
      success: false,
      error: "This approval link is invalid or has already been used.",
    };
  }

  const master = await findParentMasterByEmail(lookup.request.parentEmail);
  if (!master) {
    return {
      success: false,
      needsParentAccount: true,
      error: "Create a parent master account to finish approving this profile.",
    };
  }

  return completeConsentApproval({
    requestId: lookup.request.id,
    kind: lookup.request.kind,
    childId: lookup.request.childId,
    childUsername: lookup.request.childUsername,
    parentId: master.id,
    parentUsername: master.username,
    parentEmail: lookup.request.parentEmail,
  });
}

export type CreateParentMasterAndApproveInput = {
  token: string;
  username: string;
  password: string;
  marketingOptIn?: boolean;
};

/**
 * New parent: create a parent_master Auth + profile, then approve/link.
 * Email is taken from the consent request, not the form.
 */
export async function createParentMasterAndApprove(
  input: CreateParentMasterAndApproveInput,
): Promise<ApproveConsentResult> {
  const username = input.username.trim();
  if (!username || !USERNAME_PATTERN.test(username)) {
    return {
      success: false,
      error: "Pick a username with 2–20 letters, numbers, underscores, or hyphens.",
    };
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: "Use at least 6 characters for your password.",
    };
  }

  const lookup = await lookupConsentRequestByToken(input.token);
  if (lookup.status === "expired") {
    return {
      success: false,
      error: "This approval link has expired. Resend a fresh email to continue.",
    };
  }
  if (lookup.status !== "valid") {
    return {
      success: false,
      error: "This approval link is invalid or has already been used.",
    };
  }

  const parentEmail = lookup.request.parentEmail;
  const existingMaster = await findParentMasterByEmail(parentEmail);
  if (existingMaster) {
    return completeConsentApproval({
      requestId: lookup.request.id,
      kind: lookup.request.kind,
      childId: lookup.request.childId,
      childUsername: lookup.request.childUsername,
      parentId: existingMaster.id,
      parentUsername: existingMaster.username,
      parentEmail,
    });
  }

  const existingAuthId = await findAuthUserIdByEmail(parentEmail);
  if (existingAuthId) {
    return {
      success: false,
      error:
        "An account already exists for this email. Sign in, then open the approval link again.",
    };
  }

  const admin = createAdminClient();
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (taken) {
    return {
      success: false,
      error: "That username is already taken. Try adding a favorite number!",
    };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parentEmail,
    password: input.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return {
      success: false,
      error: createError?.message || "Could not create the parent master account.",
    };
  }

  const parentId = created.user.id;
  const { data: parentSaved, error: profileError } = await admin
    .from("profiles")
    .update({
      username,
      birth_year: null,
      account_role: "parent_master",
      account_status: "active",
      marketing_opt_in: Boolean(input.marketingOptIn),
    })
    .eq("id", parentId)
    .select("id, account_role, account_status")
    .maybeSingle();

  if (
    profileError ||
    !parentSaved ||
    parentSaved.account_role !== "parent_master" ||
    parentSaved.account_status !== "active"
  ) {
    await admin.auth.admin.deleteUser(parentId);
    return {
      success: false,
      error:
        profileError?.message || "Could not save the parent profile.",
    };
  }

  const approved = await completeConsentApproval({
    requestId: lookup.request.id,
    kind: lookup.request.kind,
    childId: lookup.request.childId,
    childUsername: lookup.request.childUsername,
    parentId,
    parentUsername: username,
    parentEmail,
  });

  if (!approved.success) {
    await admin.auth.admin.deleteUser(parentId);
    return approved;
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signInWithPassword({
      email: parentEmail,
      password: input.password,
    });
  } catch {
    // Linking already succeeded; session cookie is optional.
  }

  return approved;
}

export async function lookupParentMasterByEmail(email: string): Promise<{
  exists: boolean;
  username?: string;
}> {
  const master = await findParentMasterByEmail(email);
  if (!master) return { exists: false };
  return { exists: true, username: master.username };
}

export type PendingConsentRequestView = {
  requestId: string;
  kind: "vpc" | "parent_claim";
  childId: string;
  childUsername: string;
  childBirthYear: number | null;
  parentEmail: string;
  expiresAt: string;
};

/**
 * Pending guardian requests for the signed-in parent master, matched by
 * auth email or parent_id. Same parent email as independent child signup.
 */
export async function listPendingConsentRequestsForParent(): Promise<
  | { ok: true; requests: PendingConsentRequestView[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in as a parent to see pending requests." };
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
          : "Could not load pending requests.",
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_role !== "parent_master") {
    return { ok: false, error: "Only a parent master can see pending requests." };
  }

  const parentEmail = user.email?.trim().toLowerCase() ?? "";
  const { data: byParentId, error: parentIdError } = await admin
    .from("consent_requests")
    .select("id, kind, child_id, parent_email, expires_at, status, parent_id")
    .eq("status", "pending")
    .eq("parent_id", user.id)
    .gt("expires_at", new Date().toISOString());

  const emailQuery = parentEmail
    ? await admin
        .from("consent_requests")
        .select("id, kind, child_id, parent_email, expires_at, status, parent_id")
        .eq("status", "pending")
        .eq("parent_email", parentEmail)
        .gt("expires_at", new Date().toISOString())
    : { data: [] as typeof byParentId, error: null };

  if (parentIdError || emailQuery.error) {
    return {
      ok: false,
      error:
        parentIdError?.message ||
        emailQuery.error?.message ||
        "Could not load pending requests.",
    };
  }

  const rowsById = new Map<string, NonNullable<typeof byParentId>[number]>();
  for (const row of [...(byParentId ?? []), ...(emailQuery.data ?? [])]) {
    rowsById.set(row.id, row);
  }
  const rows = [...rowsById.values()];

  const requests: PendingConsentRequestView[] = [];
  for (const row of rows ?? []) {
    const { data: child } = await admin
      .from("profiles")
      .select("username, birth_year")
      .eq("id", row.child_id)
      .maybeSingle();
    if (!child?.username) continue;
    requests.push({
      requestId: row.id,
      kind: row.kind === "parent_claim" ? "parent_claim" : "vpc",
      childId: row.child_id,
      childUsername: child.username,
      childBirthYear:
        typeof child.birth_year === "number" ? child.birth_year : null,
      parentEmail: String(row.parent_email ?? parentEmail),
      expiresAt: row.expires_at,
    });
  }

  return { ok: true, requests };
}

/**
 * In-app approval for a pending consent row addressed to the signed-in parent.
 * Email approval links keep using {@link approveConsentRequest}.
 */
export async function approveConsentRequestInApp(
  requestId: string,
): Promise<ApproveConsentResult> {
  const trimmedId = requestId.trim();
  if (!trimmedId) {
    return { success: false, error: "This approval request is missing." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Sign in as a parent to link this profile." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, account_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.account_role !== "parent_master") {
    return {
      success: false,
      needsParentAccount: true,
      error: "Create a parent master account to finish approving this profile.",
    };
  }

  const { data: row, error } = await admin
    .from("consent_requests")
    .select(
      "id, kind, status, child_id, parent_email, parent_id, expires_at",
    )
    .eq("id", trimmedId)
    .maybeSingle();

  if (error || !row) {
    return { success: false, error: "This approval request could not be found." };
  }
  if (row.status !== "pending") {
    return { success: false, error: "This approval request is no longer pending." };
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return {
      success: false,
      error: "This approval request has expired. Ask the learner to resend it.",
    };
  }

  const parentEmail = String(row.parent_email ?? "").trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase() ?? "";
  const addressedToParent =
    row.parent_id === user.id || (parentEmail && parentEmail === userEmail);
  if (!addressedToParent) {
    return {
      success: false,
      error: "This approval request is not addressed to your parent email.",
    };
  }

  const { data: child } = await admin
    .from("profiles")
    .select("username")
    .eq("id", row.child_id)
    .maybeSingle();

  return completeConsentApproval({
    requestId: row.id,
    kind: row.kind === "parent_claim" ? "parent_claim" : "vpc",
    childId: row.child_id,
    childUsername: child?.username?.trim() || "learner",
    parentId: user.id,
    parentUsername: profile.username,
    parentEmail: parentEmail || userEmail,
  });
}

async function completeConsentApproval(input: {
  requestId: string;
  kind: "vpc" | "parent_claim";
  childId: string;
  childUsername: string;
  parentId: string;
  parentUsername: string;
  parentEmail: string;
}): Promise<ApproveConsentResult> {
  const admin = createAdminClient();
  const approvedAt = new Date().toISOString();

  const { data: parentProfile } = await admin
    .from("profiles")
    .select("id, account_role")
    .eq("id", input.parentId)
    .maybeSingle();

  if (!parentProfile || parentProfile.account_role !== "parent_master") {
    return {
      success: false,
      error: "Parent master profile is not ready. Please try again.",
    };
  }

  const { data: childProfile, error: childLookupError } = await admin
    .from("profiles")
    .select("id, account_role, account_status, consent_approved_at, birth_year")
    .eq("id", input.childId)
    .maybeSingle();

  if (childLookupError || !childProfile) {
    return {
      success: false,
      error: "Could not find this learner profile.",
    };
  }
  if (childProfile.account_role !== "child") {
    return {
      success: false,
      error: "This approval link is not for a learner profile.",
    };
  }

  const alreadyActive =
    childProfile.account_status === "active" &&
    Boolean(childProfile.consent_approved_at);

  if (!alreadyActive) {
    const { data: updatedChild, error: childError } = await admin
      .from("profiles")
      .update({
        account_status: "active",
        consent_approved_at: childProfile.consent_approved_at ?? approvedAt,
      })
      .eq("id", input.childId)
      .select("id, account_status, consent_approved_at")
      .maybeSingle();

    if (
      childError ||
      !updatedChild ||
      updatedChild.account_status !== "active" ||
      !updatedChild.consent_approved_at
    ) {
      return {
        success: false,
        error:
          childError?.message || "Could not activate this learner profile.",
      };
    }
  }

  const { error: linkError } = await admin.from("parent_child").insert({
    parent_id: input.parentId,
    child_id: input.childId,
  });

  if (linkError && !isUniqueViolation(linkError)) {
    return {
      success: false,
      error: linkError.message || "Could not link this parent and learner.",
    };
  }

  const { data: updatedRequest, error: requestError } = await admin
    .from("consent_requests")
    .update({
      status: "approved",
      approved_at: approvedAt,
      approved_by: input.parentId,
      parent_id: input.parentId,
    })
    .eq("id", input.requestId)
    .eq("status", "pending")
    .select("id, status")
    .maybeSingle();

  if (requestError) {
    return {
      success: false,
      error: requestError.message || "Could not mark this approval as complete.",
    };
  }
  if (updatedRequest && updatedRequest.status !== "approved") {
    return {
      success: false,
      error: "Could not mark this approval as complete.",
    };
  }

  return {
    success: true,
    kind: input.kind,
    childId: input.childId,
    parentId: input.parentId,
    parentUsername: input.parentUsername,
    parentEmail: input.parentEmail,
    childUsername: input.childUsername,
    childBirthYear:
      typeof childProfile.birth_year === "number" ? childProfile.birth_year : null,
  };
}

function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" || /duplicate key|unique/i.test(error.message ?? "");
}
