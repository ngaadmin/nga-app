import {
  hashCredential,
  type UserSession,
} from "@/lib/onboarding/guest-session";

/** Durable local registry — survives logout so returning users can log back in. */
export const REGISTERED_ACCOUNTS_STORAGE_KEY = "nga_registered_accounts_v1";

type RegisteredAccountsStore = {
  accounts: UserSession[];
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

  return match ?? null;
}

export function clearRegisteredAccounts(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REGISTERED_ACCOUNTS_STORAGE_KEY);
}
