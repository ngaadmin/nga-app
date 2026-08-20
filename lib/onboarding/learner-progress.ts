"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  parseAccountProgressPayload,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";

export async function loadLearnerProgressByUserId(
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

    if (error || !data?.payload) return null;
    return parseAccountProgressPayload(data.payload);
  } catch {
    return null;
  }
}

export async function loadCurrentLearnerProgress(): Promise<AccountProgressPayload | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return null;
  return loadLearnerProgressByUserId(auth.user.id);
}

export async function saveCurrentLearnerProgress(
  payload: AccountProgressPayload,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return { ok: false };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("learner_progress").upsert(
      {
        user_id: auth.user.id,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
