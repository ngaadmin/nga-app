"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  loadLearnerAccountById,
  signInSupabaseAccount,
} from "@/lib/onboarding/sign-in-supabase";

export type LearnerAccountSnapshot = {
  userId: string;
  username: string;
  birthYear: number | null;
  accountRole: "child" | "parent_master";
  accountStatus: "pending_consent" | "active";
  consentApprovedAt: string | null;
  parentEmail: string | null;
  learnerEmail: string | null;
  mustChangePassword?: boolean;
};

export type LearnerConsentStatus = {
  userId: string;
  username: string;
  accountStatus: "pending_consent" | "active";
  consentApprovedAt: string | null;
};

/**
 * Profile for the signed-in Supabase user, including the latest guardian email
 * from consent_requests when the row itself does not store it.
 */
export async function lookupCurrentLearnerAccount(): Promise<LearnerAccountSnapshot | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.id) return null;

  return loadLearnerAccountById(user.id, user.email ?? null);
}

/**
 * Consent lifecycle for a username. Used by the child's device after signup
 * when a local session already knows who they are.
 */
export async function lookupLearnerConsentStatus(
  username: string,
): Promise<LearnerConsentStatus | null> {
  const trimmed = username.trim();
  if (!trimmed) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, account_status, consent_approved_at")
    .eq("username", trimmed)
    .maybeSingle();

  if (error || !data?.id || !data.username) return null;
  if (
    data.account_status !== "pending_consent" &&
    data.account_status !== "active"
  ) {
    return null;
  }

  return {
    userId: data.id,
    username: data.username,
    accountStatus: data.account_status,
    consentApprovedAt: data.consent_approved_at ?? null,
  };
}

export async function signInSupabaseLearner(input: {
  identifier: string;
  password: string;
}): Promise<
  | { success: true; account: LearnerAccountSnapshot }
  | { success: false; error: string }
> {
  return signInSupabaseAccount(input);
}

export async function updateSignedInPassword(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = password.trim();
  if (trimmed.length < 6) {
    return { ok: false, error: "Use at least 6 characters for your password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: trimmed,
    data: { mustChangePassword: false },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
