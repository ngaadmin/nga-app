"use server";

import {
  isPasswordResetTokenUnexpired,
  verifyPasswordResetToken,
} from "@/lib/auth/password-reset-token";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_PASSWORD_LENGTH = 6;

export type CompletePasswordResetResult =
  | { ok: true; username: string }
  | { ok: false; error: string };

export async function readPasswordResetRequest(
  token: string,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const claims = verifyPasswordResetToken(token);
  if (!claims || !isPasswordResetTokenUnexpired(claims.createdAt)) {
    return {
      ok: false,
      error: "This reset link is invalid or expired. Request a new one from Log in.",
    };
  }
  return { ok: true, username: claims.username };
}

export async function completePasswordReset(
  token: string,
  password: string,
): Promise<CompletePasswordResetResult> {
  const claims = verifyPasswordResetToken(token);
  if (!claims || !isPasswordResetTokenUnexpired(claims.createdAt)) {
    return {
      ok: false,
      error: "This reset link is invalid or expired. Request a new one from Log in.",
    };
  }

  const trimmedPassword = password.trim();
  if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "Use at least 6 characters for your password." };
  }

  const limit = consumeRateLimit(
    `password-reset:${claims.userId}`,
    5,
    15 * 60_000,
  );
  if (!limit.allowed) {
    return {
      ok: false,
      error: "Too many reset attempts. Try again in a few minutes.",
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(claims.userId, {
      password: trimmedPassword,
      user_metadata: { mustChangePassword: false },
    });
    if (error) {
      return {
        ok: false,
        error: "We could not update this password. Try again.",
      };
    }
  } catch {
    return {
      ok: false,
      error: "We could not update this password. Try again.",
    };
  }

  return { ok: true, username: claims.username };
}
