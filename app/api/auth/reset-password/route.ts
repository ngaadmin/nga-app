import { NextResponse } from "next/server";
import {
  authorizeBrowserMutation,
  clientIpKey,
} from "@/lib/auth/request-guard";
import { verifyPasswordResetToken } from "@/lib/auth/password-reset-token";
import {
  AUTH_RATE_LIMITS,
  consumeSharedRateLimit,
} from "@/lib/auth/shared-rate-limit";
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

  const ipLimit = await consumeSharedRateLimit(
    `password-reset:ip:${clientIpKey(request)}`,
    AUTH_RATE_LIMITS.resetIp.limit,
    AUTH_RATE_LIMITS.resetIp.windowMs,
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

    // Per-account limit, keyed on the account in a validly signed reset link.
    // Links that don't verify are rejected by completePasswordReset and are
    // covered by the IP limit only.
    const claims = verifyPasswordResetToken(token);
    if (claims?.userId) {
      const accountLimit = await consumeSharedRateLimit(
        `password-reset:account:${claims.userId}`,
        AUTH_RATE_LIMITS.resetAccount.limit,
        AUTH_RATE_LIMITS.resetAccount.windowMs,
      );
      if (!accountLimit.allowed) {
        return NextResponse.json(
          { ok: false, error: "Too many reset attempts. Try again in 15 minutes." },
          { status: 429 },
        );
      }
    }

    const result = await completePasswordReset(token, password);
    if (!result.ok) {
      console.error("[password-reset] POST rejected", { error: result.error });
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[password-reset] Route failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { ok: false, error: "We could not update this password. Try again." },
      { status: 500 },
    );
  }
}
