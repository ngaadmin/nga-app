import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import { APP_VERSION } from "@/lib/app-version";
import {
  applyGuestCountUpsert,
  classifyDevice,
  countryFromHeader,
  dimensionsFromHeaders,
  guestCountRpcArgs,
  toGuestCountInput,
  utcDay,
  type GuestCountRow,
} from "@/lib/usage/guest-event-count";

const NOW = new Date("2026-10-21T01:00:00.000Z");

describe("guest count dimensions", () => {
  it("uses the package version and a UTC day", () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(utcDay(NOW)).toBe("2026-10-21");
    expect(utcDay(new Date("2026-10-21T00:30:00.000+10:00"))).toBe("2026-10-20");
  });

  it("classifies a coarse device and a country code, and drops the raw header", () => {
    expect(classifyDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile")).toBe(
      "mobile",
    );
    expect(classifyDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Mobile")).toBe("tablet");
    expect(classifyDevice("Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit Mobile")).toBe(
      "mobile",
    );
    expect(classifyDevice("Mozilla/5.0 (Linux; Android 14; SM-T870) AppleWebKit")).toBe("tablet");
    expect(classifyDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
    expect(classifyDevice(null)).toBe("desktop");
    expect(classifyDevice("")).toBe("desktop");

    expect(countryFromHeader("au")).toBe("AU");
    expect(countryFromHeader("US")).toBe("US");
    expect(countryFromHeader("Australia")).toBe("ZZ");
    expect(countryFromHeader("")).toBe("ZZ");
    expect(countryFromHeader(null)).toBe("ZZ");
  });

  it("keeps only the day bucket fields", () => {
    const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148";
    const dimensions = dimensionsFromHeaders(
      (name) => {
        if (name === "user-agent") return userAgent;
        if (name === "x-vercel-ip-country") return "au";
        if (name === "x-forwarded-for") return "203.0.113.8";
        return null;
      },
      NOW,
      APP_VERSION,
      { eventType: "vault_visit", lessonNumber: null },
    );

    expect(dimensions).toEqual({
      day: "2026-10-21",
      eventType: "vault_visit",
      lessonNumber: null,
      appVersion: "0.1.0",
      deviceType: "mobile",
      country: "AU",
    });
    expect(JSON.stringify(dimensions)).not.toContain(userAgent);
    expect(JSON.stringify(dimensions)).not.toContain("203.0.113.8");
    expect(guestCountRpcArgs(dimensions!)).toEqual({
      p_day: "2026-10-21",
      p_event_type: "vault_visit",
      p_lesson_number: null,
      p_app_version: "0.1.0",
      p_device_type: "mobile",
      p_country: "AU",
    });
  });

  it("ignores a guest handle, coins, and streak on the way in", () => {
    expect(
      toGuestCountInput({
        eventType: "lesson_started",
        lessonNumber: 3,
        username: "Penny1842",
        xpTotal: 40,
        streakDays: 2,
        metadata: { ip: "203.0.113.8" },
      }),
    ).toEqual({ eventType: "lesson_started", lessonNumber: 3 });
    expect(
      toGuestCountInput({ eventType: "login", lessonNumber: 8, username: "Penny1842" }),
    ).toEqual({ eventType: "login", lessonNumber: null });
  });
});

describe("guest count upsert", () => {
  const base = {
    day: "2026-10-21",
    eventType: "lesson_started" as const,
    lessonNumber: null as number | null,
    appVersion: "0.1.0",
    deviceType: "desktop" as const,
    country: "AU",
  };

  it("increments one bucket, including a null lesson number", () => {
    const first = applyGuestCountUpsert([], base);
    const second = applyGuestCountUpsert(first, { ...base, lessonNumber: null });
    const otherLesson = applyGuestCountUpsert(second, { ...base, lessonNumber: 2 });
    const otherCountry = applyGuestCountUpsert(otherLesson, { ...base, country: "NZ" });

    expect(second).toEqual([{ ...base, count: 2 }]);
    expect(otherCountry).toEqual([
      { ...base, count: 2 },
      { ...base, lessonNumber: 2, count: 1 },
      { ...base, country: "NZ", count: 1 },
    ]);
  });

  it("caps the count at the integer maximum", () => {
    const full: GuestCountRow = { ...base, count: 2_147_483_647 };
    expect(applyGuestCountUpsert([full], base)).toEqual([full]);
  });
});

describe("guest_event_counts migration", () => {
  const sql = readFileSync(
    path.join(process.cwd(), "supabase/migrations/20261021120000_guest_event_counts.sql"),
    "utf8",
  );

  it("upserts on a null-safe unique key and keeps the table closed", () => {
    expect(sql).toContain("UNIQUE NULLS NOT DISTINCT");
    expect(sql).toContain("ON CONFLICT ON CONSTRAINT guest_event_counts_dimensions_key");
    expect(sql).toContain("public.guest_event_counts.count + 1");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("private.increment_guest_event_count");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain(
      "REVOKE ALL ON TABLE public.guest_event_counts FROM PUBLIC, anon, authenticated, service_role",
    );
    expect(sql).not.toMatch(
      /GRANT\s+(SELECT|INSERT|UPDATE|ALL)[^;]*guest_event_counts[^;]*TO\s+(anon|authenticated)/i,
    );
    expect(sql).toContain("'lesson_abandoned'");
    expect(sql).not.toMatch(/INSERT\s+INTO\s+public\.usage_events/i);
  });

  it("does not log request headers", () => {
    for (const relative of [
      "lib/usage/guest-event-count.ts",
      "lib/usage/accept-usage-report.ts",
      "lib/usage/inbound-usage.ts",
      "lib/usage/lesson-abandon.ts",
      "app/api/usage/event/route.ts",
    ]) {
      const source = readFileSync(path.join(process.cwd(), relative), "utf8");
      expect(source).not.toMatch(/\bconsole\./);
      expect(source).not.toMatch(/x-forwarded-for|x-real-ip|x-vercel-forwarded-for/i);
    }
  });
});
