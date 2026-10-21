"use server";

import "server-only";

import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  generateOpaqueConsentToken,
} from "@/lib/auth/consent-request-token";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { rotateConsentRequestToken } from "@/lib/onboarding/lookup-consent-request";
import { parseMasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ResendExplorerPendingResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Resend the VPC approval email for the signed-in pending child.
 * Any under-16 track can be pending. Active accounts are rejected.
 */
export async function resendExplorerPendingApprovalEmail(): Promise<ResendExplorerPendingResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const childId = auth.user?.id?.trim();
  if (!childId) {
    return {
      ok: false,
      error: "Sign in again, then we can resend the approval email.",
    };
  }

  const limit = consumeRateLimit(
    `explorer-pending-resend:${childId}`,
    3,
    15 * 60_000,
  );
  if (!limit.allowed) {
    return {
      ok: false,
      error: "Too many approval emails. Wait a few minutes, then try again.",
    };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, username, account_status, account_role, curriculum_cohort")
    .eq("id", childId)
    .maybeSingle();

  if (profileError || !profile?.id || !profile.username) {
    return { ok: false, error: "We could not find this profile." };
  }
  if (profile.account_role === "parent_master") {
    return { ok: false, error: "Parent accounts don't need this approval email." };
  }
  if (profile.account_status !== "pending_consent") {
    return {
      ok: false,
      error: "This profile is already approved. No new email is needed.",
    };
  }
  const { data: request } = await admin
    .from("consent_requests")
    .select("id, parent_email")
    .eq("child_id", childId)
    .eq("kind", "vpc")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const parentEmail =
    typeof request?.parent_email === "string"
      ? request.parent_email.trim().toLowerCase()
      : "";
  if (!request?.id || !parentEmail) {
    return {
      ok: false,
      error:
        "We could not find an approval request to resend. Ask a parent or guardian to check their inbox.",
    };
  }

  const nextToken = generateOpaqueConsentToken();
  const rotated = await rotateConsentRequestToken({
    requestId: request.id,
    nextToken,
  });
  if (!rotated) {
    return {
      ok: false,
      error: "We could not refresh this approval link. Try again shortly.",
    };
  }

  const sendResult = await sendOnboardingEmail({
    type: "EXPLORER_PARENT",
    recipientEmail: parentEmail,
    data: {
      username: profile.username,
      token: nextToken,
      track: parseMasteryCohort(profile.curriculum_cohort) ?? undefined,
    },
  });

  if (!sendResult.success) {
    return {
      ok: false,
      error:
        sendResult.error ||
        "We could not resend the approval email. Please try again shortly.",
    };
  }

  return { ok: true };
}
