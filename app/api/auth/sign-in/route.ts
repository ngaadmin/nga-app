import { NextResponse } from "next/server";
import {
  authorizeBrowserMutation,
  clientIpKey,
} from "@/lib/auth/request-guard";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  SIGN_IN_MISMATCH_ERROR,
  SIGN_IN_UNAVAILABLE_ERROR,
  signInSupabaseAccount,
} from "@/lib/onboarding/sign-in-supabase";

export const runtime = "nodejs";
export const maxDuration = 15;

type Body = {
  identifier?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const auth = authorizeBrowserMutation(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status },
    );
  }

  const ipLimit = consumeRateLimit(
    `sign-in:ip:${clientIpKey(request)}`,
    12,
    60_000,
  );
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many sign-in attempts. Try again shortly." },
      { status: 429 },
    );
  }

  try {
    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json(
        { success: false, error: SIGN_IN_MISMATCH_ERROR },
        { status: 400 },
      );
    }

    const identifier =
      typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!identifier || password.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: SIGN_IN_MISMATCH_ERROR },
        { status: 400 },
      );
    }

    const result = await signInSupabaseAccount({
      identifier,
      password,
    });

    if (!result.success) {
      console.error("[sign-in] POST rejected", { error: result.error });
    }

    return NextResponse.json(result, { status: result.success ? 200 : 401 });
  } catch (error) {
    console.error("[sign-in] Route failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { success: false, error: SIGN_IN_UNAVAILABLE_ERROR },
      { status: 500 },
    );
  }
}
