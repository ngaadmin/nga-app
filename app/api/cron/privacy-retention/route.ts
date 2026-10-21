import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/privacy/cron-auth";
import { runPrivacyMaintenance } from "@/lib/privacy/run-privacy-maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily retention job. Vercel Cron calls GET with the CRON_SECRET bearer token.
 * Learner accounts still waiting for parent approval are deleted after 30 days.
 * Other inactive accounts still follow the 12-month warning. The approval
 * link itself still expires after 24 hours.
 * Counts only — no usernames or email addresses in the response.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const summary = await runPrivacyMaintenance();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error("[privacy-retention]", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
