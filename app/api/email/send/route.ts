import { NextResponse } from "next/server";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import type {
  OnboardingEmailDataMap,
  OnboardingEmailType,
} from "@/lib/email/templates";

export const runtime = "nodejs";

const EMAIL_TYPES: readonly OnboardingEmailType[] = [
  "EXPLORER_PARENT",
  "PATHFINDER_PARENT",
  "MAVERICK_WELCOME",
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_APP_URL = "https://nga-app-three.vercel.app";

type SendBody = {
  type?: unknown;
  recipientEmail?: unknown;
  data?: unknown;
};

function isEmailType(value: unknown): value is OnboardingEmailType {
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
  type: OnboardingEmailType,
  raw: unknown,
): OnboardingEmailDataMap[OnboardingEmailType] | null {
  const data = asRecord(raw);
  const username = readString(data, "username");
  if (!username) return null;

  if (type === "EXPLORER_PARENT") {
    const token = readString(data, "token");
    if (!token) return null;
    return { username, token };
  }

  return { username };
}

/** Strip quotes, markdown brackets/parens, and trailing slashes from a URL-ish string. */
function sanitizeBaseUrl(value: unknown): string | undefined {
  try {
    if (typeof value !== "string") return undefined;
    const cleaned = value
      .trim()
      .replace(/^['"`]+|['"`]+$/g, "")
      .replace(/^\[|\]$/g, "")
      .replace(/^\(|\)$/g, "")
      .replace(/\/+$/g, "")
      .trim();
    return cleaned || undefined;
  } catch {
    return undefined;
  }
}

function resolveRequestAppUrl(request: Request): string {
  try {
    const configuredAppUrl = sanitizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
    if (configuredAppUrl) {
      return configuredAppUrl;
    }

    const vercelHost = sanitizeBaseUrl(process.env.VERCEL_URL);
    if (vercelHost) {
      return vercelHost.startsWith("http://") || vercelHost.startsWith("https://")
        ? vercelHost
        : `https://${vercelHost}`;
    }

    const origin = sanitizeBaseUrl(request.headers.get("origin"));
    if (origin) {
      return origin;
    }

    const host = sanitizeBaseUrl(request.headers.get("host"));
    if (host) {
      const proto =
        sanitizeBaseUrl(request.headers.get("x-forwarded-proto")) || "https";
      const scheme = proto.includes("://") ? "https" : proto;
      return `${scheme}://${host.replace(/^https?:\/\//, "")}`;
    }
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR] resolveRequestAppUrl failed", error);
  }

  return DEFAULT_APP_URL;
}

export async function POST(request: Request) {
  try {
    let body: SendBody;
    try {
      body = (await request.json()) as SendBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (!isEmailType(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "type must be EXPLORER_PARENT | PATHFINDER_PARENT | MAVERICK_WELCOME.",
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
            body.type === "EXPLORER_PARENT"
              ? "data.username and data.token are required."
              : "data.username is required.",
        },
        { status: 400 },
      );
    }

    const result = await sendOnboardingEmail({
      type: body.type,
      recipientEmail,
      data,
      appUrl: resolveRequestAppUrl(request),
    });

    return NextResponse.json({
      success: true as const,
      simulated: result.simulated === true,
      id: result.id,
    });
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Failed to send email.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
