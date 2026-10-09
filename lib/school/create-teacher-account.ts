"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { getDefaultAppUrl } from "@/lib/email/templates";
import { findAuthUserIdByEmail } from "@/lib/onboarding/parent-master-lookup";
import { generateClassPassword } from "@/lib/school/class-password";
import { signClassOpenToken } from "@/lib/school/class-open-token";
import { normalizeEmailAddress } from "@/lib/validation/email";

const MIN_PASSWORD_LENGTH = 6;
const DEFAULT_SEAT_CAP = 30;
const TEACHER_SIGNUP_ERROR = "Could not create the teacher account. Try again.";

function teacherSignupError(raw?: string | null): string {
  if (raw && /already been registered|already registered|already exists/i.test(raw)) {
    return "An account already exists for this email. Sign in instead.";
  }
  return TEACHER_SIGNUP_ERROR;
}

export type CreateTeacherAccountResult =
  | {
      success: true;
      userId: string;
      username: string;
      email: string;
    }
  | {
      success: false;
      error: string;
    };

async function resolveSignupAppUrl(): Promise<string> {
  try {
    const headerList = await headers();
    const origin = headerList.get("origin")?.trim();
    if (origin) {
      return new URL(origin).origin;
    }
  } catch {
    // Server action without a request origin.
  }
  return getDefaultAppUrl();
}

/**
 * /school signup: email + password → teacher Auth user, is_teacher, seat_cap,
 * and one confirm-account email. Stays inactive until the mail button.
 * No parent-consent mail. No consent_approved_at.
 */
export async function createTeacherAccount(input: {
  email: string;
  password: string;
}): Promise<CreateTeacherAccountResult> {
  const email = normalizeEmailAddress(input.email);
  if (!email) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: "Use at least 6 characters for your password.",
    };
  }

  const existingAuthId = await findAuthUserIdByEmail(email);
  if (existingAuthId) {
    return {
      success: false,
      error: "An account already exists for this email. Sign in instead.",
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
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { isTeacher: true },
  });

  if (createError || !created.user) {
    return {
      success: false,
      error: teacherSignupError(createError?.message),
    };
  }

  const userId = created.user.id;
  try {
    const { data: saved, error: profileError } = await admin
      .from("profiles")
      .update({
        birth_year: null,
        account_role: "teacher",
        account_status: "pending_consent",
        marketing_opt_in: false,
        consent_approved_at: null,
        is_teacher: true,
        seat_cap: DEFAULT_SEAT_CAP,
        class_password: generateClassPassword(),
        teacher_id: null,
      })
      .eq("id", userId)
      .select("id, username, is_teacher, account_role, account_status")
      .maybeSingle();

    if (
      profileError ||
      !saved?.id ||
      saved.is_teacher !== true ||
      saved.account_role !== "teacher"
    ) {
      await admin.auth.admin.deleteUser(userId);
      return {
        success: false,
        error: TEACHER_SIGNUP_ERROR,
      };
    }

    const username =
      typeof saved.username === "string" && saved.username.trim()
        ? saved.username.trim()
        : `t${userId.replace(/-/g, "").slice(0, 19)}`;

    if (username !== saved.username) {
      await admin.from("profiles").update({ username }).eq("id", userId);
    }

    const appUrl = await resolveSignupAppUrl();
    const token = signClassOpenToken({
      userId,
      email,
      createdAt: new Date().toISOString(),
    });

    const sent = await sendOnboardingEmail({
      type: "TEACHER_CLASS_CONFIRM",
      recipientEmail: email,
      data: { token },
      appUrl,
    });

    if (!sent.success) {
      await admin.auth.admin.deleteUser(userId);
      return {
        success: false,
        error:
          "We could not send the confirmation email. Check the address and try again.",
      };
    }

    return { success: true, userId, username, email };
  } catch {
    await admin.auth.admin.deleteUser(userId);
    return { success: false, error: TEACHER_SIGNUP_ERROR };
  }
}
