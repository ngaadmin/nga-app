"use server";

import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  generateTemporaryPassword,
  hashTemporaryPassword,
} from "@/lib/auth/temporary-password";
import {
  getMasteryCohortFromBirthYear,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserIdByEmail } from "@/lib/onboarding/parent-master-lookup";
import { normalizeEmailAddress } from "@/lib/validation/email";

export type RecoveryRotation = {
  username: string;
  passwordHash: string;
  expiresAt: string;
};

export type HouseholdRecoveryResult =
  | { accepted: true; recipientEmail: string; rotations: RecoveryRotation[] }
  | { accepted: false; error: string };

const TEMP_PASSWORD_TTL_MS = 60 * 60 * 1000;

/**
 * Email-based household recovery. Always looks like success when the address
 * is valid so the UI never discloses whether an account exists.
 *
 * Parent email: reset the parent login and any linked learner logins, then
 * email the codes to that same address (parent-assisted child recovery).
 */
export async function requestHouseholdPasswordRecovery(
  email: string,
  options?: { onlyUsername?: string },
): Promise<HouseholdRecoveryResult> {
  const recipientEmail = normalizeEmailAddress(email);
  if (!recipientEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }

  const limit = consumeRateLimit(
    `household-recovery:${recipientEmail}`,
    3,
    15 * 60_000,
  );
  if (!limit.allowed) {
    return {
      accepted: false,
      error: "Too many recovery emails for this address. Try again in a few minutes.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { accepted: true, recipientEmail, rotations: [] };
  }

  const onlyUsername = options?.onlyUsername?.trim();
  if (onlyUsername) {
    const childRotation = await rotateLinkedChildByUsername(
      admin,
      onlyUsername,
      recipientEmail,
    );
    return {
      accepted: true,
      recipientEmail,
      rotations: childRotation ? [childRotation] : [],
    };
  }

  const rotations: RecoveryRotation[] = [];
  const rotatedIds = new Set<string>();

  const authUserId = await findAuthUserIdByEmail(recipientEmail);
  if (authUserId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, username, account_role, birth_year")
      .eq("id", authUserId)
      .maybeSingle();

    if (profile?.account_role === "parent_master") {
      const rotated = await rotateAndEmail(admin, {
        userId: profile.id,
        recipientEmail,
        displayName: recipientEmail,
        localUsername: profile.username ?? recipientEmail,
        cohort: undefined,
      });
      if (rotated) {
        rotations.push(rotated);
        rotatedIds.add(profile.id);
      }

      const childIds = await listHouseholdChildIds(admin, profile.id, recipientEmail);
      for (const childId of childIds) {
        if (rotatedIds.has(childId)) continue;
        const childRotation = await rotateChildLogin(admin, childId, recipientEmail);
        if (childRotation) {
          rotations.push(childRotation);
          rotatedIds.add(childId);
        }
      }
    } else if (profile?.account_role === "child" && profile.username) {
      const rotated = await rotateAndEmail(admin, {
        userId: profile.id,
        recipientEmail,
        displayName: profile.username,
        localUsername: profile.username,
        cohort: cohortFromBirthYear(profile.birth_year),
      });
      if (rotated) {
        rotations.push(rotated);
        rotatedIds.add(profile.id);
      }
    }
  }

  const childIds = await listChildIdsByParentEmail(admin, recipientEmail);
  for (const childId of childIds) {
    if (rotatedIds.has(childId)) continue;
    const childRotation = await rotateChildLogin(admin, childId, recipientEmail);
    if (childRotation) {
      rotations.push(childRotation);
      rotatedIds.add(childId);
    }
  }

  return { accepted: true, recipientEmail, rotations };
}

/**
 * Emails learner usernames linked to this parent/household address.
 * Parents log in with email, so this is for child usernames.
 */
export async function requestHouseholdUsernameRecovery(
  email: string,
): Promise<HouseholdRecoveryResult> {
  const recipientEmail = normalizeEmailAddress(email);
  if (!recipientEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }

  const limit = consumeRateLimit(
    `household-username:${recipientEmail}`,
    3,
    15 * 60_000,
  );
  if (!limit.allowed) {
    return {
      accepted: false,
      error: "Too many recovery emails for this address. Try again in a few minutes.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { accepted: true, recipientEmail, rotations: [] };
  }

  const linkedUsernames: string[] = [];
  const parentId = await findAuthUserIdByEmail(recipientEmail);
  if (parentId) {
    const childIds = await listHouseholdChildIds(admin, parentId, recipientEmail);
    for (const childId of childIds) {
      const { data: child } = await admin
        .from("profiles")
        .select("username, account_role")
        .eq("id", childId)
        .maybeSingle();
      if (child?.account_role === "child" && child.username?.trim()) {
        linkedUsernames.push(child.username.trim());
      }
    }
  }

  if (linkedUsernames.length === 0) {
    const childIds = await listChildIdsByParentEmail(admin, recipientEmail);
    for (const childId of childIds) {
      const { data: child } = await admin
        .from("profiles")
        .select("username, account_role")
        .eq("id", childId)
        .maybeSingle();
      if (child?.account_role === "child" && child.username?.trim()) {
        linkedUsernames.push(child.username.trim());
      }
    }
  }

  const unique = [...new Set(linkedUsernames)];
  if (unique.length === 0) {
    return { accepted: true, recipientEmail, rotations: [] };
  }

  await sendOnboardingEmail({
    type: "USERNAME_RECOVERY",
    recipientEmail,
    data: {
      username: unique[0]!,
      linkedUsernames: unique,
    },
  });

  return { accepted: true, recipientEmail, rotations: [] };
}

async function listHouseholdChildIds(
  admin: ReturnType<typeof createAdminClient>,
  parentId: string,
  parentEmail: string,
): Promise<string[]> {
  const ids = new Set<string>();
  const { data: links } = await admin
    .from("parent_child")
    .select("child_id")
    .eq("parent_id", parentId);
  for (const row of links ?? []) {
    if (row.child_id) ids.add(row.child_id);
  }
  for (const childId of await listChildIdsByParentEmail(admin, parentEmail)) {
    ids.add(childId);
  }
  return [...ids];
}

async function listChildIdsByParentEmail(
  admin: ReturnType<typeof createAdminClient>,
  parentEmail: string,
): Promise<string[]> {
  const { data: rows } = await admin
    .from("consent_requests")
    .select("child_id")
    .eq("parent_email", parentEmail);
  const ids = new Set<string>();
  for (const row of rows ?? []) {
    if (row.child_id) ids.add(row.child_id);
  }
  return [...ids];
}

async function rotateLinkedChildByUsername(
  admin: ReturnType<typeof createAdminClient>,
  username: string,
  parentEmail: string,
): Promise<RecoveryRotation | null> {
  const { data: child } = await admin
    .from("profiles")
    .select("id, username, account_role, birth_year")
    .eq("username", username)
    .maybeSingle();
  if (!child?.id || child.account_role !== "child" || !child.username?.trim()) {
    return null;
  }

  const parentId = await findAuthUserIdByEmail(parentEmail);
  const linkedIds = parentId
    ? await listHouseholdChildIds(admin, parentId, parentEmail)
    : await listChildIdsByParentEmail(admin, parentEmail);
  if (!linkedIds.includes(child.id)) {
    return null;
  }

  return rotateChildLogin(admin, child.id, parentEmail);
}

async function rotateChildLogin(
  admin: ReturnType<typeof createAdminClient>,
  childId: string,
  recipientEmail: string,
): Promise<RecoveryRotation | null> {
  const { data: child } = await admin
    .from("profiles")
    .select("id, username, account_role, birth_year")
    .eq("id", childId)
    .maybeSingle();
  if (!child?.id || child.account_role !== "child" || !child.username?.trim()) {
    return null;
  }
  return rotateAndEmail(admin, {
    userId: child.id,
    recipientEmail,
    displayName: child.username.trim(),
    localUsername: child.username.trim(),
    cohort: cohortFromBirthYear(child.birth_year),
  });
}

async function rotateAndEmail(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    userId: string;
    recipientEmail: string;
    displayName: string;
    localUsername: string;
    cohort?: MasteryCohort;
  },
): Promise<RecoveryRotation | null> {
  const temporaryPassword = generateTemporaryPassword();
  const sendResult = await sendOnboardingEmail({
    type: "CREDENTIAL_RECOVERY",
    recipientEmail: input.recipientEmail,
    data: {
      username: input.displayName,
      recoveryCode: temporaryPassword,
      cohort: input.cohort,
    },
  });

  if (!sendResult.success) return null;
  if (sendResult.simulated && process.env.NODE_ENV === "production") {
    return null;
  }

  const { error } = await admin.auth.admin.updateUserById(input.userId, {
    password: temporaryPassword,
    user_metadata: { mustChangePassword: true },
  });
  if (error) return null;

  return {
    username: input.localUsername,
    passwordHash: hashTemporaryPassword(temporaryPassword),
    expiresAt: new Date(Date.now() + TEMP_PASSWORD_TTL_MS).toISOString(),
  };
}

function cohortFromBirthYear(birthYear: unknown): MasteryCohort | undefined {
  if (typeof birthYear !== "number") return undefined;
  return getMasteryCohortFromBirthYear(birthYear);
}
