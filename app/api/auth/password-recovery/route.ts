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
        { accepted: false, error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { accepted: false, error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const onlyUsername =
      typeof body.onlyUsername === "string" && body.onlyUsername.trim()
        ? body.onlyUsername.trim()
        : undefined;

    const result = await requestHouseholdPasswordRecovery(
      email,
      onlyUsername ? { onlyUsername } : undefined,
    );

    return NextResponse.json(result, { status: result.accepted ? 200 : 400 });
  } catch {
    return NextResponse.json(
      {
        accepted: false,
        error: "Could not send a recovery email. Try again shortly.",
      },
      { status: 500 },
    );
  }
}
