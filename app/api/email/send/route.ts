import { NextResponse } from "next/server";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import {
  PRODUCTION_APP_URL,
  type OnboardingEmailDataMap,
  type OnboardingEmailType,
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

    // Always pin CTAs to production — ignore localhost Origin / env overrides.
    const result = await sendOnboardingEmail({
      type: body.type,
      recipientEmail,
      data,
      appUrl: PRODUCTION_APP_URL,
    });

    return NextResponse.json({
      success: true as const,
      simulated: result.simulated === true,
      id: result.id,
    });
  } catch (error) {
    // Soft-fail: signup must keep working even if mail dispatch breaks.
    console.error("[EMAIL_SEND_ERROR]", error);
    return NextResponse.json({
      success: true as const,
      simulated: true,
    });
  }
}
