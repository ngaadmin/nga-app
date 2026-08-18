import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Temporary passwords are no longer issued. Forgot password sends a reset
 * link; the password changes only after the reset form is submitted.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Password recovery now uses a reset link. Request a reset from Log in.",
    },
    { status: 410 },
  );
}
