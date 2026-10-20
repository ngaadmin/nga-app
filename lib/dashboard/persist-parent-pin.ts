"use server";

import "server-only";

import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { hashCredential, verifyCredential } from "@/lib/auth/credential-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isFourDigitPin } from "@/lib/validation/pin";

export type PersistParentPinResult =
  | { ok: true }
  | { ok: false; error: string };

const NOT_PARENT = "Sign in as the parent to set a parent PIN.";
const SAVE_ERROR = "We could not save the parent PIN. Try again.";

/**
 * Stores the parent PIN hash on the parent profile.
 * When a hash already exists, the current PIN must match, unless this is the
 * Settings recovery flow that already replaces the PIN.
 */
export async function persistParentPin(input: {
  pin: string;
  currentPin?: string;
  recovery?: boolean;
}): Promise<PersistParentPinResult> {
  const pin = input.pin?.trim() ?? "";
  if (!isFourDigitPin(pin)) {
    return { ok: false, error: "Parent PIN must be exactly 4 digits." };
  }

  let admin;
  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    userId = auth.user?.id;
    admin = createAdminClient();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error && error.message.trim() ? error.message.trim() : SAVE_ERROR,
    };
  }
  if (!userId) return { ok: false, error: NOT_PARENT };

  const { data: profile, error } = await admin
    .from("profiles")
    .select("account_role, parent_pin_hash")
    .eq("id", userId)
    .maybeSingle();
  if (error || !profile || profile.account_role !== "parent_master") {
    return { ok: false, error: NOT_PARENT };
  }

  const limit = consumeRateLimit(`parent-pin:${userId}`, 8, 15 * 60 * 1000);
  if (!limit.allowed) {
    return {
      ok: false,
      error: "Too many PIN attempts. Wait a few minutes, then try again.",
    };
  }

  const existing =
    typeof profile.parent_pin_hash === "string" ? profile.parent_pin_hash.trim() : "";
  if (existing && !input.recovery) {
    const current = input.currentPin?.trim() ?? "";
    if (!isFourDigitPin(current) || !verifyCredential(current, existing)) {
      return { ok: false, error: "Current PIN doesn't match." };
    }
  }

  const { error: saved } = await admin
    .from("profiles")
    .update({ parent_pin_hash: hashCredential(pin) })
    .eq("id", userId)
    .eq("account_role", "parent_master");
  if (saved) return { ok: false, error: SAVE_ERROR };
  return { ok: true };
}

export async function parentPinConfigured(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return false;

    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("account_role, parent_pin_hash")
      .eq("id", userId)
      .maybeSingle();
    return (
      data?.account_role === "parent_master" &&
      typeof data.parent_pin_hash === "string" &&
      data.parent_pin_hash.trim().length > 0
    );
  } catch {
    return false;
  }
}
