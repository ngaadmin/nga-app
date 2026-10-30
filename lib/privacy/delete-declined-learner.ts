import "server-only";

import {
  planUnapprovedAccountDeletion,
  type ActivityAccount,
  type PlannedDeletion,
} from "@/lib/privacy/inactivity";
import { mapActivityRow, runDeletion } from "@/lib/privacy/run-privacy-maintenance";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeclinedLearnerDeletion =
  | { deleted: true }
  | { deleted: false; reason: "not-found" | "not-declined" | "failed" };

export type DeleteDeclinedLearnerDeps = {
  /** Reads the one learner's profile and parent link. No writes. */
  loadAccount(childId: string): Promise<ActivityAccount | null>;
  /** The existing deletion steps used by the daily privacy job. */
  run(planned: PlannedDeletion): Promise<void>;
};

/**
 * Delete one declined learner now, using the same plan and steps as the
 * 30-day unapproved-account job. Only a child that is marked declined, has
 * never been approved and is not a class seat qualifies. Anything else is
 * left alone. If this fails, the account stays declined and the daily job
 * still removes it within 30 days of sign-up.
 */
export async function deleteDeclinedLearnerWith(
  deps: DeleteDeclinedLearnerDeps,
  childId: string,
): Promise<DeclinedLearnerDeletion> {
  const id = childId.trim();
  if (!id) return { deleted: false, reason: "not-found" };

  let account: ActivityAccount | null;
  try {
    account = await deps.loadAccount(id);
  } catch {
    return { deleted: false, reason: "failed" };
  }
  if (!account || account.id !== id) return { deleted: false, reason: "not-found" };
  if (account.accountStatus !== "declined") {
    return { deleted: false, reason: "not-declined" };
  }

  const planned = planUnapprovedAccountDeletion(account);
  if (!planned) return { deleted: false, reason: "not-declined" };

  try {
    await deps.run(planned);
  } catch {
    return { deleted: false, reason: "failed" };
  }
  return { deleted: true };
}

type Admin = ReturnType<typeof createAdminClient>;

async function loadDeclinedCandidate(
  admin: Admin,
  childId: string,
): Promise<ActivityAccount | null> {
  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "id, username, account_role, teacher_id, created_at, account_status, consent_approved_at",
    )
    .eq("id", childId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) return null;

  const { data: links, error: linkError } = await admin
    .from("parent_child")
    .select("parent_id")
    .eq("child_id", childId)
    .limit(1);
  if (linkError) throw new Error(linkError.message);
  const parentId =
    Array.isArray(links) && typeof links[0]?.parent_id === "string"
      ? links[0].parent_id
      : null;

  return mapActivityRow({ ...(profile as Record<string, unknown>), parent_id: parentId });
}

/** Server entry: delete one declined learner with the existing job's steps. */
export async function deleteDeclinedLearner(
  childId: string,
): Promise<DeclinedLearnerDeletion> {
  let admin: Admin;
  try {
    admin = createAdminClient();
  } catch {
    return { deleted: false, reason: "failed" };
  }
  return deleteDeclinedLearnerWith(
    {
      loadAccount: (id) => loadDeclinedCandidate(admin, id),
      run: (planned) => runDeletion(admin, planned, { notifyLinkedParent: false }),
    },
    childId,
  );
}
