import "server-only";

import { sendOnboardingEmail } from "@/lib/email/resend-client";
import {
  planInactivityDeletions,
  selectInactivityActions,
  type ActivityAccount,
  type AccountRole,
  type InactivityDecision,
  type PlannedDeletion,
} from "@/lib/privacy/inactivity";
import { deleteUsageEventsForUsername } from "@/lib/privacy/delete-usage-events";
import { deleteHouseholdAccounts } from "@/lib/onboarding/delete-household-accounts";
import { notifyAccountDeletedChild } from "@/lib/onboarding/issue-account-deleted-email";
import {
  deleteLinkedChildAccount,
  type DeleteLinkedChildAdmin,
  type LinkedChildTarget,
} from "@/lib/onboarding/delete-linked-child";
import {
  removeOwnedClassSeats,
  type OwnedClassSeat,
} from "@/lib/school/remove-class-seats";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMAIL_PATTERN } from "@/lib/validation/email";

const DELETE_BATCH = 8;
const WARN_BATCH = 25;

type Admin = ReturnType<typeof createAdminClient>;

export type PrivacyMaintenanceSummary = {
  auditLogRemoved: number | null;
  warningsSent: number;
  warningsCleared: number;
  accountsDeleted: number;
  errors: string[];
};

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRole(value: unknown): AccountRole | null {
  if (value === "child" || value === "parent_master" || value === "teacher") return value;
  return null;
}

export function mapActivityRow(row: Record<string, unknown>): ActivityAccount | null {
  const id = text(row.id);
  const role = asRole(row.account_role);
  const createdAt = text(row.created_at);
  if (!id || !role || !createdAt) return null;
  return {
    id,
    username: text(row.username) ?? "",
    role,
    createdAt,
    lastSignInAt: text(row.last_sign_in_at),
    lastUsageAt: text(row.last_usage_at),
    warningSentAt: text(row.inactivity_warning_sent_at),
    parentId: text(row.parent_id),
    teacherId: text(row.teacher_id),
    authEmail: text(row.auth_email),
    parentEmail: text(row.parent_email),
    teacherEmail: text(row.teacher_email),
    guardianEmail: text(row.guardian_email),
  };
}

async function purgeAuditLog(admin: Admin, errors: string[]): Promise<number | null> {
  const { data, error } = await admin.rpc("purge_auth_audit_log");
  if (error) {
    errors.push("Could not purge the sign-in log.");
    return null;
  }
  return typeof data === "number" ? data : null;
}

async function loadAccounts(admin: Admin): Promise<ActivityAccount[]> {
  const { data, error } = await admin.rpc("list_account_activity");
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  const accounts: ActivityAccount[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const mapped = mapActivityRow(row as Record<string, unknown>);
    if (mapped) accounts.push(mapped);
  }
  return accounts;
}

async function sendWarning(
  decision: Extract<InactivityDecision, { kind: "warn" }>,
): Promise<boolean> {
  if (!EMAIL_PATTERN.test(decision.email)) return false;
  const result = await sendOnboardingEmail({
    type: "INACTIVITY_WARNING",
    recipientEmail: decision.email,
    data: {
      audience: decision.audience,
      username: decision.username,
    },
    idempotencyKey: `inactivity-warning/${decision.id}/${decision.audience}`,
  });
  return result.success;
}

function isAlreadyGone(error: { message?: string; status?: number; code?: string }): boolean {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    error.status === 404 ||
    code.includes("not_found") ||
    message.includes("not found") ||
    message.includes("does not exist")
  );
}

async function deleteAuthUser(admin: Admin, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error && !isAlreadyGone(error)) return { ok: false, error: error.message ?? "auth" };
  return { ok: true };
}

