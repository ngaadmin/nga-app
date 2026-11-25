"use server";

import "server-only";

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { liveVentureIds } from "@/lib/launchpad/venture-test/launchpad-home-data";
import { sendLaunchpadApprovalEmail } from "@/lib/launchpad/parent-approval/email";
import { parentTabGatePassValid } from "@/lib/parent/parent-tab-gate-pass";
import {
  isVentureId,
  learnerSkipsStopForAge,
  NO_APPROVAL_GATE,
  parentApprovalStatus,
  withApprovalDecision,
  withApprovalRequested,
  learnerApprovalGate,
  type LearnerApprovalGateView,
  type ParentApprovalStatus,
} from "@/lib/launchpad/parent-approval/model";

/**
 * Launchpad parent approval, server side. Reads and writes the learner's
 * launchpad_learner_ventures row with the service role, after checking who is
 * asking: the learner for their own row, or the linked parent holding a Parent
 * PIN gate pass. The database stops a learner session writing the approval keys.
 */

type VentureRow = {
  id: string;
  wrap_up_confirmed_at: Record<string, unknown> | null;
};

async function signedInUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function readVentureRow(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  ventureId: string,
): Promise<VentureRow | null> {
  const { data } = await admin
    .from("launchpad_learner_ventures")
    .select("id, wrap_up_confirmed_at")
    .eq("user_id", userId)
    .eq("venture_id", ventureId)
    .maybeSingle();
  return (data as VentureRow | null) ?? null;
}

/** The learner's linked parent, from parent_child. Null when there is none. */
async function linkedParentId(
  admin: ReturnType<typeof createAdminClient>,
  childId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("parent_child")
    .select("parent_id")
    .eq("child_id", childId)
    .maybeSingle();
  return (data?.parent_id as string | undefined) ?? null;
}

/**
 * True for a signed-in active learner who still has to pass the stop. A learner
 * who was 16 or over at sign-up skips it (learnerSkipsStopForAge), so for them
 * this is false and no request or email is ever created.
 */
async function isGatedLearner(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("profiles")
    .select("account_role, account_status, parent_approval_required, age_checked_at")
    .eq("id", userId)
    .maybeSingle();
  if (data?.account_role !== "child" || data?.account_status !== "active") return false;
  return !learnerSkipsStopForAge(data);
}

async function writeMilestones(
  admin: ReturnType<typeof createAdminClient>,
  row: VentureRow | null,
  userId: string,
  ventureId: string,
  milestones: Record<string, unknown>,
): Promise<boolean> {
  if (row) {
    const { error } = await admin
      .from("launchpad_learner_ventures")
      .update({ wrap_up_confirmed_at: milestones })
      .eq("id", row.id);
    return !error;
  }
  const { error } = await admin.from("launchpad_learner_ventures").insert({
    user_id: userId,
    venture_id: ventureId,
    current_level: 4,
    wrap_up_confirmed_at: milestones,
  });
  return !error;
}

/**
 * The learner's view of the stop for one venture. `applies` is true for a
 * signed-in active learner, with or without a linked parent. A learner with no
 * linked parent fails closed: the waiting screen shows and nothing is sent.
 * Learners who were 16 or over at sign-up skip the stop. A learner who signed up
 * under 16 keeps it, even after turning 16, because no birth year is stored.
 */
export async function loadLaunchpadApprovalGate(
  ventureId: string,
): Promise<LearnerApprovalGateView> {
  if (!isVentureId(ventureId)) return NO_APPROVAL_GATE;
  // No session (a guest, or an environment with no Supabase): nothing to gate.
  const userId = await signedInUserId().catch(() => null);
  if (!userId) return NO_APPROVAL_GATE;
  try {
    const admin = createAdminClient();
    if (!(await isGatedLearner(admin, userId))) return NO_APPROVAL_GATE;
    const hasParent = (await linkedParentId(admin, userId)) !== null;
    const row = hasParent ? await readVentureRow(admin, userId, ventureId) : null;
    return learnerApprovalGate(hasParent, row?.wrap_up_confirmed_at).view;
  } catch {
    // A signed-in learner fails closed: the screen shows a retry, never the task.
    throw new Error("approval-gate-unavailable");
  }
}

/**
 * The learner reached the stop. Sends the request to the parent once: the
 * parent sees it in the Parent Hub and the unread dot and count follow.
 * Calling again never re-sends and never resets an answer.
 */
