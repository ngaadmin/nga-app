"use server";

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parentTabGatePassValid } from "@/lib/parent/parent-tab-gate-pass";
import { liveVentureIds } from "@/lib/launchpad/venture-test/launchpad-home-data";
import {
  isVentureId,
  NO_APPROVAL_GATE,
  parentApprovalStatus,
  withApprovalDecision,
  withApprovalRequested,
  type LearnerApprovalGateView,
  type ParentApprovalStatus,
} from "@/lib/launchpad/parent-approval/model";

/**
 * Launchpad parent approval, server side. Reads and writes the learner's
 * launchpad_learner_ventures row with the service role, after checking who is
 * asking: the learner for their own row, or the linked parent holding a Parent
 * PIN gate pass. Nothing here changes the schema.
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

async function isActiveLearner(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("profiles")
    .select("account_role, account_status")
    .eq("id", userId)
    .maybeSingle();
  return data?.account_role === "child" && data?.account_status === "active";
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
 * signed-in active learner with a linked parent. Learners at 16 or over are
 * not skipped yet: no birth year is stored, so this over-gates (open question
 * (a) in decisions.md). Learners with no linked parent are not gated yet
 * (open question (b)).
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
    if (!(await isActiveLearner(admin, userId))) return NO_APPROVAL_GATE;
    if (!(await linkedParentId(admin, userId))) return NO_APPROVAL_GATE;
    const row = await readVentureRow(admin, userId, ventureId);
    return { applies: true, status: parentApprovalStatus(row?.wrap_up_confirmed_at) };
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
  if (!(await isActiveLearner(admin, userId))) return NO_APPROVAL_GATE;
  if (!(await linkedParentId(admin, userId))) return NO_APPROVAL_GATE;
  const row = await readVentureRow(admin, userId, ventureId);
  const status = parentApprovalStatus(row?.wrap_up_confirmed_at);
  if (status !== "none") return { applies: true, status };
  const saved = await writeMilestones(
    admin,
    row,
    userId,
    ventureId,
    withApprovalRequested(row?.wrap_up_confirmed_at, new Date().toISOString()),
  );
  if (!saved) throw new Error("approval-request-failed");
  return { applies: true, status: "pending" };
}

/**
 * Parent answers: yes or not now. Needs the parent session, a Parent PIN gate
 * pass, and the learner linked to this parent in parent_child. A yes can't be
 * turned back into a no.
 */
export async function decideLaunchpadApproval(
  pass: string,
  learnerId: string,
  ventureId: string,
  decision: "yes" | "no",
): Promise<{ ok: true; status: ParentApprovalStatus } | { ok: false; error: string }> {
  try {
    if (!isVentureId(ventureId) || (decision !== "yes" && decision !== "no")) {
      return { ok: false, error: "That request isn't valid." };
    }
    const parentId = await signedInUserId();
    if (!parentId) return { ok: false, error: "Sign in as a parent first." };
    if (!parentTabGatePassValid(pass, parentId)) {
      return { ok: false, error: "Enter your parent PIN first." };
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
    const { data: profile } = await admin
      .from("profiles")
      .select("account_role")
      .eq("id", parentId)
      .maybeSingle();
    if (profile?.account_role !== "parent_master") return 0;
    const { data: links } = await admin
      .from("parent_child")
      .select("child_id")
      .eq("parent_id", parentId);
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