async function deleteHousehold(admin: Admin, parentId: string): Promise<void> {
  const { data: parent, error } = await admin
    .from("profiles")
    .select("id, username, account_role")
    .eq("id", parentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!parent || parent.account_role !== "parent_master") return;

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(parentId);
  if (userError && !isAlreadyGone(userError)) throw new Error(userError.message);
  const parentEmail = userResult?.user?.email?.trim().toLowerCase() || null;

  const childIds = new Set<string>();
  const { data: links, error: linkError } = await admin
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", parentId);
  if (linkError) throw new Error(linkError.message);
  for (const link of links ?? []) {
    if (link.child_id) childIds.add(link.child_id);
  }
  if (parentEmail) {
    const { data: byEmail, error: emailError } = await admin
      .from("consent_requests")
      .select("child_id")
      .eq("parent_email", parentEmail);
    if (emailError) throw new Error(emailError.message);
    for (const row of byEmail ?? []) {
      if (row.child_id) childIds.add(row.child_id);
    }
  }
  const { data: byParent, error: parentLinkError } = await admin
    .from("consent_requests")
    .select("child_id")
    .eq("parent_id", parentId);
  if (parentLinkError) throw new Error(parentLinkError.message);
  for (const row of byParent ?? []) {
    if (row.child_id) childIds.add(row.child_id);
  }

  const children = [];
  for (const childId of childIds) {
    const { data: child, error: childError } = await admin
      .from("profiles")
      .select("id, username, account_role")
      .eq("id", childId)
      .maybeSingle();
    if (childError) throw new Error(childError.message);
    if (!child?.id) continue;
    children.push({
      id: child.id,
      role: typeof child.account_role === "string" ? child.account_role : "",
      username: typeof child.username === "string" ? child.username : "",
    });
  }

  const childUsernames = children
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
      // Deletion still continues.
    }
  }

  const deleted = await deleteHouseholdAccounts(
    {
      deleteUsageEvents: (username) => deleteUsageEventsForUsername(admin, username),
      deleteAuthUser: (userId) => deleteAuthUser(admin, userId),
      async deleteLeftoverRows() {
        if (parentEmail) {
          const { error: byEmail } = await admin
            .from("consent_requests")
            .delete()
            .eq("parent_email", parentEmail);
          if (byEmail) return { ok: false, error: byEmail.message };
        }
        const { error: byParent } = await admin
          .from("consent_requests")
          .delete()
          .eq("parent_id", parentId);
        if (byParent) return { ok: false, error: byParent.message };
        const { error: linksError } = await admin
          .from("parent_child")
          .delete()
          .eq("parent_id", parentId);
        if (linksError) return { ok: false, error: linksError.message };
        return { ok: true };
      },
      async confirmParentGone() {
        const { data } = await admin.auth.admin.getUserById(parentId);
        if (data.user) return { ok: false, error: "still there" };
        return { ok: true };
      },
    },
    {
      id: parentId,
      username: typeof parent.username === "string" ? parent.username : "",
    },
    children,
  );
  if (!deleted.ok) throw new Error(deleted.error);
}

