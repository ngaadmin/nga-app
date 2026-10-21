import { describe, expect, it, vi } from "vitest";
import { APP_VERSION } from "@/lib/app-version";
import {
  acceptUsageReport,
  type SignedInUsageWrite,
  type UsageReportSink,
} from "@/lib/usage/accept-usage-report";
import type { GuestCountRpcArgs } from "@/lib/usage/guest-event-count";

const NOW = new Date("2026-10-21T16:00:00.000Z");

function sink() {
  const headerGet = vi.fn((name: string): string | null => {
    if (name === "user-agent") return "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
    if (name === "x-vercel-ip-country") return "AU";
    if (name === "x-forwarded-for") return "203.0.113.9";
    return null;
  });
  const insertUsageEvent = vi.fn(async (row: SignedInUsageWrite) => {
    void row;
  });
  const incrementGuestCount = vi.fn(async (args: GuestCountRpcArgs) => {
    void args;
  });
  const report: UsageReportSink = {
    now: NOW,
    appVersion: APP_VERSION,
    headerGet,
    userId: null,
    identity: null,
    insertUsageEvent,
    incrementGuestCount,
  };
  return { report, headerGet, insertUsageEvent, incrementGuestCount };
}

describe("acceptUsageReport", () => {
  it("counts a guest and never writes usage_events", async () => {
    const report = sink();
    await acceptUsageReport(
      {
        eventType: "lesson_started",
        lessonNumber: 2,
        username: "Penny1842",
        xpTotal: 80,
        streakDays: 4,
        metadata: { userAgent: "Mozilla/5.0", ip: "203.0.113.9" },
      },
      report.report,
    );

    expect(report.insertUsageEvent).not.toHaveBeenCalled();
    expect(report.incrementGuestCount).toHaveBeenCalledTimes(1);
    const args = report.incrementGuestCount.mock.calls[0]?.[0];
    expect(args).toEqual({
      p_day: "2026-10-21",
      p_event_type: "lesson_started",
      p_lesson_number: 2,
      p_app_version: APP_VERSION,
      p_device_type: "desktop",
      p_country: "AU",
    });
    expect(JSON.stringify(args)).not.toMatch(/Penny|xp|streak|Mozilla|203\.0\.113\.9/i);
  });

  it("writes a signed-in lesson_abandoned row and does not read count headers", async () => {
    const headerGet = vi.fn((): string | null => {
      throw new Error("signed-in usage must not read count headers");
    });
    const report = sink();
    report.report.userId = "user-1";
    report.report.identity = { username: "River", classId: "class-9" };
    report.report.headerGet = headerGet;

    await acceptUsageReport(
      {
        eventType: "lesson_abandoned",
        lessonNumber: 5,
        username: "Penny1842",
        xpTotal: 12,
        streakDays: 1,
      },
      report.report,
    );

    expect(report.incrementGuestCount).not.toHaveBeenCalled();
    expect(headerGet).not.toHaveBeenCalled();
    expect(report.insertUsageEvent).toHaveBeenCalledWith({
      username: "River",
      class_id: "class-9",
      event_type: "lesson_abandoned",
      lesson_number: 5,
      xp_total: 12,
      streak_days: 1,
      metadata: {},
    });
  });
});
