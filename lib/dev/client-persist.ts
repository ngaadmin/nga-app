/** Dev-only: mirror guest-phase keys in localStorage so progress survives HMR and tab restarts. */

export function isDevClient(): boolean {
  return process.env.NODE_ENV === "development";
}

export function readPersisted(key: string): string | null {
  if (typeof window === "undefined") return null;

  if (isDevClient()) {
    const local = window.localStorage.getItem(key);
    if (local !== null) return local;

    const session = window.sessionStorage.getItem(key);
    if (session !== null) {
      window.localStorage.setItem(key, session);
      return session;
    }
    return null;
  }

  return window.sessionStorage.getItem(key);
}

export function writePersisted(key: string, value: string): void {
  if (typeof window === "undefined") return;

  if (isDevClient()) {
    window.localStorage.setItem(key, value);
  }
  window.sessionStorage.setItem(key, value);
}

export function removePersisted(key: string): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(key);
  if (isDevClient()) {
    window.localStorage.removeItem(key);
  }
}

/** Clear all nga_* keys from both stores (dev reset), optionally preserving some. */
export function clearAllPersistedNgaKeys(preserveKeys: string[] = []): void {
  if (typeof window === "undefined") return;

  const preserve = new Set(preserveKeys);

  const removeFrom = (store: Storage) => {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key?.startsWith("nga_") && !preserve.has(key)) keys.push(key);
    }
    for (const key of keys) store.removeItem(key);
  };

  removeFrom(window.sessionStorage);
  if (isDevClient()) {
    removeFrom(window.localStorage);
  }
}
