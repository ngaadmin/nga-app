import {
  dimensionsFromHeaders,
  guestCountRpcArgs,
  toGuestCountInput,
  type GuestCountRpcArgs,
} from "@/lib/usage/guest-event-count";
import {
  toUsageEventInsert,
  type UsageEventInsert,
} from "@/lib/usage/usage-events";

export type UsageIdentity = {
  username: string;
  classId: string | null;
};

export type SignedInUsageWrite = {
  username: string;
  class_id: string | null;
  event_type: UsageEventInsert["event_type"];
  lesson_number: number | null;
  xp_total: number | null;
  streak_days: number | null;
  metadata: Record<string, unknown>;
};

export type UsageReportSink = {
  now: Date;
  appVersion: string;
  headerGet: (name: string) => string | null;
  userId: string | null;
  identity: UsageIdentity | null;
  insertUsageEvent: (row: SignedInUsageWrite) => Promise<void>;
  incrementGuestCount: (args: GuestCountRpcArgs) => Promise<void>;
};

export function toSignedInUsageWrite(
  input: unknown,
  identity: UsageIdentity,
): SignedInUsageWrite | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const draft = input as Record<string, unknown>;
  const parsed = toUsageEventInsert({
    eventType: draft.eventType ?? draft.event_type,
    username: identity.username,
    lessonNumber: draft.lessonNumber ?? draft.lesson_number,
    xpTotal: draft.xpTotal ?? draft.xp_total,
    streakDays: draft.streakDays ?? draft.streak_days,
    metadata: draft.metadata,
  });
  if (!parsed) return null;
  return {
    username: identity.username,
    class_id: identity.classId,
    event_type: parsed.event_type,
    lesson_number: parsed.lesson_number,
    xp_total: parsed.xp_total,
    streak_days: parsed.streak_days,
    metadata: parsed.metadata,
  };
}

/**
 * Signed-in learners insert one usage_events row under their profile name.
 * Everyone else increments a guest count. Guest writes never include a
 * handle, a timestamp, coins, XP, or a streak, and never touch usage_events.
 */
export async function acceptUsageReport(
  input: unknown,
  sink: UsageReportSink,
): Promise<void> {
  const event = toGuestCountInput(input);
  if (!event) return;

  const userId = sink.userId?.trim() ?? "";
  if (userId) {
    if (!sink.identity) return;
    const row = toSignedInUsageWrite(input, sink.identity);
    if (!row) return;
    await sink.insertUsageEvent(row);
    return;
  }

  const dimensions = dimensionsFromHeaders(
    sink.headerGet,
    sink.now,
    sink.appVersion,
    event,
  );
  if (!dimensions) return;
  await sink.incrementGuestCount(guestCountRpcArgs(dimensions));
}
