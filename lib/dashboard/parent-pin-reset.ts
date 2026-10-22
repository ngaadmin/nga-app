"use server";

import "server-only";

import { createHash, randomBytes } from "crypto";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  isParentPinResetTokenUnexpired,
  parentPinResetSecretReady,
  signParentPinResetToken,
  verifyParentPinResetToken,
} from "@/lib/auth/parent-pin-reset-token";
import { hashCredential } from "@/lib/auth/credential-hash";
import { PRODUCTION_APP_URL } from "@/lib/email/templates";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isFourDigitPin } from "@/lib/validation/pin";

const SENT = "We've emailed you a link to reset your PIN.";
const SEND_ERROR = "We could not email a PIN reset link. Try again.";

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Emails a single-use PIN reset link to the signed-in parent's login email.
 * Does not change the PIN and never returns a code.
 */
export async function requestParentPinReset(): Promise<
  { ok: true; message: string } | { ok: false; error: string }
> {
  if (!parentPinResetSecretReady()) {
    return { ok: false, error: SEND_ERROR };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  const email = user?.email?.trim().toLowerCase() ?? "";
  if (!user?.id || !email) {
    return { ok: false, error: "Sign in as the parent to reset a PIN." };
  }

  const limit = consumeRateLimit(`parent-pin-reset:${user.id}`, 3, 15 * 60 * 1000);
  if (!limit.allowed) {
    return { ok: false, error: "Too many reset emails. Wait a few minutes, then try again." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.account_role !== "parent_master") {
    return { ok: false, error: "Sign in as the parent to reset a PIN." };
  }

  const createdAt = new Date().toISOString();
  const token = signParentPinResetToken({
    userId: user.id,
    nonce: randomBytes(16).toString("hex"),
    createdAt,
  });
  const expiresAt = new Date(Date.parse(createdAt) + 30 * 60 * 1000).toISOString();
  const { error: stored } = await admin
    .from("profiles")
    .update({
      parent_pin_reset_hash: tokenHash(token),
      parent_pin_reset_expires_at: expiresAt,
    })
    .eq("id", user.id)
    .eq("account_role", "parent_master");
  if (stored) {
    return { ok: false, error: SEND_ERROR };
  }

  const sent = await sendOnboardingEmail({
    type: "PARENT_PIN_RESET",
    recipientEmail: email,
    data: { token },
    appUrl: PRODUCTION_APP_URL,
  });
  if (!sent.success) {
    await admin
      .from("profiles")
      .update({ parent_pin_reset_hash: null, parent_pin_reset_expires_at: null })
      .eq("id", user.id);
    return { ok: false, error: SEND_ERROR };
  }

  return { ok: true, message: SENT };
}

export async function completeParentPinReset(input: {
  token: string;
  pin: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const pin = input.pin.trim();
  if (!isFourDigitPin(pin)) {
    return { ok: false, error: "Parent PIN must be exactly 4 digits." };
  }

  let claims;
  try {
    claims = verifyParentPinResetToken(input.token ?? "");
  } catch {
    claims = null;
  }
  if (!claims || !isParentPinResetTokenUnexpired(claims.createdAt)) {
    return { ok: false, error: "This reset link is invalid or expired. Request a new one." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_role, parent_pin_reset_hash, parent_pin_reset_expires_at")
    .eq("id", claims.userId)
    .maybeSingle();
  const stored =
    typeof profile?.parent_pin_reset_hash === "string" ? profile.parent_pin_reset_hash : "";
  const expires = Date.parse(String(profile?.parent_pin_reset_expires_at ?? ""));
  if (
    !profile ||
    profile.account_role !== "parent_master" ||
    !stored ||
    stored !== tokenHash(input.token.trim()) ||
    !Number.isFinite(expires) ||
    expires <= Date.now()
  ) {
    return { ok: false, error: "This reset link is invalid or expired. Request a new one." };
  }

  const { error } = await admin
    .from("profiles")
    .update({
      parent_pin_hash: hashCredential(pin),
      parent_pin_reset_hash: null,
      parent_pin_reset_expires_at: null,
    })
    .eq("id", claims.userId)
    .eq("parent_pin_reset_hash", stored);
  if (error) {
    return { ok: false, error: "We could not save the new PIN. Try again." };
  }
  return { ok: true };
}
