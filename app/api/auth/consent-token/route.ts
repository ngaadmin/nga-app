import { NextRequest, NextResponse } from "next/server";
import {
  isConsentTokenUnexpired,
  signConsentToken,
  verifyConsentToken,
  type ConsentTokenClaims,
} from "@/lib/auth/consent-token";
import { generateOpaqueConsentToken } from "@/lib/auth/consent-request-token";
import {
  authorizeBrowserMutation,
  clientIpKey,
} from "@/lib/auth/request-guard";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  getMasteryCohortFromBirthYear,
  requiresParentConsentForBirthYear,
} from "@/lib/dashboard/mastery-cohort";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import {
  lookupConsentRequestByToken,
  rotateConsentRequestToken,
} from "@/lib/onboarding/lookup-consent-request";
import { EMAIL_PATTERN } from "@/lib/validation/email";

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

type IssueBody = {
  action?: "issue";
  parentEmail?: unknown;
  childUsername?: unknown;
  birthYear?: unknown;
  createdAt?: unknown;
  passcodeHash?: unknown;
};

type ResendBody = {
  action: "resend";
  token?: unknown;
};

async function handleIssue(
  request: Request,
  body: IssueBody,
): Promise<NextResponse> {
  const ip = clientIpKey(request);
  const ipLimit = consumeRateLimit(`consent-issue:ip:${ip}`, 20, 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Too many approval-link requests from this device. Wait about a minute, then try again.",
      },
      { status: 429 },
    );
  }

  const parentEmail =
    typeof body.parentEmail === "string"
      ? body.parentEmail.trim().toLowerCase()
      : "";
  const childUsername =
    typeof body.childUsername === "string" ? body.childUsername.trim() : "";
  const birthYear =
    typeof body.birthYear === "number" && Number.isInteger(body.birthYear)
      ? body.birthYear
      : NaN;
  const createdAt =
    typeof body.createdAt === "string" && body.createdAt.trim()
      ? body.createdAt.trim()
      : new Date().toISOString();
  const passcodeHash =
    typeof body.passcodeHash === "string" && body.passcodeHash.trim()
      ? body.passcodeHash.trim()
      : undefined;

  if (!parentEmail || !EMAIL_PATTERN.test(parentEmail)) {
    return NextResponse.json(
      { success: false, error: "A valid parentEmail is required." },
      { status: 400 },
    );
  }

  const emailLimit = consumeRateLimit(
    `consent-issue:email:${parentEmail}`,
    10,
    60_000,
  );
  if (!emailLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Too many approval-link requests for this email. Wait about a minute, then try again.",
      },
      { status: 429 },
    );
  }

  if (!childUsername) {
    return NextResponse.json(
      { success: false, error: "childUsername is required." },
      { status: 400 },
    );
  }

  // Explorer VPC tokens + Pathfinder parent-dashboard claim tokens.
  const cohort = Number.isInteger(birthYear)
    ? getMasteryCohortFromBirthYear(birthYear)
    : null;
  const canIssueParentLinkToken =
    Boolean(cohort) &&
    (requiresParentConsentForBirthYear(birthYear) || cohort === "pathfinder");
  if (!canIssueParentLinkToken) {
    return NextResponse.json(
      {
        success: false,
        error:
          "birthYear must be an Explorer (parental consent) or Pathfinder (parent dashboard claim) profile.",
      },
      { status: 400 },
    );
  }

  const token = signConsentToken({
    parentEmail,
    childUsername,
    birthYear,
    createdAt,
    passcodeHash,
  });

  return NextResponse.json({ success: true as const, token, createdAt });
}

/**
 * Re-issue + email a fresh approval link from a previously signed token.
 * Accepts expired tokens; rejects invalid signatures. Does not echo PII claims.
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
  const hmacClaims = verifyConsentToken(token);

  const parentEmail =
    stored.status === "valid" || stored.status === "expired"
      ? stored.request?.parentEmail
      : hmacClaims?.parentEmail;
  const childUsername =
    stored.status === "valid" || stored.status === "expired"
      ? stored.request?.childUsername
      : hmacClaims?.childUsername;
  const birthYear =
    stored.status === "valid" || stored.status === "expired"
      ? stored.request?.birthYear
      : hmacClaims?.birthYear;

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
  const nextToken =
    stored.status === "valid" || stored.status === "expired"
      ? generateOpaqueConsentToken()
      : signConsentToken({
          parentEmail,
          childUsername,
          birthYear,
          createdAt,
          passcodeHash: hmacClaims?.passcodeHash,
        });

  if (
    (stored.status === "valid" || stored.status === "expired") &&
    stored.request
  ) {
    const rotated = await rotateConsentRequestToken({
      requestId: stored.request.id,
      nextToken,
    });
    if (!rotated) {
      return NextResponse.json(
        { success: false, error: "Could not refresh this approval link." },
        { status: 502 },
      );
    }
  }

  const sendResult = await sendOnboardingEmail({
    type: "EXPLORER_PARENT_RESEND",
    recipientEmail: parentEmail,
    data: {
      username: childUsername,
      token: nextToken,
    },
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

  // Minimum non-sensitive fields for UX / local token rotation.
  return NextResponse.json({
    success: true as const,
    token: nextToken,
    createdAt,
    childUsername,
  });
}

/** Issue a signed parental consent token, or resend from an existing signed token. */
export async function POST(request: Request) {
  const auth = authorizeBrowserMutation(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status },
    );
  }

  try {
    let body: IssueBody | ResendBody;
    try {
      body = (await request.json()) as IssueBody | ResendBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (body && typeof body === "object" && body.action === "resend") {
      return handleResend(request, body);
    }

    return handleIssue(request, body as IssueBody);
  } catch (error) {
    console.error("[CONSENT_TOKEN_ISSUE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Could not issue consent token." },
      { status: 500 },
    );
  }
}

/**
 * Verify a signed consent token.
 * Full claims are returned only for valid, unexpired signatures.
 * Expired (but correctly signed) tokens return `{ expired: true }` with no PII.
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
