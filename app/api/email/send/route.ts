import { NextResponse } from "next/server";
import {
  authorizeBrowserMutation,
  clientIpKey,
} from "@/lib/auth/request-guard";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  isPublicConsentEmailType,
  storedConsentMatchesEmailType,
} from "@/lib/email/public-send-policy";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { resolveTrustedAppUrl } from "@/lib/email/templates";
import { lookupConsentRequestByToken } from "@/lib/onboarding/lookup-consent-request";

export const runtime = "nodejs";

type SendBody = {
  type?: unknown;
  data?: unknown;
};

function readToken(raw: unknown): string {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  const token = (raw as { token?: unknown }).token;
  return typeof token === "string" ? token.trim() : "";
}

/**
 * Public mail is limited to a server-stored approval token.
 * Welcome, recovery, invite, and deletion messages are sent by the server
 * action that already knows the account. A browser Origin is not enough.
 *
 * Rate limits here are in-memory per server instance. A shared limiter needs
 * new infrastructure and is not wired up.
 */
export async function POST(request: Request) {
  try {
    const auth = authorizeBrowserMutation(request);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const ipLimit = consumeRateLimit(
      `email-send:ip:${clientIpKey(request)}`,
      8,
      60_000,
    );
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many email requests. Wait a minute, then try again.",
        },
        { status: 429 },
      );
    }

    let body: SendBody;
    try {
      body = (await request.json()) as SendBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (!isPublicConsentEmailType(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "That email is sent by the server during signup, consent, or recovery.",
        },
        { status: 403 },
      );
    }

    const token = readToken(body.data);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "A server-issued approval token is required." },
        { status: 400 },
      );
    }

    let stored: Awaited<ReturnType<typeof lookupConsentRequestByToken>>;
    try {
      stored = await lookupConsentRequestByToken(token);
    } catch (error) {
      console.error("[EMAIL_SEND_LOOKUP]", error);
      return NextResponse.json(
        { success: false, error: "Could not verify this approval link." },
        { status: 502 },
      );
    }

    if (stored.status === "expired") {
      return NextResponse.json(
        {
          success: false,
          error: "This approval link has expired. Resend a fresh email to continue.",
        },
        { status: 400 },
      );
    }

    if (stored.status !== "valid" || !stored.request) {
      return NextResponse.json(
        { success: false, error: "Invalid approval token." },
        { status: 400 },
      );
    }

    if (!storedConsentMatchesEmailType(body.type, stored.request.kind)) {
      return NextResponse.json(
        { success: false, error: "This approval link does not match that email." },
        { status: 400 },
      );
    }

    const tokenLimit = consumeRateLimit(
      `email-send:token:${stored.request.id}`,
      3,
      15 * 60_000,
    );
    if (!tokenLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many approval emails for this profile. Wait a few minutes, then try again.",
        },
        { status: 429 },
      );
    }

    const approvalData = {
      username: stored.request.childUsername,
      token,
    };
    const result = await sendOnboardingEmail({
      type: body.type,
      recipientEmail: stored.request.parentEmail,
      data:
        body.type === "EXPLORER_PARENT"
          ? {
              ...approvalData,
              track: stored.request.cohort ?? "explorer",
            }
          : approvalData,
      appUrl: resolveTrustedAppUrl(request.headers.get("origin")),
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Email send failed.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true as const,
      simulated: result.simulated === true,
      id: result.id,
    });
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR]", error);
    return NextResponse.json(
      {
        success: false as const,
        error: "Email send failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}
