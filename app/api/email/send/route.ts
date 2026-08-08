import { NextResponse } from "next/server";
import { verifyConsentToken } from "@/lib/auth/consent-token";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import {
  PRODUCTION_APP_URL,
  type OnboardingEmailDataMap,
  type OnboardingEmailType,
} from "@/lib/email/templates";

export const runtime = "nodejs";

/** Public browser send types - CREDENTIAL_RECOVERY is server-issued only. */
const EMAIL_TYPES: readonly Exclude<
  OnboardingEmailType,
  "CREDENTIAL_RECOVERY"
>[] = [
  "EXPLORER_PARENT",
  "EXPLORER_PARENT_RESEND",
  "PATHFINDER_PARENT",
  "PATHFINDER_PARENT_LINKED",
  "MAVERICK_WELCOME",
  "USERNAME_RECOVERY",
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SendBody = {
  type?: unknown;
  recipientEmail?: unknown;
  data?: unknown;
};

function isPublicEmailType(
  value: unknown,
): value is Exclude<OnboardingEmailType, "CREDENTIAL_RECOVERY"> {
  return (
    typeof value === "string" &&
    (EMAIL_TYPES as readonly string[]).includes(value)
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseData(
  type: Exclude<OnboardingEmailType, "CREDENTIAL_RECOVERY">,
  raw: unknown,
): OnboardingEmailDataMap[Exclude<OnboardingEmailType, "CREDENTIAL_RECOVERY">] | null {
  const data = asRecord(raw);
  const username = readString(data, "username");
  if (!username) return null;

  if (
    type === "EXPLORER_PARENT" ||
    type === "EXPLORER_PARENT_RESEND" ||
    type === "PATHFINDER_PARENT"
  ) {
    const token = readString(data, "token");
    if (!token) return null;
    return { username, token };
  }

  if (type === "PATHFINDER_PARENT_LINKED") {
    return {
      username,
      masterUsername: readString(data, "masterUsername"),
    };
  }

  if (type === "USERNAME_RECOVERY") {
    return {
      username,
      cohort: readString(data, "cohort") as
        | "explorer"
        | "pathfinder"
        | "maverick"
        | undefined,
      masterUsername: readString(data, "masterUsername"),
      linkedUsernames: Array.isArray(data.linkedUsernames)
        ? data.linkedUsernames.filter(
            (entry): entry is string => typeof entry === "string",
          )
        : undefined,
    };
  }

  return { username };
}

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** Same browser origin that issued the consent token (for email approval CTAs). */
function requestAppUrl(request: Request): string {
  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      // fall through
    }
  }

  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(",")[0]
    ?.trim();
  if (!host) return PRODUCTION_APP_URL;
  const protoHeader = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const proto =
    protoHeader ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  const candidates = [origin, referer].filter(Boolean) as string[];
  if (candidates.length === 0) {
    // Same-origin fetches from some browsers may omit Origin on POST in odd cases;
    // still allow in development only.
    return process.env.NODE_ENV !== "production";
  }

  const allowedHosts = new Set<string>();
  try {
    allowedHosts.add(new URL(PRODUCTION_APP_URL).host);
  } catch {
    // ignore
  }
  if (process.env.NODE_ENV !== "production") {
    allowedHosts.add("localhost:3000");
    allowedHosts.add("127.0.0.1:3000");
  }
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) allowedHosts.add(vercelUrl.replace(/^https?:\/\//, ""));
  // Allow the deployment host the browser is actually using (custom domains, previews).
  if (host?.trim()) {
    allowedHosts.add(host.trim().toLowerCase());
  }

  return candidates.some((value) => {
    try {
      return allowedHosts.has(new URL(value).host);
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json(
        { success: false, error: "Forbidden origin." },
        { status: 403 },
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

    const rateUsername =
      body.data && typeof body.data === "object" && !Array.isArray(body.data)
        ? readString(body.data as Record<string, unknown>, "username")
        : undefined;
    const rateRecipient =
      typeof body.recipientEmail === "string"
        ? body.recipientEmail.trim().toLowerCase()
        : "";
    // Per learner (+ recipient) so sibling Explorers sharing one parent email
    // do not block each other after resends on another profile.
    const limit = consumeRateLimit(
      `email-send:${clientKey(request)}:${rateRecipient}:${rateUsername ?? "unknown"}`,
      12,
      60_000,
    );
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many approval emails for this profile. Wait about a minute, then try again.",
        },
        { status: 429 },
      );
    }

    if (body.type === "CREDENTIAL_RECOVERY") {
      return NextResponse.json(
        {
          success: false,
          error:
            "CREDENTIAL_RECOVERY must be issued via /api/auth/temporary-password.",
        },
        { status: 400 },
      );
    }

    if (!isPublicEmailType(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "type must be EXPLORER_PARENT | EXPLORER_PARENT_RESEND | PATHFINDER_PARENT | PATHFINDER_PARENT_LINKED | MAVERICK_WELCOME | USERNAME_RECOVERY.",
        },
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

    const data = parseData(body.type, body.data);
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            body.type === "EXPLORER_PARENT" ||
            body.type === "EXPLORER_PARENT_RESEND" ||
            body.type === "PATHFINDER_PARENT"
              ? "data.username and data.token are required."
              : "data.username is required.",
        },
        { status: 400 },
      );
    }

    if (
      body.type === "EXPLORER_PARENT" ||
      body.type === "EXPLORER_PARENT_RESEND" ||
      body.type === "PATHFINDER_PARENT"
    ) {
      const tokenData = data as
        | OnboardingEmailDataMap["EXPLORER_PARENT"]
        | OnboardingEmailDataMap["EXPLORER_PARENT_RESEND"]
        | OnboardingEmailDataMap["PATHFINDER_PARENT"];
      const claims = verifyConsentToken(tokenData.token);
      if (!claims) {
        return NextResponse.json(
          { success: false, error: "Consent token signature is invalid." },
          { status: 400 },
        );
      }
      if (claims.parentEmail !== recipientEmail) {
        return NextResponse.json(
          { success: false, error: "Consent token email mismatch." },
          { status: 400 },
        );
      }
      if (claims.childUsername !== tokenData.username) {
        return NextResponse.json(
          { success: false, error: "Consent token username mismatch." },
          { status: 400 },
        );
      }
    }

    const result = await sendOnboardingEmail({
      type: body.type,
      recipientEmail,
      data,
      appUrl: requestAppUrl(request),
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
    return NextResponse.json({
      success: true as const,
      simulated: true,
    });
  }
}
