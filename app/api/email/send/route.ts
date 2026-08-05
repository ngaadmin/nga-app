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

function resolveRequestAppUrl(request: Request): string | undefined {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredAppUrl) {
    return configuredAppUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const host = request.headers.get("host")?.trim();
  if (!host) return undefined;
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host.replace(/\/$/, "")}`;
}

export async function POST(request: Request) {
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

  try {
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
    const message =
      error instanceof Error ? error.message : "Failed to send email.";
    console.error("[api/email/send]", message);
    const isResendError = message.includes("Resend API error");
    return NextResponse.json(
      { success: false, simulated: false, error: message },
      { status: isResendError ? 500 : 502 },
    );
  }
}
