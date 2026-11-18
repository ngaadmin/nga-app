import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/privacy/cron-auth";
import { runLaunchpadApprovalEmailSweep } from "@/lib/launchpad/parent-approval/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Hourly job for the Launchpad Level 4 parent approval emails. Vercel Cron calls
 * GET with the CRON_SECRET bearer token. It sends the one reminder, 24 hours
 * after the request email, to a parent who has not answered, and retries a
 * request email that failed. The reminder is claimed with a marker on the
 * venture row before it is sent, so running this twice never emails twice.
 * Counts only, no usernames or email addresses in the response.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const summary = await runLaunchpadApprovalEmailSweep(createAdminClient());
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error("[launchpad-parent-approval-emails]", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
