import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import {
  APPROVAL_KEY_EMAIL_SENT,
  APPROVAL_KEY_NO,
  APPROVAL_KEY_REMINDER_SENT,
  APPROVAL_KEY_REQUESTED,
  APPROVAL_KEY_YES,
} from "@/lib/launchpad/parent-approval/config";
import { approvalEmailAction, approvalEmailSentAt, parentApprovalRequestedAt } from "@/lib/launchpad/parent-approval/model";
import { ventureDisplayName } from "@/lib/launchpad/parent-approval/list";

/**
 * Launchpad parent approval emails: the request email when a learner reaches
 * the Level 4 stop, and the one reminder 24 hours later. Server only. Nothing
 * here is a server action, so the browser cannot call it.
 *
 * Exactly once: a marker (the ISO time) is written to the venture row BEFORE
 * the send, by an update that only matches while the marker is still empty and
 * the parent has not answered. Two runs at once cannot both win it. If the send
 * fails, the marker is released so a later run can try again.
 */

type Admin = ReturnType<typeof createAdminClient>;

const TABLE = "launchpad_learner_ventures";

export type ApprovalEmailKind = "request" | "reminder";
export type ApprovalEmailResult = "sent" | "skipped" | "failed";

const MARKER_FOR: Record<ApprovalEmailKind, string> = {
  request: APPROVAL_KEY_EMAIL_SENT,
  reminder: APPROVAL_KEY_REMINDER_SENT,
};

async function readMap(admin: Admin, userId: string, ventureId: string): Promise<Record<string, unknown> | null> {
  const { data } = await admin
    .from(TABLE)
    .select("wrap_up_confirmed_at")
    .eq("user_id", userId)
    .eq("venture_id", ventureId)
    .maybeSingle();
  const map = (data as { wrap_up_confirmed_at?: unknown } | null)?.wrap_up_confirmed_at;
  return map && typeof map === "object" ? (map as Record<string, unknown>) : null;
}

/** Takes the marker, but only while it is empty and the parent has not answered. */
async function claimMarker(
  admin: Admin,
  userId: string,
  ventureId: string,
  key: string,
  claimedAt: string,
): Promise<boolean> {
  const map = await readMap(admin, userId, ventureId);
  if (!map) return false;
  const { data, error } = await admin
    .from(TABLE)
    .update({ wrap_up_confirmed_at: { ...map, [key]: claimedAt } })
    .eq("user_id", userId)
    .eq("venture_id", ventureId)
    .is(`wrap_up_confirmed_at->>${key}`, null)
    .is(`wrap_up_confirmed_at->>${APPROVAL_KEY_YES}`, null)
    .is(`wrap_up_confirmed_at->>${APPROVAL_KEY_NO}`, null)
    .select("id");
  return !error && Array.isArray(data) && data.length > 0;
}

/** Puts the marker back after a failed send, only if it is still our claim. */
async function releaseMarker(
  admin: Admin,
  userId: string,
  ventureId: string,
  key: string,
  claimedAt: string,
): Promise<void> {
  const map = await readMap(admin, userId, ventureId);
  if (!map || map[key] !== claimedAt) return;
  const next = { ...map };
  delete next[key];
  await admin
    .from(TABLE)
    .update({ wrap_up_confirmed_at: next })
    .eq("user_id", userId)
    .eq("venture_id", ventureId)
    .eq(`wrap_up_confirmed_at->>${key}`, claimedAt);
}

/** The linked parent's sign-in email and the learner's username. Never logged. */
async function lookupRecipient(
  admin: Admin,
  learnerId: string,
): Promise<{ email: string; childUsername: string | null } | null> {
  const { data: link } = await admin.from("parent_child").select("parent_id").eq("child_id", learnerId).maybeSingle();
  const parentId = (link?.parent_id as string | undefined) ?? null;
  if (!parentId) return null;
  const [{ data: parent }, { data: child }] = await Promise.all([
    admin.auth.admin.getUserById(parentId),
    admin.from("profiles").select("username").eq("id", learnerId).maybeSingle(),
  ]);
  const email = parent?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  return { email, childUsername: (child?.username as string | undefined) ?? null };
}

/**
 * Sends one approval email if it is still due. Safe to call twice: the second
 * call finds the marker taken and returns "skipped".
 */
