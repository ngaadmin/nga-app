"use server";

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { parseMasteryCohort, type MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { lookupConsentRequestByToken } from "@/lib/onboarding/lookup-consent-request";
import { parentTabGatePassValid } from "@/lib/parent/parent-tab-gate-pass";
import {
  findAuthUserIdByEmail,
  findParentMasterByEmail,
} from "@/lib/onboarding/parent-master-lookup";
import {
  isReservedGuestUsername,
  RESERVED_GUEST_USERNAME_ERROR,
} from "@/lib/onboarding/reserved-guest-username";

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
      childCohort: MasteryCohort | null;
      /** True only when this call created a new parent master Auth user. */
      createdNewParent?: boolean;
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
  if (isReservedGuestUsername(username)) {
    return { success: false, error: RESERVED_GUEST_USERNAME_ERROR };
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

  try {
    await sendOnboardingEmail({
      type: "PARENT_WELCOME",
      recipientEmail: parentEmail,
      data: { username },
    });
  } catch {
    // Welcome mail must not undo a completed approval.
  }

  return { ...approved, createdNewParent: true };
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
  childCohort: MasteryCohort | null;
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

  const parentEmail = user.email?.trim().toLowerCase() ?? "";
  const [profileResult, byParentId, emailQuery] = await Promise.all([
    admin
      .from("profiles")
      .select("id, account_role")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("consent_requests")
      .select("id, kind, child_id, parent_email, expires_at, status, parent_id")
      .eq("status", "pending")
      .eq("parent_id", user.id)
      .gt("expires_at", new Date().toISOString()),
    parentEmail
      ? admin
          .from("consent_requests")
          .select("id, kind, child_id, parent_email, expires_at, status, parent_id")
          .eq("status", "pending")
          .eq("parent_email", parentEmail)
          .gt("expires_at", new Date().toISOString())
      : Promise.resolve({ data: [] as never[], error: null }),
  ]);

  if (profileResult.data?.account_role !== "parent_master") {
    return { ok: false, error: "Only a parent master can see pending requests." };
  }

  if (byParentId.error || emailQuery.error) {
    return {
      ok: false,
      error:
        byParentId.error?.message ||
        emailQuery.error?.message ||
        "Could not load pending requests.",
    };
  }

  const rowsById = new Map<string, NonNullable<typeof byParentId.data>[number]>();
  for (const row of [...(byParentId.data ?? []), ...(emailQuery.data ?? [])]) {
    rowsById.set(row.id, row);
  }
  const rows = [...rowsById.values()];
  const childIds = [...new Set(rows.map((row) => row.child_id).filter(Boolean))];
  const { data: childRows } = childIds.length
    ? await admin
        .from("profiles")
        .select("id, username, curriculum_cohort")
        .in("id", childIds)
    : { data: [] as { id: string; username: string | null; curriculum_cohort: string | null }[] };

  const childrenById = new Map(
    (childRows ?? []).map((child) => [child.id, child] as const),
  );

  const requests: PendingConsentRequestView[] = [];
  for (const row of rows) {
    const child = childrenById.get(row.child_id);
    if (!child?.username) continue;
    requests.push({
      requestId: row.id,
      kind: row.kind === "parent_claim" ? "parent_claim" : "vpc",
      childId: row.child_id,
      childUsername: child.username,
      childCohort: parseMasteryCohort(child.curriculum_cohort),
      parentEmail: String(row.parent_email ?? parentEmail),
      expiresAt: row.expires_at,
    });
  }

  return { ok: true, requests };
}

/**
 * In-app approval for a pending consent row addressed to the signed-in parent.
 * Email approval links keep using {@link approveConsentRequest}.
 * Not exported: every in-app path must pass the parent PIN gate first.
 */
async function approveConsentRequestInAppUngated(
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
    .select(
      "id, account_role, account_status, consent_approved_at, curriculum_cohort, parent_approval_required, age_checked_at",
    )
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

  // A pending child with no age flag is only activatable when they are an
  // Explorer created before the flag existed. New under-16 rows set the flag.
  // A raw auth stub cannot set the track (clients cannot change it) and cannot
  // mint this request, so it cannot become active here.
  const pending = childProfile.account_status === "pending_consent";
  const flaggedForApproval = childProfile.parent_approval_required === true;
  const legacyExplorer =
    childProfile.curriculum_cohort === "explorer" &&
    !childProfile.age_checked_at;
  if (pending && !flaggedForApproval && !legacyExplorer) {
    return {
      success: false,
      error: "This approval link cannot activate this profile.",
    };
  }

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
    childCohort: parseMasteryCohort(childProfile.curriculum_cohort),
  };
}

