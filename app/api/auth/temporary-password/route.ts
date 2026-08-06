import { NextResponse } from "next/server";
import {
  generateTemporaryPassword,
  hashTemporaryPassword,
} from "@/lib/auth/temporary-password";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

export const runtime = "nodejs";

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
  const limit = consumeRateLimit(
    `temp-password:${clientKey(request)}`,
    10,
    60_000,
  );
  if (!limit.allowed) {
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