function linkedChildAdmin(admin: Admin): DeleteLinkedChildAdmin {
  return {
    async loadCallerRole(callerId) {
      const { data, error } = await admin
        .from("profiles")
        .select("account_role")
        .eq("id", callerId)
        .maybeSingle();
      if (error) return { ok: false, error: error.message };
      const role = (data as { account_role?: string | null } | null)?.account_role;
      return { ok: true, role: typeof role === "string" ? role : null };
    },
    async findLinkedChild(callerId, targetId) {
      const { data: link, error } = await admin
        .from("parent_child")
        .select("child_id")
        .eq("parent_id", callerId)
        .eq("child_id", targetId)
        .maybeSingle();
      if (error) return { ok: false, error: error.message };
      if (link?.child_id !== targetId) return { ok: true, child: null };
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id, account_role, username")
        .eq("id", targetId)
        .maybeSingle();
      if (profileError) return { ok: false, error: profileError.message };
      const row = profile as { id?: string; account_role?: string; username?: string } | null;
      if (row?.id !== targetId) return { ok: true, child: null };
      const child: LinkedChildTarget = {
        id: targetId,
        role: row.account_role ?? "",
        username: row.username ?? "",
      };
      return { ok: true, child };
    },
    async deleteLearnerProgress(childId) {
      const { error } = await admin.from("learner_progress").delete().eq("user_id", childId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    async deleteConsentRequests(childId) {
      const { error } = await admin.from("consent_requests").delete().eq("child_id", childId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    deleteUsageEvents: (username) => deleteUsageEventsForUsername(admin, username),
    deleteAuthUser: (userId) => deleteAuthUser(admin, userId),
    async deleteParentChildLink(callerId, childId) {
      const { error } = await admin
        .from("parent_child")
        .delete()
        .eq("parent_id", callerId)
        .eq("child_id", childId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    async deleteProfile(childId) {
      const { error } = await admin.from("profiles").delete().eq("id", childId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    async confirmAuthUserGone(childId) {
      const { data, error } = await admin.auth.admin.getUserById(childId);
      if (error && !isAlreadyGone(error)) return { ok: false, error: error.message };
      if (data?.user?.id) return { ok: false, error: "still there" };
      return { ok: true };
    },
  };
}

async function deleteClassSeat(admin: Admin, teacherId: string, username: string): Promise<void> {
  const result = await removeOwnedClassSeats(
    {
      async listOwnedSeats(ownerId) {
        const { data, error } = await admin
          .from("profiles")
          .select("id, username, account_role")
          .eq("teacher_id", ownerId)
          .eq("is_teacher", false);
        if (error) return { ok: false, error: error.message };
        const seats: OwnedClassSeat[] = [];
        for (const row of data ?? []) {
          if (typeof row.id !== "string" || typeof row.username !== "string") continue;
          seats.push({
            id: row.id,
            username: row.username,
            accountRole: typeof row.account_role === "string" ? row.account_role : "",
          });
        }
        return { ok: true, seats };
      },
      async deleteProgress(userId) {
        const { error } = await admin.from("learner_progress").delete().eq("user_id", userId);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },
      deleteUsageEvents: (name) => deleteUsageEventsForUsername(admin, name),
      deleteAuthUser: (userId) => deleteAuthUser(admin, userId),
    },
    teacherId,
    { scope: "one", username },
  );
  if (!result.ok) throw new Error(result.error);
}

async function deleteTeacher(admin: Admin, teacherId: string): Promise<void> {
  const { data: teacher, error } = await admin
    .from("profiles")
    .select("id, username")
    .eq("id", teacherId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const seats = await removeOwnedClassSeats(
    {
      async listOwnedSeats(ownerId) {
        const { data, error: listError } = await admin
          .from("profiles")
          .select("id, username, account_role")
          .eq("teacher_id", ownerId)
          .eq("is_teacher", false);
        if (listError) return { ok: false, error: listError.message };
        const owned: OwnedClassSeat[] = [];
        for (const row of data ?? []) {
          if (typeof row.id !== "string" || typeof row.username !== "string") continue;
          owned.push({
            id: row.id,
            username: row.username,
            accountRole: typeof row.account_role === "string" ? row.account_role : "",
          });
        }
        return { ok: true, seats: owned };
      },
      async deleteProgress(userId) {
        const { error: progressError } = await admin
          .from("learner_progress")
          .delete()
          .eq("user_id", userId);
        if (progressError) return { ok: false, error: progressError.message };
        return { ok: true };
      },
      deleteUsageEvents: (name) => deleteUsageEventsForUsername(admin, name),
      deleteAuthUser: (userId) => deleteAuthUser(admin, userId),
    },
    teacherId,
    { scope: "all" },
  );
  if (!seats.ok) throw new Error(seats.error);

  const username = typeof teacher?.username === "string" ? teacher.username : "";
  if (username.trim()) {
    const usage = await deleteUsageEventsForUsername(admin, username);
    if (!usage.ok) throw new Error(usage.error);
  }
  const { error: progressError } = await admin
    .from("learner_progress")
    .delete()
    .eq("user_id", teacherId);
  if (progressError) throw new Error(progressError.message);
  const auth = await deleteAuthUser(admin, teacherId);
  if (!auth.ok) throw new Error(auth.error);
}

async function deleteStandalone(admin: Admin, userId: string, username: string): Promise<void> {
  if (username) {
    const usage = await deleteUsageEventsForUsername(admin, username);
    if (!usage.ok) throw new Error(usage.error);
  }
  const { error: progressError } = await admin
    .from("learner_progress")
    .delete()
    .eq("user_id", userId);
  if (progressError) throw new Error(progressError.message);
  const { error: consentError } = await admin
    .from("consent_requests")
    .delete()
    .eq("child_id", userId);
  if (consentError) throw new Error(consentError.message);
  const auth = await deleteAuthUser(admin, userId);
  if (!auth.ok) throw new Error(auth.error);
}

async function runDeletion(admin: Admin, planned: PlannedDeletion): Promise<void> {
  switch (planned.kind) {
    case "household":
      await deleteHousehold(admin, planned.parentId);
      return;
    case "teacher":
      await deleteTeacher(admin, planned.teacherId);
      return;
    case "linked-child": {
      const result = await deleteLinkedChildAccount(
        linkedChildAdmin(admin),
        planned.parentId,
        planned.childId,
      );
      if (!result.ok) throw new Error(result.error);
      const { data: parent } = await admin.auth.admin.getUserById(planned.parentId);
      const parentEmail = parent.user?.email?.trim().toLowerCase() ?? "";
      if (parentEmail && result.username) {
        await notifyAccountDeletedChild({
          recipientEmail: parentEmail,
          username: result.username,
        });
      }
      return;
    }
    case "class-seat":
      await deleteClassSeat(admin, planned.teacherId, planned.username);
      return;
    case "standalone":
      await deleteStandalone(admin, planned.userId, planned.username);
      return;
    default: {
      const _exhaustive: never = planned;
      throw new Error(`Unsupported deletion ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/**
 * Daily privacy maintenance: 30-day sign-in log, then inactivity warnings
 * and deletions. One account's failure does not stop the rest.
 */
export async function runPrivacyMaintenance(
  now = new Date(),
): Promise<PrivacyMaintenanceSummary> {
  const errors: string[] = [];
  const admin = createAdminClient();
  const summary: PrivacyMaintenanceSummary = {
    auditLogRemoved: await purgeAuditLog(admin, errors),
    warningsSent: 0,
    warningsCleared: 0,
    accountsDeleted: 0,
    errors,
  };

  let accounts: ActivityAccount[];
  try {
    accounts = await loadAccounts(admin);
  } catch {
    errors.push("Could not load accounts for the inactivity check.");
    return summary;
  }

  const decisions = selectInactivityActions(accounts, now);
  for (const decision of decisions) {
    if (decision.kind !== "reset") continue;
    const { error } = await admin
      .from("profiles")
      .update({ inactivity_warning_sent_at: null })
      .eq("id", decision.id);
    if (error) {
      errors.push("Could not clear an inactivity warning.");
      continue;
    }
    summary.warningsCleared += 1;
  }

  let warned = 0;
  for (const decision of decisions) {
    if (decision.kind !== "warn" || warned >= WARN_BATCH) continue;
    const sent = await sendWarning(decision);
    if (!sent) {
      errors.push("Could not send an inactivity email.");
      continue;
    }
    const { error } = await admin
      .from("profiles")
      .update({ inactivity_warning_sent_at: now.toISOString() })
      .eq("id", decision.id);
    if (error) {
      errors.push("Could not record an inactivity warning.");
      continue;
    }
    warned += 1;
    summary.warningsSent += 1;
  }

  const planned = planInactivityDeletions(decisions).slice(0, DELETE_BATCH);
  for (const item of planned) {
    try {
      await runDeletion(admin, item);
      summary.accountsDeleted += 1;
    } catch {
      errors.push("Could not delete an inactive account.");
    }
  }

  return summary;
}
