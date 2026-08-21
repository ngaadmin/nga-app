import { verifyCredential } from "@/lib/auth/credential-hash";
import { isTemporaryPasswordHash } from "@/lib/auth/temporary-password";
import {
  hashCredential,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import {
  requestHouseholdUsernameRecovery,
} from "@/lib/onboarding/household-recovery";
import { displayUsernameOrEmpty } from "@/lib/onboarding/placeholder-username";
import { EMAIL_PATTERN } from "@/lib/validation/email";

/** Durable local registry - survives logout so returning users can log back in. */
export const REGISTERED_ACCOUNTS_STORAGE_KEY = "nga_registered_accounts_v1";

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
      account.username.trim().toLowerCase() === trimmedUsername.toLowerCase() ||
      accountMatchesIdentifier(account, trimmedUsername),
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

/** Active parent master profile linked to this parent/guardian email, if any. */
export function findActiveParentMasterByEmail(
  email: string,
): UserSession | null {
  const normalized = normalizeRecoveryEmail(email);
  if (!normalized) return null;

  return (
    readStore().accounts.find((account) => {
      if (account.accountRole !== "parent_master") return false;
      if (account.accessMode !== "registered") return false;
      if (account.accountStatus && account.accountStatus !== "ACTIVE") {
        return false;
      }
      const masterEmail = normalizeRecoveryEmail(
        account.learnerEmail ?? account.email ?? account.parentEmail ?? "",
      );
      return masterEmail === normalized;
    }) ?? null
  );
}

/**
 * Emails the username(s) linked to the parent/profile email on file.
 * Always resolves as accepted so the UI never discloses account existence.
 *
 * Explorer / parent-master households get one digest email (master + all
 * linked Explorers). Pathfinder / Maverick learner matches still get one
 * email each for their own username.
 */
export async function recoverUsernameByEmail(
  email: string,
): Promise<CredentialRecoveryResult | { accepted: false; error: string }> {
  const recipientEmail = normalizeRecoveryEmail(email);
  if (!recipientEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }

  const remote = await requestHouseholdUsernameRecovery(recipientEmail);
  if (!remote.accepted) {
    return remote;
  }

  return { accepted: true, recipientEmail };
}

/**
 * Emails a password reset link for exactly one account. Does not change any
 * password until the user submits the reset form. Does not touch Parent PIN.
 */
export async function recoverPassword(input: {
  email?: string;
  username?: string;
}): Promise<CredentialRecoveryResult | { accepted: false; error: string }> {
  const username = input.username?.trim() ?? "";
  const recipientEmail = input.email?.trim()
    ? normalizeRecoveryEmail(input.email)
    : "";

  if (input.email?.trim() && !recipientEmail) {
    return { accepted: false, error: "Enter a valid email address." };
  }
  if (!recipientEmail && !username) {
    return {
      accepted: false,
      error:
        "Enter the email for that login, or a username that identifies one account.",
    };
  }

  try {
    const response = await fetch("/api/auth/password-recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: recipientEmail || undefined,
        username: username || undefined,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    const json = (await response.json().catch(() => null)) as
      | CredentialRecoveryResult
      | { accepted?: false; error?: string }
      | null;

    if (json?.accepted === true) {
      return {
        accepted: true,
        recipientEmail:
          typeof json.recipientEmail === "string"
            ? json.recipientEmail
            : recipientEmail || "",
      };
    }

    return {
      accepted: false,
      error:
        typeof json?.error === "string" && json.error.trim()
          ? json.error.trim()
          : "Could not send a recovery email. Try again shortly.",
    };
  } catch {
    return {
      accepted: false,
      error: "Could not send a recovery email. Try again shortly.",
    };
  }
}

/** Settings / existing callers: one-account reset via household email. */
export async function recoverCredentialByEmail(
  email: string,
  options?: { onlyUsername?: string },
): Promise<CredentialRecoveryResult | { accepted: false; error: string }> {
  return recoverPassword({
    email,
    username: options?.onlyUsername,
  });
}

/** Household email used to link a parent master account to child profiles. */
export function resolveHouseholdEmail(session: UserSession): string | null {
  if (session.accountRole === "parent_master") {
    return (
      normalizeRecoveryEmail(
        session.learnerEmail ?? session.email ?? session.parentEmail ?? "",
      )
    );
  }
  return normalizeRecoveryEmail(session.parentEmail ?? "");
}

const PARENT_IDENTITY_FALLBACK = "Parent";

/** Public identity: parent username (email fallback), or learner username. */
export function displayAccountIdentity(session: UserSession): string {
  if (session.accountRole === "parent_master") {
    return (
      displayUsernameOrEmpty(session.username) ||
      resolveHouseholdEmail(session) ||
      PARENT_IDENTITY_FALLBACK
    );
  }
  return session.username.trim();
}

/**
 * Master + child profiles linked by the household parent/guardian email.
 * Guest-only sessions with no registry match still surface the active profile.
 */
export function listHouseholdAccounts(session: UserSession): {
  master: UserSession | null;
  children: UserSession[];
  householdEmail: string | null;
} {
  const householdEmail = resolveHouseholdEmail(session);
  if (!householdEmail) {
    if (session.accountRole === "parent_master") {
      return { master: session, children: [], householdEmail: null };
    }
    return {
      master: null,
      children: session.accessMode === "registered" ? [session] : [],
      householdEmail: null,
    };
  }

  const accounts = readStore().accounts;
  const master =
    accounts.find(
      (account) =>
        account.accountRole === "parent_master" &&
        normalizeRecoveryEmail(
          account.learnerEmail ?? account.email ?? account.parentEmail ?? "",
        ) === householdEmail,
    ) ?? null;

  const children = accounts.filter(
    (account) =>
      account.accountRole !== "parent_master" &&
      normalizeRecoveryEmail(account.parentEmail ?? "") === householdEmail,
  );

  return { master, children, householdEmail };
}

/** Remove one registered profile by username. */
export function removeRegisteredAccountByUsername(username: string): boolean {
  if (typeof window === "undefined") return false;
  const key = username.trim().toLowerCase();
  if (!key) return false;

  const store = readStore();
  const nextAccounts = store.accounts.filter(
    (account) => account.username.trim().toLowerCase() !== key,
  );
  if (nextAccounts.length === store.accounts.length) return false;
  writeStore({ accounts: nextAccounts });
  return true;
}

/**
 * Delete a parent master profile and every child linked to the same
 * household email. Returns usernames that were removed.
 */
export function deleteMasterAccountCascade(masterUsername: string): string[] {
  if (typeof window === "undefined") return [];

  const master = findRegisteredAccountByUsername(masterUsername);
  if (!master) return [];

  const householdEmail =
    resolveHouseholdEmail(master) ??
    normalizeRecoveryEmail(
      master.learnerEmail ?? master.email ?? master.parentEmail ?? "",
    );

  const store = readStore();
  const removed: string[] = [];
  const nextAccounts = store.accounts.filter((account) => {
    const isMaster =
      account.username.trim().toLowerCase() ===
      masterUsername.trim().toLowerCase();
    const isLinkedChild =
      Boolean(householdEmail) &&
      account.accountRole !== "parent_master" &&
      normalizeRecoveryEmail(account.parentEmail ?? "") === householdEmail;

    if (isMaster || isLinkedChild) {
      removed.push(account.username);
      return false;
    }
    return true;
  });

  writeStore({ accounts: nextAccounts });
  return removed;
}
