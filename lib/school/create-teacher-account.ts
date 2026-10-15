"use server";

import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { getDefaultAppUrl } from "@/lib/email/templates";
import { findAuthUserIdByEmail } from "@/lib/onboarding/parent-master-lookup";
import { generateClassPassword } from "@/lib/school/class-password";
import {
  classPasswordCipherUpdate,
  explainClassPasswordWriteError,
  readClassPasswordKey,
} from "@/lib/school/class-password-crypto";
import { signClassOpenToken } from "@/lib/school/class-open-token";
import { parseMasteryCohort, type MasteryCohort } from "@/lib/dashboard/mastery-cohort";
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
 * /school signup: class track, then email + password → teacher Auth user,
 * is_teacher, seat_cap, class_cohort, and one confirm-account email.
 * Stays inactive until the mail button.
 * No parent-consent mail. No consent_approved_at.
 * class_cohort is written with the service role because protect_profile_columns
 * blocks client updates.
 */
export async function createTeacherAccount(input: {
  email: string;
  password: string;
  classCohort: MasteryCohort;
}): Promise<CreateTeacherAccountResult> {
  const classCohort = parseMasteryCohort(input.classCohort);
  if (!classCohort) {
    return {
      success: false,
      error: "Pick the learning track for this profile.",
    };
  }
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

  try {
    readClassPasswordKey();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "CLASS_PASSWORD_KEY is not set.";
    console.error("[teacher-signup]", message);
    return { success: false, error: message };
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
        account_role: "teacher",
        account_status: "pending_consent",
        marketing_opt_in: false,
        consent_approved_at: null,
        is_teacher: true,
        seat_cap: DEFAULT_SEAT_CAP,
        class_cohort: classCohort,
        ...classPasswordCipherUpdate(generateClassPassword(), userId),
        teacher_id: null,
      })
      .eq("id", userId)
      .select("id, username, is_teacher, account_role, account_status, class_cohort")
      .maybeSingle();

    if (
      profileError ||
      !saved?.id ||
      saved.is_teacher !== true ||
      saved.account_role !== "teacher" ||
      saved.class_cohort !== classCohort
    ) {
      await admin.auth.admin.deleteUser(userId);
      if (profileError) {
        console.error("[teacher-signup]", profileError.message);
        const explained = explainClassPasswordWriteError(profileError.message);
        if (explained !== profileError.message) {
          return { success: false, error: explained };
        }
      }
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
  } catch (error) {
    await admin.auth.admin.deleteUser(userId);
    const message = error instanceof Error ? error.message : TEACHER_SIGNUP_ERROR;
    if (/CLASS_PASSWORD_KEY|class_password_enc/.test(message)) {
      console.error("[teacher-signup]", message);
      return { success: false, error: message };
    }
    return { success: false, error: TEACHER_SIGNUP_ERROR };
  }
}
