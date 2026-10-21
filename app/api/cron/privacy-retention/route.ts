import { NextResponse } from "next/server";
import {
  recordPrivacyCronResult,
  writeCronHeartbeat,
  type CronHeartbeatClient,
} from "@/lib/privacy/cron-heartbeat";
import { authorizeCronRequest } from "@/lib/privacy/cron-auth";
import { runPrivacyMaintenance } from "@/lib/privacy/run-privacy-maintenance";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily retention job. Vercel Cron calls GET with the CRON_SECRET bearer token.
 * Counts only — no usernames or email addresses in the response.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const summary = await recordPrivacyCronResult(
      (input) => writeCronHeartbeat(createAdminClient() as CronHeartbeatClient, input),
      await runPrivacyMaintenance(),
    );
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error("[privacy-retention]", {
      message: error instanceof Error ? error.message : "unknown",
    });
    try {
      await writeCronHeartbeat(createAdminClient() as CronHeartbeatClient, {
        ok: false,
        detail: { errorCount: 1 },
      });
    } catch {
      // A missing heartbeat table must not change this response.
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
