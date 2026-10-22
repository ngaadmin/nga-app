import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  CRON_RUN_RETENTION_DAYS,
  cronDetailFromSummary,
  isCountDetail,
  PRIVACY_RETENTION_JOB,
  recordPrivacyCronResult,
  writeCronHeartbeat,
  type CronHeartbeatClient,
} from "@/lib/privacy/cron-heartbeat";

describe("cron heartbeat", () => {
  it("stores counts only", () => {
    const detail = cronDetailFromSummary({
      auditLogRemoved: 3,
      guestUsageRemoved: null,
      warningsSent: 1,
      warningsCleared: 0,
      accountsDeleted: 2,
      errors: ["Could not delete River <river@example.com>"],
    });

    expect(detail).toEqual({
      auditLogRemoved: 3,
      warningsSent: 1,
      warningsCleared: 0,
      accountsDeleted: 2,
      errorCount: 1,
    });
    expect(JSON.stringify(detail)).not.toMatch(/River|example\.com/);
    expect(isCountDetail(detail)).toBe(true);
    expect(isCountDetail({ "not a key": 1 })).toBe(false);
    expect(isCountDetail({ errorCount: Number.NaN })).toBe(false);
  });

  it("writes one privacy-retention row and reports a missed heartbeat", async () => {
    const rpc = vi.fn(
      async (): Promise<{ error: { message: string } | null }> => ({ error: null }),
    );
    const admin: CronHeartbeatClient = { rpc };
    const summary = {
      auditLogRemoved: 0,
      guestUsageRemoved: 4,
      warningsSent: 0,
      warningsCleared: 0,
      accountsDeleted: 0,
      errors: [],
    };

    const saved = await recordPrivacyCronResult(
      (input) => writeCronHeartbeat(admin, input),
      summary,
    );

    expect(saved).toEqual(summary);
    expect(rpc).toHaveBeenCalledWith("record_cron_run", {
      p_job: PRIVACY_RETENTION_JOB,
      p_ok: true,
      p_detail: {
        auditLogRemoved: 0,
        guestUsageRemoved: 4,
        warningsSent: 0,
        warningsCleared: 0,
        accountsDeleted: 0,
        errorCount: 0,
      },
    });

    rpc.mockResolvedValueOnce({ error: { message: "relation cron_runs does not exist" } });
    const missed = await recordPrivacyCronResult(
      (input) => writeCronHeartbeat(admin, input),
      summary,
    );
    expect(missed.errors).toEqual(["Could not record the cron run."]);
  });

  it("prunes cron_runs after 60 days in the migration", () => {
    const sql = readFileSync(
      path.join(process.cwd(), "supabase/migrations/20261021120000_guest_event_counts.sql"),
      "utf8",
    );

    expect(CRON_RUN_RETENTION_DAYS).toBe(60);
    expect(sql).toContain("private.record_cron_run");
    expect(sql).toContain("DELETE FROM public.cron_runs");
    expect(sql).toContain("interval '60 days'");
    expect(sql).toContain("cron_runs_detail_counts_only");
    expect(sql).toContain("jsonb_typeof(entry.value) <> 'number'");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain(
      "REVOKE ALL ON TABLE public.cron_runs FROM PUBLIC, anon, authenticated, service_role",
    );
  });
});
