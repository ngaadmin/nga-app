"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  accountProgressLogFields,
  parseAccountProgressPayload,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";

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
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("learner_progress")
      .select("payload")
      .eq("user_id", trimmed)
      .maybeSingle();

    const parsed = error ? null : parseAccountProgressPayload(data?.payload);
    const fields = accountProgressLogFields(parsed);
    console.info("[learner-progress:read]", {
      userId: trimmed,
      found: parsed ? "yes" : "no",
      xp: fields.xp,
      milestoneCount: fields.milestoneCount,
      ...(error?.message ? { error: error.message } : {}),
    });
    if (error || !parsed) return null;
    return parsed;
  } catch (error) {
    console.info("[learner-progress:read]", {
      userId: trimmed,
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
 * Persist Academy / XP for a specific child profile id.
 * Uses service role so Explorer writes do not depend on the Auth cookie
 * (parent sessions and missing cookies were dropping the only copy).
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
    const admin = createAdminClient();
    const { error } = await admin.from("learner_progress").upsert(
      {
        user_id: trimmed,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    console.info("[learner-progress:write]", {
      userId: trimmed,
      xp: fields.xp,
      milestoneCount: fields.milestoneCount,
      ...(error?.message ? { error: error.message } : {}),
    });
    return { ok: !error };
  } catch (error) {
    console.info("[learner-progress:write]", {
      userId: trimmed,
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
