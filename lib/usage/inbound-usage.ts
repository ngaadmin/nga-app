import "server-only";

import { APP_VERSION } from "@/lib/app-version";
import {
  acceptUsageReport,
  type SignedInUsageWrite,
  type UsageIdentity,
} from "@/lib/usage/accept-usage-report";
import { GUEST_COUNT_RPC, type GuestCountRpcArgs } from "@/lib/usage/guest-event-count";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type UsageResult = {
  data: unknown;
  error: { message: string } | null;
};

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

type CountClient = {
  rpc: (
    fn: string,
    args: GuestCountRpcArgs,
  ) => PromiseLike<{ error: { message: string } | null }>;
};

function asUsageClient(client: unknown): UsageClient {
  return client as UsageClient;
}

function asCountClient(client: unknown): CountClient {
  return client as CountClient;
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

async function insertUsageRow(
  client: UsageClient,
  row: SignedInUsageWrite,
): Promise<void> {
  const { error } = await client
    .from("usage_events")
    .insert({
      username: row.username,
      class_id: row.class_id,
      event_type: row.event_type,
      lesson_number: row.lesson_number,
      xp_total: row.xp_total,
      streak_days: row.streak_days,
      metadata: row.metadata,
    })
    .setHeader("Prefer", "return=minimal");
  if (error) return;
}

/**
 * Persist one activity report.
 * A signed-in learner writes usage_events as themselves.
 * A guest increments guest_event_counts. Guests never write usage_events.
 */
export async function acceptInboundUsage(
  input: unknown,
  headerGet: (name: string) => string | null,
): Promise<void> {
  try {
    const supabase = await createClient();
    const usage = asUsageClient(supabase);
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id?.trim() || null;
    const identity = userId ? await readSignedInIdentity(usage, userId) : null;

    await acceptUsageReport(input, {
      now: new Date(),
      appVersion: APP_VERSION,
      headerGet,
      userId,
      identity,
      insertUsageEvent: async (row) => {
        await insertUsageRow(usage, row);
      },
      incrementGuestCount: async (args) => {
        const admin = asCountClient(createAdminClient());
        const { error } = await admin.rpc(GUEST_COUNT_RPC, args);
        if (error) return;
      },
    });
  } catch {
    // Table not migrated yet, Supabase not configured, or the network failed.
  }
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
