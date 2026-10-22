export const PRIVACY_RETENTION_JOB = "privacy-retention";

export const CRON_RUN_RPC = "record_cron_run";

export const CRON_RUN_RETENTION_DAYS = 60;

const DETAIL_KEY = /^[A-Za-z][A-Za-z0-9]{0,40}$/;

export type CronHeartbeatInput = {
  ok: boolean;
  detail: Record<string, number>;
};

export type CronHeartbeatClient = {
  rpc: (
    fn: typeof CRON_RUN_RPC,
    args: {
      p_job: string;
      p_ok: boolean;
      p_detail: Record<string, number>;
    },
  ) => PromiseLike<{ error: { message: string } | null }>;
};

export function isCountDetail(detail: Record<string, number>): boolean {
  const keys = Object.keys(detail);
  if (keys.length > 20) return false;
  return keys.every((key) => {
    const value = detail[key];
    return DETAIL_KEY.test(key) && typeof value === "number" && Number.isFinite(value);
  });
}

export type CronCountSummary = {
  auditLogRemoved: number | null;
  guestUsageRemoved: number | null;
  warningsSent: number;
  warningsCleared: number;
  accountsDeleted: number;
  errors: readonly string[];
};

/** Counts only. Error text, usernames, and emails stay out of the heartbeat. */
export function cronDetailFromSummary(summary: CronCountSummary): Record<string, number> {
  const detail: Record<string, number> = {
    warningsSent: summary.warningsSent,
    warningsCleared: summary.warningsCleared,
    accountsDeleted: summary.accountsDeleted,
    errorCount: summary.errors.length,
  };
  if (typeof summary.auditLogRemoved === "number" && Number.isFinite(summary.auditLogRemoved)) {
    detail.auditLogRemoved = summary.auditLogRemoved;
  }
  if (
    typeof summary.guestUsageRemoved === "number" &&
    Number.isFinite(summary.guestUsageRemoved)
  ) {
    detail.guestUsageRemoved = summary.guestUsageRemoved;
  }
  return detail;
}

export async function writeCronHeartbeat(
  admin: CronHeartbeatClient,
  input: CronHeartbeatInput,
): Promise<boolean> {
  if (!isCountDetail(input.detail)) return false;
  try {
    const { error } = await admin.rpc(CRON_RUN_RPC, {
      p_job: PRIVACY_RETENTION_JOB,
      p_ok: input.ok,
      p_detail: input.detail,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Record the privacy cron after the maintenance pass. A failed heartbeat
 * adds a fixed error and does not copy the maintenance error text.
 */
export async function recordPrivacyCronResult(
  write: (input: CronHeartbeatInput) => Promise<boolean>,
  summary: CronCountSummary,
): Promise<CronCountSummary> {
  const detail = cronDetailFromSummary(summary);
  try {
    const saved = await write({
      ok: summary.errors.length === 0,
      detail,
    });
    if (saved) return summary;
  } catch {
    // The message below is the only extra text.
  }
  return {
    ...summary,
    errors: [...summary.errors, "Could not record the cron run."],
  };
}
