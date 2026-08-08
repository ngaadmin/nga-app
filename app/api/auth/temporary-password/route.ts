import { NextResponse } from "next/server";
import {
  authorizeBrowserMutation,
  clientIpKey,
} from "@/lib/auth/request-guard";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  generateTemporaryPassword,
  hashTemporaryPassword,
} from "@/lib/auth/temporary-password";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { EMAIL_PATTERN } from "@/lib/validation/email";

export const runtime = "nodejs";
const COHORTS: readonly MasteryCohort[] = [
  "explorer",
  "pathfinder",
  "maverick",
] as const;

type Body = {
  recipientEmail?: unknown;
  username?: unknown;
  cohort?: unknown;
};

function isCohort(value: unknown): value is MasteryCohort {
  return (
    typeof value === "string" &&
    (COHORTS as readonly string[]).includes(value)
  );
}

/**
 * Issues a crypto-random temporary password, emails it, and returns only the
 * salted hash for the client registry. Plaintext never leaves the server
 * except inside the outbound email. Hash is returned only after send handoff.
 */
export async function POST(request: Request) {
  const auth = authorizeBrowserMutation(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status },
    );
  }

  const ip = clientIpKey(request);
  const ipLimit = consumeRateLimit(`temp-password:ip:${ip}`, 5, 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  try {
    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const recipientEmail =
      typeof body.recipientEmail === "string"
        ? body.recipientEmail.trim().toLowerCase()
        : "";
    if (!recipientEmail || !EMAIL_PATTERN.test(recipientEmail)) {
      return NextResponse.json(
        { success: false, error: "A valid recipientEmail is required." },
        { status: 400 },
      );
    }

    const emailLimit = consumeRateLimit(
      `temp-password:email:${recipientEmail}`,
      3,
      15 * 60_000,
    );
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many recovery emails for this address. Try again in a few minutes.",
        },
        { status: 429 },
      );
    }

    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    if (!username) {
      return NextResponse.json(
        { success: false, error: "username is required." },
        { status: 400 },
      );
    }

    const cohort = isCohort(body.cohort) ? body.cohort : undefined;
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = hashTemporaryPassword(temporaryPassword);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const sendResult = await sendOnboardingEmail({
      type: "CREDENTIAL_RECOVERY",
      recipientEmail,
      data: {
        username,
        recoveryCode: temporaryPassword,
        cohort,
      },
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            sendResult.error ||
            "Could not send the recovery email. Try again shortly.",
        },
        { status: 502 },
      );
    }

    // Never rotate local hashes on a simulated/dev-only send in production.
    if (sendResult.simulated && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          error: "Recovery email could not be delivered.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true as const,
      passwordHash,
      expiresAt,
    });
  } catch (error) {
    console.error("[TEMPORARY_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Could not issue a temporary password." },
      { status: 500 },
    );
  }
}
