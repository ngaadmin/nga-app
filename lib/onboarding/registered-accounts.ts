import {
  dispatchParentPinRecoveryEmail,
  RECOVERY_PARENT_PIN,
  resetParentPinToRecovery,
} from "@/lib/dashboard/parent-pin";
import { requestOnboardingEmailSend } from "@/lib/email/request-send";
import {
  hashCredential,
  type UserSession,
} from "@/lib/onboarding/guest-session";

/** Durable local registry - survives logout so returning users can log back in. */
export const REGISTERED_ACCOUNTS_STORAGE_KEY = "nga_registered_accounts_v1";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisteredAccountsStore = {
  accounts: UserSession[];
};

export type CredentialRecoveryResult = {
  /** Always true for UI - never reveal whether the email exists. */
  accepted: true;
  recipientEmail: string;
};

function readStore(): RegisteredAccountsStore {
  if (typeof window === "undefined") return { accounts: [] };

  try {
    const raw = window.localStorage.getItem(REGISTERED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return { accounts: [] };
    const parsed = JSON.parse(raw) as RegisteredAccountsStore;
    if (!Array.isArray(parsed?.accounts)) return { accounts: [] };
    return {
      accounts: parsed.accounts.filter(
        (entry): entry is UserSession =>
          Boolean(entry) &&
          typeof entry === "object" &&
          typeof entry.username === "string" &&
          entry.accessMode === "registered",
      ),
    };
  } catch {
    return { accounts: [] };
  }
}

function writeStore(store: RegisteredAccountsStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    REGISTERED_ACCOUNTS_STORAGE_KEY,
    JSON.stringify(store),
  );
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRecoveryEmail(value: string): string | null {
  const trimmed = normalizeIdentifier(value);
  return trimmed && EMAIL_PATTERN.test(trimmed) ? trimmed : null;
}

function accountMatchesIdentifier(
  account: UserSession,
  identifier: string,
): boolean {
  const needle = normalizeIdentifier(identifier);
  if (!needle) return false;

  if (account.username.trim().toLowerCase() === needle) return true;

  const learner = (account.learnerEmail ?? account.email)?.trim().toLowerCase();
  if (learner && learner === needle) return true;

  const parent = account.parentEmail?.trim().toLowerCase();
  if (parent && parent === needle) return true;

  return false;
}

function credentialMatchesAccount(
  account: UserSession,
  credential: string,
): boolean {
  const trimmed = credential.trim();
  if (!trimmed) return false;
  const digest = hashCredential(trimmed);

  if (account.passcodeHash && account.passcodeHash === digest) return true;
  if (account.passwordHash && account.passwordHash === digest) return true;

  return false;
}

function accountMatchesEmail(account: UserSession, email: string): boolean {
  const needle = normalizeIdentifier(email);
  if (!needle) return false;

  const learner = (account.learnerEmail ?? account.email)?.trim().toLowerCase();
  if (learner && learner === needle) return true;

  const parent = account.parentEmail?.trim().toLowerCase();
  if (parent && parent === needle) return true;

  return false;
}

/** Upsert a registered profile into the durable local account registry. */
export function upsertRegisteredAccount(session: UserSession): void {
  if (typeof window === "undefined") return;
  if (session.accessMode !== "registered") return;

  const store = readStore();
  const usernameKey = session.username.trim().toLowerCase();
  const nextAccounts = store.accounts.filter(
    (entry) => entry.username.trim().toLowerCase() !== usernameKey,
  );
  nextAccounts.push(session);
  writeStore({ accounts: nextAccounts });
}

/**
 * Authenticate against the durable local registry.
 * Identifier may be username, learner email, or parent email.
 */
export function authenticateRegisteredAccount(
  identifier: string,
  credential: string,
): UserSession | null {
  if (typeof window === "undefined") return null;

  const store = readStore();
  const match = store.accounts.find(
    (account) =>
      accountMatchesIdentifier(account, identifier) &&
      credentialMatchesAccount(account, credential),
  );

  if (!match) return null;

  const recoveryDigest = hashCredential(RECOVERY_PARENT_PIN);
  const usedTempRecovery =
    hashCredential(credential) === recoveryDigest ||
    match.mustChangePassword === true;

  if (usedTempRecovery) {
    return { ...match, mustChangePassword: true };
  }

  return match;
}

/**
 * Replace the temporary recovery credential with a new password and clear the
 * must-change flag so the user can continue into the app.
 */
export function setRegisteredAccountPassword(
  username: string,
  password: string,
): UserSession | null {
  if (typeof window === "undefined") return null;

  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  if (!trimmedUsername || trimmedPassword.length < 6) return null;

  const store = readStore();
  const index = store.accounts.findIndex(
    (account) =>
      account.username.trim().toLowerCase() === trimmedUsername.toLowerCase(),
  );
  if (index < 0) return null;

  const existing = store.accounts[index]!;
  const digest = hashCredential(trimmedPassword);
  const updated: UserSession = {
    ...existing,
    mustChangePassword: false,
  };

  if (existing.ageTier === "explorer" || existing.passcodeHash) {
    updated.passcodeHash = digest;
  }
  if (existing.ageTier !== "explorer") {
    updated.passwordHash = digest;
  }

  upsertRegisteredAccount(updated);
  return updated;
}

export function findRegisteredAccountsByEmail(email: string): UserSession[] {
  const normalized = normalizeRecoveryEmail(email);
  if (!normalized) return [];
  return readStore().accounts.filter((account) =>
    accountMatchesEmail(account, normalized),
  );
}

/**
 * Emails the username(s) linked to the parent/profile email on file.
 * Always resolves as accepted so the UI never discloses account existence.
 */
export async function recoverUsernameByEmail(
  email: string,
): Promise<CredentialRecoveryResult | { accepted: false; error: string }> {
  const recipientEmail = normalizeRecoveryEmail(email);
  if (!recipientEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }

  const accounts = findRegisteredAccountsByEmail(recipientEmail);
  for (const account of accounts) {
    await requestOnboardingEmailSend({
      type: "USERNAME_RECOVERY",
      recipientEmail,
      data: { username: account.username },
    });
  }

  return { accepted: true, recipientEmail };
}

/**
 * Resets Parent PIN via the existing recovery path and emails a temporary
 * passcode/PIN recovery code to the profile email on file.
 */
export async function recoverCredentialByEmail(
  email: string,
): Promise<CredentialRecoveryResult | { accepted: false; error: string }> {
  const recipientEmail = normalizeRecoveryEmail(email);
  if (!recipientEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }

  const accounts = findRegisteredAccountsByEmail(recipientEmail);
  const recoveryDigest = hashCredential(RECOVERY_PARENT_PIN);

  // Existing Parent PIN reset path (Settings / Parent Hub).
  resetParentPinToRecovery();

  for (const account of accounts) {
    const updated: UserSession = {
      ...account,
      mustChangePassword: true,
    };

    // Explorers log in with passcode; Pathfinder/Maverick with password.
    if (account.ageTier === "explorer" || account.passcodeHash) {
      updated.passcodeHash = recoveryDigest;
    }
    if (account.ageTier !== "explorer") {
      updated.passwordHash = recoveryDigest;
    }

    upsertRegisteredAccount(updated);

    await dispatchParentPinRecoveryEmail(recipientEmail);
    await requestOnboardingEmailSend({
      type: "CREDENTIAL_RECOVERY",
      recipientEmail,
      data: {
        username: account.username,
        recoveryCode: RECOVERY_PARENT_PIN,
      },
    });
  }

  // If no local account matched, still run the PIN reset email simulation when
  // an email was provided so the button always does something useful in demos.
  if (accounts.length === 0) {
    await dispatchParentPinRecoveryEmail(recipientEmail);
  }

  return { accepted: true, recipientEmail };
}

export function clearRegisteredAccounts(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REGISTERED_ACCOUNTS_STORAGE_KEY);
}
