"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  toUsageEventInsert,
  type UsageEventInsert,
} from "@/lib/usage/usage-events";

/**
 * Persist one usage row.
 * Signed-in learners insert as themselves, so RLS keeps the username.
 * Guest sessions have no auth user. Those rows are written with the service
 * role only when the username is not already a profile, so a signed-out
 * caller cannot attach events to a real student.
 * Any failure — missing table, missing keys, RLS — is swallowed.
 */
export async function submitUsageEvent(input: unknown): Promise<void> {
  try {
    const row = toUsageEventInsert(input);
    if (!row) return;

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id?.trim();

    if (userId) {
      const identity = await readSignedInIdentity(asUsageClient(supabase), userId);
      if (!identity) return;
      await insertUsageRow(asUsageClient(supabase), row, identity);
      return;
    }

    await insertGuestUsageRow(row);
  } catch {
    // Table not migrated yet, Supabase not configured, or the network failed.
  }
}

type UsageIdentity = {
  username: string;
  classId: string | null;
};

type UsageResult = {
  data: unknown;
  error: { message: string } | null;
};

/** Narrow query surface. The Supabase client is cast in so type inference stays bounded. */
type UsageClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => PromiseLike<UsageResult>;
      };
    };
    insert: (value: Record<string, unknown>) => {
      setHeader: (name: string, value: string) => PromiseLike<UsageResult>;
    };
  };
};

function asUsageClient(client: unknown): UsageClient {
  return client as UsageClient;
}

async function readSignedInIdentity(
  supabase: UsageClient,
  userId: string,
): Promise<UsageIdentity | null> {
  const withClass = await supabase
    .from("profiles")
    .select("username, teacher_id")
    .eq("id", userId)
    .maybeSingle();

  const profile =
    withClass.error && /teacher_id|does not exist/i.test(withClass.error.message)
      ? await supabase.from("profiles").select("username").eq("id", userId).maybeSingle()
      : withClass;

  if (profile.error || !profile.data) return null;
  const record = asRecord(profile.data);
  if (!record) return null;
  const username = textField(record.username);
  if (!username) return null;
  return {
    username,
    classId: textField(record.teacher_id),
  };
}

async function insertGuestUsageRow(row: UsageEventInsert): Promise<void> {
  const admin = asUsageClient(createAdminClient());
  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", row.username)
    .maybeSingle();
  const existingRow = asRecord(existing);
  if (lookupError || existingRow?.id) return;

  await insertUsageRow(admin, row, { username: row.username, classId: null });
}

async function insertUsageRow(
  client: UsageClient,
  row: UsageEventInsert,
  identity: UsageIdentity,
): Promise<void> {
  // return=minimal so the insert does not need a SELECT policy.
  const { error } = await client
    .from("usage_events")
    .insert({
      username: identity.username,
      class_id: identity.classId,
      event_type: row.event_type,
      lesson_number: row.lesson_number,
      xp_total: row.xp_total,
      streak_days: row.streak_days,
      metadata: row.metadata,
    } as Record<string, unknown>)
    .setHeader("Prefer", "return=minimal");
  if (error) return;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function textField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
