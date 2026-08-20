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
    console.info("[learner-progress:read]", { userId: null, found: false });
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
    console.info("[learner-progress:read]", {
      userId: trimmed,
      found: Boolean(parsed),
      rowPresent: Boolean(data?.payload),
      error: error?.message ?? null,
      ...accountProgressLogFields(parsed),
    });
    if (error || !parsed) return null;
    return parsed;
  } catch (error) {
    console.info("[learner-progress:read]", {
      userId: trimmed,
      found: false,
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
  const summary = accountProgressLogFields(payload);

  if (!trimmed) {
    console.info("[learner-progress:write]", {
      userId: null,
      ok: false,
      ...summary,
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
      ok: !error,
      error: error?.message ?? null,
      ...summary,
    });
    return { ok: !error };
  } catch (error) {
    console.info("[learner-progress:write]", {
      userId: trimmed,
      ok: false,
      error: error instanceof Error ? error.message : "unknown",
      ...summary,
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
    console.info("[learner-progress:write]", {
      userId: null,
      ok: false,
      error: "no auth session",
      ...accountProgressLogFields(payload),
    });
    return { ok: false };
  }
  return saveLearnerProgressForUser(auth.user.id, payload);
}
