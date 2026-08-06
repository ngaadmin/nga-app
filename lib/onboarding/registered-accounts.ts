import { requestOnboardingEmailSend } from "@/lib/email/request-send";
import { isTemporaryPasswordHash } from "@/lib/auth/temporary-password";
import {
  hashCredential,
  verifyCredential,
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

function storedCredentialMatches(
  stored: string | undefined,
  credential: string,
): boolean {
  if (!stored) return false;
  return verifyCredential(credential, stored);
}

function credentialMatchesAccount(
  account: UserSession,
  credential: string,
): boolean {
  const trimmed = credential.trim();
  if (!trimmed) return false;

  if (storedCredentialMatches(account.passcodeHash, trimmed)) return true;
  if (storedCredentialMatches(account.passwordHash, trimmed)) return true;

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

function applyTemporaryPasswordHash(
  account: UserSession,
  passwordHash: string,
  expiresAt: string,
): UserSession {
  const updated: UserSession = {
    ...account,
    mustChangePassword: true,
    temporaryPasswordExpiresAt: expiresAt,
  };

  if (account.ageTier === "explorer" || account.passcodeHash) {
    updated.passcodeHash = passwordHash;
  }
  if (account.ageTier !== "explorer") {
    updated.passwordHash = passwordHash;
  }

  return updated;
}

/** Temp recovery credentials fail closed when expiry is missing or past. */
function isTemporaryPasswordExpired(account: UserSession): boolean {
  const hasTempHash =
    isTemporaryPasswordHash(account.passwordHash ?? "") ||
    isTemporaryPasswordHash(account.passcodeHash ?? "");
  if (!hasTempHash) return false;

  const expiresAt = account.temporaryPasswordExpiresAt?.trim();
  if (!expiresAt) return true;

  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) return true;
  return Date.now() > expiresMs;
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

/** Look up a registered profile by username (case-insensitive). */
export function findRegisteredAccountByUsername(
  username: string,
): UserSession | null {
  if (typeof window === "undefined") return null;
  const key = username.trim().toLowerCase();
  if (!key) return null;
  return (
    readStore().accounts.find(
      (account) => account.username.trim().toLowerCase() === key,
    ) ?? null
  );
}

/**
 * Username uniqueness only — parent/guardian emails may link many child
 * profiles and must never be treated as a duplicate-account key.
 */
export function isRegisteredUsernameTaken(username: string): boolean {
  return findRegisteredAccountByUsername(username) !== null;
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

  const usedTempHash =
    isTemporaryPasswordHash(match.passwordHash ?? "") ||
    isTemporaryPasswordHash(match.passcodeHash ?? "");

  if (usedTempHash && isTemporaryPasswordExpired(match)) {
    return null;
  }

  const usedTempRecovery =
    match.mustChangePassword === true || usedTempHash;

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
    temporaryPasswordExpiresAt: undefined,
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
      data: {
        username: account.username,
        cohort: account.ageTier,
        masterUsername:
          account.accountRole === "parent_master"
            ? account.username
            : undefined,
        linkedUsernames:
          account.ageTier === "explorer" ? [account.username] : undefined,
      },
    });
  }

  return { accepted: true, recipientEmail };
}

type TemporaryPasswordApiResult = {
  success?: boolean;
  passwordHash?: string;
  expiresAt?: string;
  error?: string;
};

/**
 * Requests a server-issued random temporary password (emailed server-side),
 * then stores only the returned salted hash on matching local accounts.
 * Does not update credentials unless the recovery email was handed off.
 * Does not touch Parent PIN / parental-controls recovery.
 */
export async function recoverCredentialByEmail(
  email: string,
): Promise<CredentialRecoveryResult | { accepted: false; error: string }> {
  const recipientEmail = normalizeRecoveryEmail(email);
  if (!recipientEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }

  const accounts = findRegisteredAccountsByEmail(recipientEmail);

  // Enumeration-safe: no local match still looks like success.
  if (accounts.length === 0) {
    return { accepted: true, recipientEmail };
  }

  let successCount = 0;
  let lastError =
    "Could not send a recovery email. Check your connection and try again.";

  for (const account of accounts) {
    try {
      const response = await fetch("/api/auth/temporary-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          username: account.username,
          cohort: account.ageTier,
        }),
      });

      const json = (await response.json().catch(() => null)) as
        | TemporaryPasswordApiResult
        | null;

      if (!response.ok || !json?.passwordHash || !json.expiresAt) {
        if (typeof json?.error === "string" && json.error.trim()) {
          lastError = json.error.trim();
        }
        continue;
      }

      upsertRegisteredAccount(
        applyTemporaryPasswordHash(
          account,
          json.passwordHash,
          json.expiresAt,
        ),
      );
      successCount += 1;
    } catch {
      // Leave existing credentials; try remaining accounts.
    }
  }

  if (successCount === 0) {
    return { accepted: false, error: lastError };
  }

  return { accepted: true, recipientEmail };
}

export function clearRegisteredAccounts(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REGISTERED_ACCOUNTS_STORAGE_KEY);
}