export async function requestLaunchpadParentApproval(
  ventureId: string,
): Promise<LearnerApprovalGateView> {
  if (!isVentureId(ventureId) || !liveVentureIds().includes(ventureId)) {
    return NO_APPROVAL_GATE;
  }
  const userId = await signedInUserId();
  if (!userId) return NO_APPROVAL_GATE;
  const admin = createAdminClient();
  if (!(await isGatedLearner(admin, userId))) return NO_APPROVAL_GATE;
  const hasParent = (await linkedParentId(admin, userId)) !== null;
  const row = hasParent ? await readVentureRow(admin, userId, ventureId) : null;
  const { view, needsRequest } = learnerApprovalGate(hasParent, row?.wrap_up_confirmed_at);
  if (!needsRequest) return view;
  const saved = await writeMilestones(
    admin,
    row,
    userId,
    ventureId,
    withApprovalRequested(row?.wrap_up_confirmed_at, new Date().toISOString()),
  );
  if (!saved) throw new Error("approval-request-failed");
  // The request email. It runs after the response so the learner never waits on
  // it. The send claims its marker first, so a double call cannot send twice.
  const sendRequestEmail = async () => {
    await sendLaunchpadApprovalEmail(admin, { learnerId: userId, ventureId, kind: "request" });
  };
  try {
    after(sendRequestEmail);
  } catch {
    await sendRequestEmail();
  }
  return { applies: true, status: "pending" };
}

/**
 * Parent answers: yes or not now, in one tap from the review sheet. The Parent
 * PIN is asked once, when the parent opens the Parent Hub, so there is no second
 * PIN here. The caller must still be the signed-in parent_master account that is
 * linked to this learner in parent_child. A yes can't be turned back into a no.
 *
 * Self-approve lock (Cath, 25 Nov 2026): the answer must carry the Parent Hub
 * gate pass the server signed when the Parent PIN was entered, so the action
 * can't be called straight from a session that never passed the PIN, and the
 * caller can never be the learner. The database refuses the same write from a
 * learner session (migration 20261125123000_launchpad_parent_approval_lock).
 */
export async function decideLaunchpadApproval(
  learnerId: string,
  ventureId: string,
  decision: "yes" | "no",
  parentPinPass: string,
): Promise<{ ok: true; status: ParentApprovalStatus } | { ok: false; error: string }> {
  try {
    if (!isVentureId(ventureId) || (decision !== "yes" && decision !== "no")) {
      return { ok: false, error: "That request isn't valid." };
    }
    const parentId = await signedInUserId();
    if (!parentId) return { ok: false, error: "Sign in as a parent first." };
    if (parentId === learnerId) return { ok: false, error: "Only a parent can answer this." };
    if (!parentTabGatePassValid(parentPinPass, parentId)) {
      return { ok: false, error: "Open the Parent Hub with your Parent PIN first." };
    }
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("account_role")
      .eq("id", parentId)
      .maybeSingle();
    if (profile?.account_role !== "parent_master") {
      return { ok: false, error: "Only a parent can answer this." };
    }
    const { data: link } = await admin
      .from("parent_child")
      .select("id")
      .eq("parent_id", parentId)
      .eq("child_id", learnerId)
      .maybeSingle();
    if (!link) return { ok: false, error: "That learner isn't linked to your account." };
    const row = await readVentureRow(admin, learnerId, ventureId);
    const current = parentApprovalStatus(row?.wrap_up_confirmed_at);
    if (current === "none") return { ok: false, error: "There is no request to answer yet." };
    if (current === "approved" && decision === "no") {
      return { ok: true, status: "approved" };
    }
    const saved = await writeMilestones(
      admin,
      row,
      learnerId,
      ventureId,
      withApprovalDecision(row?.wrap_up_confirmed_at, decision, new Date().toISOString()),
    );
    if (!saved) return { ok: false, error: "Could not save that. Try again." };
    return { ok: true, status: decision === "yes" ? "approved" : "declined" };
  } catch {
    return { ok: false, error: "Could not save that. Try again." };
  }
}

/** Count for the red dot and the menu pill: requests still waiting on this parent. */
export async function loadParentHubUnreadCount(): Promise<number> {
  try {
    const parentId = await signedInUserId();
    if (!parentId) return 0;
    const admin = createAdminClient();
    // The role and the links only need the parent id, so ask together.
    const [{ data: profile }, { data: links }] = await Promise.all([
      admin.from("profiles").select("account_role").eq("id", parentId).maybeSingle(),
      admin.from("parent_child").select("child_id").eq("parent_id", parentId),
    ]);
    if (profile?.account_role !== "parent_master") return 0;
    const childIds = (links ?? []).map((row) => row.child_id as string);
    if (childIds.length === 0) return 0;
    const { data } = await admin
      .from("launchpad_learner_ventures")
      .select("wrap_up_confirmed_at")
      .in("user_id", childIds);
    return (data ?? []).filter(
      (row) => parentApprovalStatus(row.wrap_up_confirmed_at as Record<string, unknown>) === "pending",
    ).length;
  } catch {
    return 0;
  }
}
