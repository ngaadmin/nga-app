import { NextResponse } from "next/server";
import {
  authorizeBrowserMutation,
  clientIpKey,
} from "@/lib/auth/request-guard";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { requestHouseholdPasswordRecovery } from "@/lib/onboarding/household-recovery";
import { EMAIL_PATTERN } from "@/lib/validation/email";

export const runtime = "nodejs";
export const maxDuration = 15;

type Body = {
  email?: unknown;
  username?: unknown;
  onlyUsername?: unknown;
};

export async function POST(request: Request) {
  const auth = authorizeBrowserMutation(request);
  if (!auth.ok) {
    return NextResponse.json(
      { accepted: false, error: auth.error },
      { status: auth.status },
    );
  }

  const ipLimit = consumeRateLimit(
    `password-recovery:ip:${clientIpKey(request)}`,
    8,
    60_000,
  );
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { accepted: false, error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  try {
    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json(
        {
          accepted: false,
          error:
            "Enter the email for that login, or a username that identifies one account.",
        },
        { status: 400 },
      );
    }

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const username =
      typeof body.username === "string" && body.username.trim()
        ? body.username.trim()
        : typeof body.onlyUsername === "string" && body.onlyUsername.trim()
          ? body.onlyUsername.trim()
          : "";

    if (email && !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { accepted: false, error: "Enter a valid email address." },
        { status: 400 },
      );
    }
    if (!email && !username) {
      return NextResponse.json(
        {
          accepted: false,
          error:
            "Enter the email for that login, or a username that identifies one account.",
        },
        { status: 400 },
      );
    }

    const result = await requestHouseholdPasswordRecovery({
      email: email || undefined,
      username: username || undefined,
    });

    if (!result.accepted) {
      console.error("[password-recovery] POST rejected", {
        reason: "reason" in result ? result.reason : undefined,
        error: result.error,
      });
    }
    return NextResponse.json(result, { status: result.accepted ? 200 : 400 });
  } catch (error) {
    console.error("[password-recovery] Route failed", {
      reason: "unexpected",
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        accepted: false,
        error: "Could not send a recovery email. Try again shortly.",
      },
      { status: 500 },
    );
  }
}
