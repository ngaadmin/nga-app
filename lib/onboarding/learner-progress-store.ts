import "server-only";

import {
  accountProgressLogFields,
  parseAccountProgressPayload,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Service-role reads and writes for learner_progress.
 * Not a Server Action. Callers must already know the target user is allowed
 * to see this row (their own id, or a child linked in parent_child).
 */
export async function readLearnerProgressRow(
  userId: string,
): Promise<AccountProgressPayload | null> {
  const trimmed = userId.trim();
  if (!trimmed) return null;

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

/**
 * Service-role read of learner_progress payloads.
 * Caller must already have limited userIds to people the session may see.
 */
export async function readLearnerProgressPayloads(
  userIds: readonly string[],
): Promise<Map<string, unknown>> {
  const ids = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  const map = new Map<string, unknown>();
  if (ids.length === 0) return map;

  const admin = createAdminClient();
  for (let index = 0; index < ids.length; index += 100) {
    const slice = ids.slice(index, index + 100);
    const { data, error } = await admin
      .from("learner_progress")
      .select("user_id, payload")
      .in("user_id", slice);

    if (error) {
      console.info("[learner-progress:read]", {
        found: "no",
        error: error.message,
      });
      continue;
    }

    for (const row of data ?? []) {
      if (!row || typeof row.user_id !== "string") continue;
      map.set(row.user_id, row.payload);
    }
  }

  return map;
}

export async function writeLearnerProgressRow(
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