function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" || /duplicate key|unique/i.test(error.message ?? "");
}

export type DeclineConsentResult =
  | { success: true; childUsername: string }
  | { success: false; error: string };

/**
 * Parent declines a pending learner. The profile stays, marked declined, and
 * the existing 30-day unapproved-account job removes it later. Nothing is
 * deleted here.
 */
export async function declineConsentRequest(token: string): Promise<DeclineConsentResult> {
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
  return markChildDeclined({
    requestId: lookup.request.id,
    childId: lookup.request.childId,
    childUsername: lookup.request.childUsername,
  });
}

async function declineConsentRequestInAppUngated(
  requestId: string,
): Promise<DeclineConsentResult> {
  const trimmedId = requestId.trim();
  if (!trimmedId) {
    return { success: false, error: "This approval request is missing." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Sign in as a parent to decline this profile." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.account_role !== "parent_master") {
    return { success: false, error: "Sign in as a parent to decline this profile." };
  }

  const { data: row } = await admin
    .from("consent_requests")
    .select("id, status, child_id, parent_email")
    .eq("id", trimmedId)
    .maybeSingle();
  if (!row || row.status !== "pending") {
    return { success: false, error: "This approval request is no longer pending." };
  }

  const { data: authUser } = await admin.auth.admin.getUserById(user.id);
  const parentEmail = authUser.user?.email?.trim().toLowerCase() ?? "";
  if (!parentEmail || parentEmail !== String(row.parent_email ?? "").trim().toLowerCase()) {
    return { success: false, error: "This approval request is for a different parent email." };
  }

  const { data: child } = await admin
    .from("profiles")
    .select("username")
    .eq("id", row.child_id)
    .maybeSingle();

  return markChildDeclined({
    requestId: row.id,
    childId: row.child_id,
    childUsername: child?.username?.trim() || "this learner",
  });
}

async function markChildDeclined(input: {
  requestId: string;
  childId: string;
  childUsername: string;
}): Promise<DeclineConsentResult> {
  const admin = createAdminClient();
  const { data: child } = await admin
    .from("profiles")
    .select("id, account_role, account_status, consent_approved_at")
    .eq("id", input.childId)
    .maybeSingle();
  if (!child || child.account_role !== "child") {
    return { success: false, error: "Could not find this learner profile." };
  }
  if (child.consent_approved_at || child.account_status === "active") {
    return { success: false, error: "This profile is already approved." };
  }
  if (child.account_status === "declined") {
    return { success: true, childUsername: input.childUsername };
  }

  const { error: childError } = await admin
    .from("profiles")
    .update({ account_status: "declined" })
    .eq("id", input.childId)
    .eq("account_status", "pending_consent");
  if (childError) {
    return {
      success: false,
      error: "Could not decline this profile. Try again.",
    };
  }

  await admin
    .from("consent_requests")
    .update({ status: "cancelled" })
    .eq("id", input.requestId)
    .eq("status", "pending");

  return { success: true, childUsername: input.childUsername };
}

const PARENT_TAB_LOCKED = "Enter your parent PIN to continue.";

/** Parent session plus an open Parent tab gate, both checked here on the server. */
async function parentTabGateOpen(pass: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.account_role !== "parent_master") return false;
  return parentTabGatePassValid(pass, user.id);
}

/**
 * In-app approve (Settings or the Parent tab). Needs the parent session and
 * a gate pass that only a correct parent PIN (checked on the server) signs.
 */
export async function approveConsentRequestInApp(
  requestId: string,
  pass: string,
): Promise<ApproveConsentResult> {
  if (!(await parentTabGateOpen(pass))) {
    return { success: false, error: PARENT_TAB_LOCKED };
  }
  return approveConsentRequestInAppUngated(requestId);
}

/** In-app decline. Same parent PIN gate as approve. */
export async function declineConsentRequestInApp(
  requestId: string,
  pass: string,
): Promise<DeclineConsentResult> {
  if (!(await parentTabGateOpen(pass))) {
    return { success: false, error: PARENT_TAB_LOCKED };
  }
  return declineConsentRequestInAppUngated(requestId);
}

/** Parent tab approve: the same PIN-gated approval. */
export async function approveConsentRequestFromParentTab(
  requestId: string,
  pass: string,
): Promise<ApproveConsentResult> {
  return approveConsentRequestInApp(requestId, pass);
}

/** Parent tab decline: the same PIN-gated decline. */
export async function declineConsentRequestFromParentTab(
  requestId: string,
  pass: string,
): Promise<DeclineConsentResult> {
  return declineConsentRequestInApp(requestId, pass);
}
