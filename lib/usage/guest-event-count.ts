import { APP_VERSION } from "@/lib/app-version";
import {
  toUsageEventInsert,
  type UsageEventType,
} from "@/lib/usage/usage-events";

export { APP_VERSION };

export const GUEST_COUNT_RPC = "increment_guest_event_count";

export const UNKNOWN_COUNTRY = "ZZ";

const INT4_MAX = 2_147_483_647;

export const DEVICE_TYPES = ["mobile", "tablet", "desktop"] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];

export type GuestCountDimensions = {
  day: string;
  eventType: UsageEventType;
  lessonNumber: number | null;
  appVersion: string;
  deviceType: DeviceType;
  country: string;
};

export type GuestCountRow = GuestCountDimensions & {
  count: number;
};

/** Arguments for public.increment_guest_event_count. Nothing else. */
export type GuestCountRpcArgs = {
  p_day: string;
  p_event_type: UsageEventType;
  p_lesson_number: number | null;
  p_app_version: string;
  p_device_type: DeviceType;
  p_country: string;
};

export type GuestCountEvent = {
  eventType: UsageEventType;
  lessonNumber: number | null;
};

const APP_VERSION_PATTERN = /^[0-9A-Za-z._+-]{1,32}$/;

export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Missing or unreadable agent counts as desktop. The raw string is not kept. */
export function classifyDevice(userAgent: string | null | undefined): DeviceType {
  const ua = typeof userAgent === "string" ? userAgent : "";
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/android/i.test(ua) && !/mobile/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

/** Two-letter country code, or ZZ. The raw header is not kept. */
export function countryFromHeader(value: string | null | undefined): string {
  if (typeof value !== "string") return UNKNOWN_COUNTRY;
  const code = value.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return code;
  return UNKNOWN_COUNTRY;
}

export function cleanAppVersion(value: string): string | null {
  const trimmed = value.trim();
  if (!APP_VERSION_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/**
 * Event type and lesson number only. Username, coins, XP, streak, and any
 * other field on the input are ignored.
 */
export function toGuestCountInput(input: unknown): GuestCountEvent | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const draft = input as Record<string, unknown>;
  const parsed = toUsageEventInsert({
    eventType: draft.eventType ?? draft.event_type,
    username: "guest-count",
    lessonNumber: draft.lessonNumber ?? draft.lesson_number,
  });
  if (!parsed) return null;
  return {
    eventType: parsed.event_type,
    lessonNumber: parsed.lesson_number,
  };
}

export function dimensionsFromHeaders(
  headerGet: (name: string) => string | null,
  now: Date,
  appVersion: string,
  event: GuestCountEvent,
): GuestCountDimensions | null {
  const version = cleanAppVersion(appVersion);
  if (!version) return null;
  return {
    day: utcDay(now),
    eventType: event.eventType,
    lessonNumber: event.lessonNumber,
    appVersion: version,
    deviceType: classifyDevice(headerGet("user-agent")),
    country: countryFromHeader(headerGet("x-vercel-ip-country")),
  };
}

export function guestCountRpcArgs(row: GuestCountDimensions): GuestCountRpcArgs {
  return {
    p_day: row.day,
    p_event_type: row.eventType,
    p_lesson_number: row.lessonNumber,
    p_app_version: row.appVersion,
    p_device_type: row.deviceType,
    p_country: row.country,
  };
}

/** Same bucket rule as the UNIQUE NULLS NOT DISTINCT constraint. */
export function guestCountKey(row: GuestCountDimensions): string {
  return [
    row.day,
    row.eventType,
    row.lessonNumber == null ? "" : String(row.lessonNumber),
    row.appVersion,
    row.deviceType,
    row.country,
  ].join("\n");
}

/** Mirrors the SQL upsert: one bucket, count + 1, capped at the integer max. */
export function applyGuestCountUpsert(
  rows: readonly GuestCountRow[],
  next: GuestCountDimensions,
): GuestCountRow[] {
  const key = guestCountKey(next);
  let found = false;
  const updated = rows.map((row) => {
    if (guestCountKey(row) !== key) return row;
    found = true;
    return { ...row, count: Math.min(INT4_MAX, row.count + 1) };
  });
  if (found) return updated;
  return [...updated, { ...next, count: 1 }];
}
