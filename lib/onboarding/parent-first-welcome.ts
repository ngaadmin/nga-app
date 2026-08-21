const PARENT_FIRST_WELCOME_KEY = "nga_parent_first_welcome_v1";

export { PARENT_FIRST_WELCOME_KEY };

type WelcomeStore = {
  pending: string[];
  seen: string[];
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function readStore(): WelcomeStore {
  if (typeof window === "undefined") return { pending: [], seen: [] };
  try {
    const raw = window.localStorage.getItem(PARENT_FIRST_WELCOME_KEY);
    if (!raw) return { pending: [], seen: [] };
    const parsed = JSON.parse(raw) as WelcomeStore;
    return {
      pending: Array.isArray(parsed.pending) ? parsed.pending.map(normalizeKey) : [],
      seen: Array.isArray(parsed.seen) ? parsed.seen.map(normalizeKey) : [],
    };
  } catch {
    return { pending: [], seen: [] };
  }
}

function writeStore(store: WelcomeStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PARENT_FIRST_WELCOME_KEY, JSON.stringify(store));
}

/** Flag a newly created Explorer-approval parent for the one-time welcome. */
export function markParentFirstWelcomePending(accountKey: string): void {
  const key = normalizeKey(accountKey);
  if (!key) return;
  const store = readStore();
  if (store.seen.includes(key) || store.pending.includes(key)) {
    writeStore(store);
    return;
  }
  writeStore({
    pending: [...store.pending, key],
    seen: store.seen,
  });
}

export function shouldShowParentFirstWelcome(accountKey: string): boolean {
  const key = normalizeKey(accountKey);
  if (!key) return false;
  const store = readStore();
  return store.pending.includes(key) && !store.seen.includes(key);
}

/** Acknowledge the welcome so later logins never show it again. */
export function markParentFirstWelcomeSeen(accountKey: string): void {
  const key = normalizeKey(accountKey);
  if (!key) return;
  const store = readStore();
  writeStore({
    pending: store.pending.filter((entry) => entry !== key),
    seen: store.seen.includes(key) ? store.seen : [...store.seen, key],
  });
}
