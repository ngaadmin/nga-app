"use server";

import "server-only";

import {
  accountProgressLogFields,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";
import { learnerProgressAccessAllowed } from "@/lib/onboarding/learner-progress-access";
import {
  readLearnerProgressRow,
  writeLearnerProgressRow,
} from "@/lib/onboarding/learner-progress-store";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user, or a parent_child child of that user.
 * The user id argument is a request. It is not trusted on its own.
 */
async function authorizeLearnerProgressTarget(
  requestedUserId: string,
): Promise<string | null> {
  const target = requestedUserId.trim();
  if (!target) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const actorId = user?.id?.trim();
  if (!actorId) return null;
  if (learnerProgressAccessAllowed({ actorId, targetUserId: target })) {
    return target;
  }

  const { data: links, error } = await supabase
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", actorId)
    .eq("child_id", target);

  if (error || !links?.length) return null;
  const linkedChildIds = links
    .map((row) => row.child_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  return learnerProgressAccessAllowed({
    actorId,
    targetUserId: target,
    linkedChildIds,
  })
    ? target
    : null;
}

export async function loadLearnerProgressByUserId(
  userId: string,
): Promise<AccountProgressPayload | null> {
  const trimmed = userId.trim();
  if (!trimmed) {
    console.info("[learner-progress:read]", {
      userId: null,
      found: "no",
      xp: 0,
      milestoneCount: 0,
    });
    return null;
  }

  try {
    const target = await authorizeLearnerProgressTarget(trimmed);
    if (!target) {
      console.info("[learner-progress:read]", {
        found: "no",
        denied: true,
        xp: 0,
        milestoneCount: 0,
      });
      return null;
    }
    return readLearnerProgressRow(target);
  } catch (error) {
    console.info("[learner-progress:read]", {
      found: "no",
      xp: 0,
      milestoneCount: 0,
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

export async function loadCurrentLearnerProgress(): Promise<AccountProgressPayload | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return null;
  return loadLearnerProgressByUserId(auth.user.id);
}

/**
 * Persist Academy / XP for the signed-in learner, or for a child linked to
 * the signed-in parent in parent_child.
 * Service role runs only after that check, because a parent session cannot
 * write the child's row under learner_progress RLS.
 */
export async function saveLearnerProgressForUser(
  userId: string,
  payload: AccountProgressPayload,
): Promise<{ ok: boolean }> {
  const trimmed = userId.trim();
  const fields = accountProgressLogFields(payload);

  if (!trimmed) {
    console.info("[learner-progress:write]", {
      userId: null,
      xp: fields.xp,
      milestoneCount: fields.milestoneCount,
    });
    return { ok: false };
  }

  try {
    const target = await authorizeLearnerProgressTarget(trimmed);
    if (!target) {
      console.info("[learner-progress:write]", {
        xp: fields.xp,
        milestoneCount: fields.milestoneCount,
        denied: true,
      });
      return { ok: false };
    }
    return writeLearnerProgressRow(target, payload);
  } catch (error) {
    console.info("[learner-progress:write]", {
      xp: fields.xp,
      milestoneCount: fields.milestoneCount,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false };
  }
}

/** @deprecated Prefer {@link saveLearnerProgressForUser} with the child profile id. */
export async function saveCurrentLearnerProgress(
  payload: AccountProgressPayload,
  userId?: string | null,
): Promise<{ ok: boolean }> {
  const explicitId = userId?.trim();
  if (explicitId) {
    return saveLearnerProgressForUser(explicitId, payload);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    const fields = accountProgressLogFields(payload);
    console.info("[learner-progress:write]", {
      userId: null,
      xp: fields.xp,
      milestoneCount: fields.milestoneCount,
      error: "no auth session",
    });
    return { ok: false };
  }
  return saveLearnerProgressForUser(auth.user.id, payload);
}
