import { NextResponse } from "next/server";
import {
  authorizeBrowserMutation,
  clientIpKey,
} from "@/lib/auth/request-guard";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { completePasswordReset } from "@/lib/onboarding/complete-password-reset";

export const runtime = "nodejs";
export const maxDuration = 15;

type Body = {
  token?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const auth = authorizeBrowserMutation(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const ipLimit = consumeRateLimit(
    `password-reset:ip:${clientIpKey(request)}`,
    8,
    60_000,
  );
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many reset attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  try {
    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json(
        { ok: false, error: "This reset link is invalid or expired. Request a new one from Log in." },
        { status: 400 },
      );
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This reset link is invalid or expired. Request a new one from Log in.",
        },
        { status: 400 },
      );
    }

    const result = await completePasswordReset(token, password);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "We could not update this password. Try again." },
      { status: 500 },
    );
  }
}
