"use server";

import { createPhase1MilestoneScaffold } from "@/lib/dashboard/academy-state";
import {
  ACCOUNT_PROGRESS_SCHEMA_VERSION,
  parseAccountProgressPayload,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const COHORTS: readonly MasteryCohort[] = [
  "explorer",
  "pathfinder",
  "maverick",
];

export type UpdateLinkedChildLearningTrackResult =
  | { ok: true; username: string; nextCohort: MasteryCohort }
  | { ok: false; error: string };

function isMasteryCohort(value: string): value is MasteryCohort {
  return (COHORTS as readonly string[]).includes(value);
}

function resetLearningPayload(
  existing: AccountProgressPayload | null,
): AccountProgressPayload {
  return {
    schemaVersion: ACCOUNT_PROGRESS_SCHEMA_VERSION,
    academyProgress: createPhase1MilestoneScaffold(1),
    wallet: existing?.wallet ?? null,
    skillProgress: {},
    vaultProfile: existing?.vaultProfile ?? null,
    vaultSession: existing?.vaultSession ?? null,
  };
}

/**
 * Parent master: set a linked child's curriculum_cohort and reset Academy /
 * skill trophy progress in learner_progress.
 */
export async function updateLinkedChildLearningTrack(input: {
  childUserId: string;
  nextCohort: MasteryCohort;
}): Promise<UpdateLinkedChildLearningTrackResult> {
  const childUserId = input.childUserId.trim();
  if (!childUserId || !isMasteryCohort(input.nextCohort)) {
    return { ok: false, error: "Could not update this learning track." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in as a parent to change a learning track." };
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
          : "Could not update this learning track.",
    };
  }

  const { data: parentProfile } = await admin
    .from("profiles")
    .select("id, account_role")
    .eq("id", user.id)
    .maybeSingle();

  if (parentProfile?.account_role !== "parent_master") {
    return { ok: false, error: "Only a parent master can change a learner track." };
  }

  const { data: link } = await admin
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", user.id)
    .eq("child_id", childUserId)
    .maybeSingle();

  if (!link?.child_id) {
    return { ok: false, error: "This learner is not linked to your account." };
  }

  const { data: child } = await admin
    .from("profiles")
    .select("id, username, account_role, curriculum_cohort")
    .eq("id", childUserId)
    .maybeSingle();

  if (!child?.id || child.account_role !== "child") {
    return { ok: false, error: "Could not find this learner profile." };
  }

  const username =
    typeof child.username === "string" && child.username.trim()
      ? child.username.trim()
      : "learner";

  if (child.curriculum_cohort !== input.nextCohort) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({ curriculum_cohort: input.nextCohort })
      .eq("id", childUserId);

    if (updateError) {
      return {
        ok: false,
        error: updateError.message || "Could not update this learning track.",
      };
    }
  }

  const { data: progressRow } = await admin
    .from("learner_progress")
    .select("payload")
    .eq("user_id", childUserId)
    .maybeSingle();

  const existing = parseAccountProgressPayload(progressRow?.payload);
  const { error: progressError } = await admin.from("learner_progress").upsert(
    {
      user_id: childUserId,
      payload: resetLearningPayload(existing),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (progressError) {
    return {
      ok: false,
      error: progressError.message || "Could not reset this learner's progress.",
    };
  }

  return { ok: true, username, nextCohort: input.nextCohort };
}
