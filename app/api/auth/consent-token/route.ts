import { NextRequest, NextResponse } from "next/server";
import {
  isConsentTokenUnexpired,
  verifyConsentToken,
  type ConsentTokenClaims,
} from "@/lib/auth/consent-token";
import { generateOpaqueConsentToken } from "@/lib/auth/consent-request-token";
import {
  authorizeBrowserMutation,
  clientIpKey,
} from "@/lib/auth/request-guard";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { requiresParentConsentForBirthYear } from "@/lib/dashboard/mastery-cohort";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { resolveTrustedAppUrl } from "@/lib/email/templates";
import {
  lookupConsentRequestByToken,
  rotateConsentRequestToken,
} from "@/lib/onboarding/lookup-consent-request";

export const runtime = "nodejs";

function toPendingPayload(token: string, claims: ConsentTokenClaims) {
  return {
    token,
    parentEmail: claims.parentEmail,
    childUsername: claims.childUsername,
    birthYear: claims.birthYear,
    createdAt: claims.createdAt,
    passcodeHash: claims.passcodeHash,
  };
}

type ResendBody = {
  action: "resend";
  token?: unknown;
};

/**
 * Re-issue + email a fresh approval link from a stored consent request.
 * Accepts expired rows. Does not accept a free-floating HMAC token, and does
 * not take a caller-chosen recipient.
 */
async function handleResend(
  request: Request,
  body: ResendBody,
): Promise<NextResponse> {
  const ip = clientIpKey(request);
  const ipLimit = consumeRateLimit(`consent-resend:ip:${ip}`, 5, 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json(
      { success: false, error: "token is required." },
      { status: 400 },
    );
  }

  const stored = await lookupConsentRequestByToken(token);
  if (
    (stored.status !== "valid" && stored.status !== "expired") ||
    !stored.request
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid consent token." },
      { status: 400 },
    );
  }

  const { parentEmail, childUsername, birthYear, id } = stored.request;
  if (!parentEmail || !childUsername || birthYear == null) {
    return NextResponse.json(
      { success: false, error: "Invalid consent token." },
      { status: 400 },
    );
  }

  if (!requiresParentConsentForBirthYear(birthYear)) {
    return NextResponse.json(
      {
        success: false,
        error: "Parent approval resend is only available for Explorer profiles.",
      },
      { status: 400 },
    );
  }

  const emailLimit = consumeRateLimit(
    `consent-resend:email:${parentEmail}`,
    3,
    15 * 60_000,
  );
  if (!emailLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Too many approval emails for this address. Try again in a few minutes.",
      },
      { status: 429 },
    );
  }

  const createdAt = new Date().toISOString();
  const nextToken = generateOpaqueConsentToken();
  const rotated = await rotateConsentRequestToken({
    requestId: id,
    nextToken,
  });
  if (!rotated) {
    return NextResponse.json(
      { success: false, error: "Could not refresh this approval link." },
      { status: 502 },
    );
  }

  const sendResult = await sendOnboardingEmail({
    type: "EXPLORER_PARENT",
    recipientEmail: parentEmail,
    data: {
      username: childUsername,
      token: nextToken,
    },
    appUrl: resolveTrustedAppUrl(request.headers.get("origin")),
  });

  if (!sendResult.success) {
    return NextResponse.json(
      {
        success: false,
        error:
          sendResult.error ||
          "Could not resend the approval email. Try again shortly.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true as const,
    token: nextToken,
    createdAt,
    childUsername,
  });
}

/**
 * Resend a stored approval link.
 * Minting a new link from caller-supplied email and username is refused:
 * signup creates the stored token on the server.
 */
export async function POST(request: Request) {
  const auth = authorizeBrowserMutation(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status },
    );
  }

  try {
    let body: { action?: unknown; token?: unknown };
    try {
      body = (await request.json()) as { action?: unknown; token?: unknown };
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (body && typeof body === "object" && body.action === "resend") {
      return handleResend(request, body as ResendBody);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Approval links are created during signup. This route cannot mint a new one.",
      },
      { status: 403 },
    );
  } catch (error) {
    console.error("[CONSENT_TOKEN_ISSUE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Could not issue consent token." },
      { status: 500 },
    );
  }
}

/**
 * Verify a consent token.
 * Full claims are returned only for a valid stored request, or a still-valid
 * legacy HMAC token. Expired tokens return `{ expired: true }` with no PII.
 */
export async function GET(request: NextRequest) {
  const auth = authorizeBrowserMutation(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status },
    );
  }

  const limit = consumeRateLimit(
    `consent-verify:ip:${clientIpKey(request)}`,
    30,
    60_000,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  const token = (request.nextUrl.searchParams.get("token") ?? "").trim();
  if (!token) {
    return NextResponse.json(
      { success: false, error: "token is required." },
      { status: 400 },
    );
  }

  const stored = await lookupConsentRequestByToken(token);
  if (stored.status === "valid") {
    return NextResponse.json({
      success: true as const,
      pending: {
        token,
        parentEmail: stored.request.parentEmail,
        childUsername: stored.request.childUsername,
        birthYear: stored.request.birthYear,
        createdAt: stored.request.createdAt,
      },
    });
  }
  if (stored.status === "expired") {
    return NextResponse.json(
      {
        success: false as const,
        expired: true as const,
        error: "Consent token has expired.",
      },
      { status: 410 },
    );
  }

  const claims = verifyConsentToken(token);
  if (!claims) {
    return NextResponse.json(
      { success: false, error: "Invalid consent token." },
      { status: 400 },
    );
  }

  if (!isConsentTokenUnexpired(claims.createdAt)) {
    return NextResponse.json(
      {
        success: false as const,
        expired: true as const,
        error: "Consent token has expired.",
      },
      { status: 410 },
    );
  }

  return NextResponse.json({
    success: true as const,
    pending: toPendingPayload(token, claims),
  });
}