export async function sendLaunchpadApprovalEmail(
  admin: Admin,
  input: { learnerId: string; ventureId: string; kind: ApprovalEmailKind },
): Promise<ApprovalEmailResult> {
  const { learnerId, ventureId, kind } = input;
  const key = MARKER_FOR[kind];
  try {
    const map = await readMap(admin, learnerId, ventureId);
    const due = approvalEmailAction(map, Date.now());
    // A fresh request is always allowed to send its first email; the job path
    // only sends what is due.
    const firstRequest =
      kind === "request" &&
      map !== null &&
      parentApprovalRequestedAt(map) !== null &&
      approvalEmailSentAt(map, APPROVAL_KEY_EMAIL_SENT) === null &&
      approvalEmailSentAt(map, APPROVAL_KEY_YES) === null &&
      approvalEmailSentAt(map, APPROVAL_KEY_NO) === null;
    if (!firstRequest && due !== kind) return "skipped";

    const recipient = await lookupRecipient(admin, learnerId);
    // Unlinked learners have no parent to email. The stop still fails closed.
    if (!recipient) return "skipped";

    const claimedAt = new Date().toISOString();
    if (!(await claimMarker(admin, learnerId, ventureId, key, claimedAt))) return "skipped";

    const sent = await sendOnboardingEmail({
      type: kind === "request" ? "LAUNCHPAD_PARENT_APPROVAL" : "LAUNCHPAD_PARENT_APPROVAL_REMINDER",
      recipientEmail: recipient.email,
      data: {
        childUsername: recipient.childUsername,
        ventureName: ventureDisplayName(ventureId),
      },
      idempotencyKey: `launchpad-approval-${kind}-${learnerId}-${ventureId}-${String(
        parentApprovalRequestedAt(map) ?? "",
      )}`.slice(0, 250),
    });
    if (!sent.success) {
      await releaseMarker(admin, learnerId, ventureId, key, claimedAt);
      console.error("[launchpad-approval-email] send failed", { kind });
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[launchpad-approval-email] error", {
      kind,
      message: error instanceof Error ? error.message : "unknown",
    });
    return "failed";
  }
}

export type ApprovalEmailSweepSummary = {
  checked: number;
  requestSent: number;
  reminderSent: number;
  skipped: number;
  failed: number;
};

/**
 * The scheduled job: finds waiting requests and sends what is due (the one
 * reminder 24 hours after the request email, plus a retry of a request email
 * that failed). Counts only, no names or addresses.
 */
export async function runLaunchpadApprovalEmailSweep(
  admin: Admin,
  nowMs = Date.now(),
): Promise<ApprovalEmailSweepSummary> {
  const summary: ApprovalEmailSweepSummary = { checked: 0, requestSent: 0, reminderSent: 0, skipped: 0, failed: 0 };
  const { data, error } = await admin
    .from(TABLE)
    .select("user_id, venture_id, wrap_up_confirmed_at")
    .not(`wrap_up_confirmed_at->>${APPROVAL_KEY_REQUESTED}`, "is", null)
    .is(`wrap_up_confirmed_at->>${APPROVAL_KEY_YES}`, null)
    .is(`wrap_up_confirmed_at->>${APPROVAL_KEY_NO}`, null)
    .is(`wrap_up_confirmed_at->>${APPROVAL_KEY_REMINDER_SENT}`, null)
    .limit(500);
  if (error) throw new Error("approval-email-sweep-read-failed");
  for (const row of (data ?? []) as {
    user_id: string;
    venture_id: string;
    wrap_up_confirmed_at: Record<string, unknown> | null;
  }[]) {
    summary.checked += 1;
    const action = approvalEmailAction(row.wrap_up_confirmed_at, nowMs);
    if (!action) {
      summary.skipped += 1;
      continue;
    }
    const result = await sendLaunchpadApprovalEmail(admin, {
      learnerId: row.user_id,
      ventureId: row.venture_id,
      kind: action,
    });
    if (result === "sent") {
      if (action === "request") summary.requestSent += 1;
      else summary.reminderSent += 1;
    } else if (result === "failed") summary.failed += 1;
    else summary.skipped += 1;
  }
  return summary;
}
