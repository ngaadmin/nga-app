import { createAdminClient } from "@/lib/supabase/admin";
import {
  consentRequestExpiresAt,
  generateOpaqueConsentToken,
  hashConsentToken,
} from "@/lib/auth/consent-request-token";
import { getDefaultAppUrl } from "@/lib/email/templates";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { findParentMasterByEmail } from "@/lib/onboarding/parent-master-lookup";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { headers } from "next/headers";

export type GuardianSignupEmailInput = {
  childId: string;
  username: string;
  birthYear: number;
  parentEmail: string;
  cohort: MasteryCohort;
  appUrl?: string;
};

/**
 * After Auth + profiles are created:
 * - Explorer: write consent_requests (vpc) and send EXPLORER_PARENT (hard-fail).
 * - Pathfinder: send PATHFINDER_PARENT_LINKED if a master exists, otherwise
 *   write consent_requests (parent_claim) and send PATHFINDER_PARENT (soft-fail).
 */
export async function issueGuardianSignupEmail(
  input: GuardianSignupEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parentEmail = input.parentEmail.trim().toLowerCase();
  const appUrl = input.appUrl ?? (await resolveSignupAppUrl());

  if (input.cohort === "explorer") {
    return issueExplorerVpcEmail({
      childId: input.childId,
      username: input.username,
      parentEmail,
      appUrl,
    });
  }

  if (input.cohort === "pathfinder") {
    return issuePathfinderParentEmail({
      childId: input.childId,
      username: input.username,
      parentEmail,
      appUrl,
    });
  }

  return { ok: true };
}

async function resolveSignupAppUrl(): Promise<string> {
  try {
    const headerList = await headers();
    const origin = headerList.get("origin")?.trim();
    if (origin) {
      return new URL(origin).origin;
    }
  } catch {
    // Server action without a request origin — use env / production fallback.
  }
  return getDefaultAppUrl();
}

async function issueExplorerVpcEmail(input: {
  childId: string;
  username: string;
  parentEmail: string;
  appUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const token = generateOpaqueConsentToken();
  const inserted = await insertConsentRequest(admin, {
    kind: "vpc",
    childId: input.childId,
    parentEmail: input.parentEmail,
    token,
  });

  if (!inserted.ok) {
    return inserted;
  }

  const sendResult = await sendOnboardingEmail({
    type: "EXPLORER_PARENT",
    recipientEmail: input.parentEmail,
    data: {
      username: input.username,
      token,
    },
    appUrl: input.appUrl,
  });

  if (!sendResult.success) {
    await admin.from("consent_requests").delete().eq("id", inserted.id);
    return {
      ok: false,
      error:
        sendResult.error ||
        "We could not send the parent approval email. Check the parent or guardian email address and try again.",
    };
  }

  return { ok: true };
}

async function issuePathfinderParentEmail(input: {
  childId: string;
  username: string;
  parentEmail: string;
  appUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existingMaster = await findParentMasterByEmail(input.parentEmail);

  if (existingMaster) {
    // FYI only — learner is already active; no claim token needed.
    await sendOnboardingEmail({
      type: "PATHFINDER_PARENT_LINKED",
      recipientEmail: input.parentEmail,
      data: {
        username: input.username,
        masterUsername: existingMaster.username,
      },
      appUrl: input.appUrl,
    });
    return { ok: true };
  }

  const admin = createAdminClient();
  const token = generateOpaqueConsentToken();
  const inserted = await insertConsentRequest(admin, {
    kind: "parent_claim",
    childId: input.childId,
    parentEmail: input.parentEmail,
    token,
  });

  if (!inserted.ok) {
    return { ok: true };
  }

  await sendOnboardingEmail({
    type: "PATHFINDER_PARENT",
    recipientEmail: input.parentEmail,
    data: {
      username: input.username,
      token,
    },
    appUrl: input.appUrl,
  });

  return { ok: true };
}

async function insertConsentRequest(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    kind: "vpc" | "parent_claim";
    childId: string;
    parentEmail: string;
    token: string;
    parentId?: string | null;
  },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("consent_requests")
    .insert({
      kind: input.kind,
      status: "pending",
      child_id: input.childId,
      parent_email: input.parentEmail,
      parent_id: input.parentId ?? null,
      token_hash: hashConsentToken(input.token),
      expires_at: consentRequestExpiresAt().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return {
      ok: false,
      error: error?.message || "Could not create the parent approval request.",
    };
  }

  return { ok: true, id: data.id };
}

