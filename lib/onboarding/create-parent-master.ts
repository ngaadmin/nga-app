"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { findAuthUserIdByEmail } from "@/lib/onboarding/parent-master-lookup";
import { normalizeEmailAddress } from "@/lib/validation/email";

const MIN_PASSWORD_LENGTH = 6;

export type CreateParentMasterInput = {
  password: string;
  email: string;
  marketingOptIn?: boolean;
};

export type CreateParentMasterResult =
  | {
      success: true;
      parentId: string;
      parentUsername: string;
      parentEmail: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Standalone parent master create (Settings). Email is the login identity.
 * No parent username is collected.
 */
export async function createParentMasterAccount(
  input: CreateParentMasterInput,
): Promise<CreateParentMasterResult> {
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: "Use at least 6 characters for your password.",
    };
  }

  const parentEmail = normalizeEmailAddress(input.email);
  if (!parentEmail) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const existingAuthId = await findAuthUserIdByEmail(parentEmail);
  if (existingAuthId) {
    return {
      success: false,
      error:
        "An account already exists for this email. Sign in, then add or link a profile from Settings.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Supabase admin client is not configured.",
    };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parentEmail,
    password: input.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return {
      success: false,
      error: createError?.message || "Could not create the parent master account.",
    };
  }

  const parentId = created.user.id;
  const { data: parentSaved, error: profileError } = await admin
    .from("profiles")
    .update({
      birth_year: null,
      account_role: "parent_master",
      account_status: "active",
      marketing_opt_in: Boolean(input.marketingOptIn),
    })
    .eq("id", parentId)
    .select("id, username, account_role, account_status")
    .maybeSingle();

  if (
    profileError ||
    !parentSaved ||
    parentSaved.account_role !== "parent_master" ||
    parentSaved.account_status !== "active"
  ) {
    await admin.auth.admin.deleteUser(parentId);
    return {
      success: false,
      error: profileError?.message || "Could not save the parent profile.",
    };
  }

  const parentUsername =
    typeof parentSaved.username === "string" && parentSaved.username.trim()
      ? parentSaved.username.trim()
      : `p${parentId.replace(/-/g, "").slice(0, 19)}`;

  if (parentUsername !== parentSaved.username) {
    await admin
      .from("profiles")
      .update({ username: parentUsername })
      .eq("id", parentId);
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signInWithPassword({
      email: parentEmail,
      password: input.password,
    });
  } catch {
    // Local session still lands; the parent can sign in again later.
  }

  return {
    success: true,
    parentId,
    parentUsername,
    parentEmail,
  };
}
