import { isDevClient } from "@/lib/dev/client-persist";

/** Guest play — cleared when the browser session ends. */
export function readVaultSessionRaw(key: string): string | null {
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

export function writeVaultSessionRaw(key: string, value: string): void {
  if (typeof window === "undefined") return;

  if (isDevClient()) {
    window.localStorage.setItem(key, value);
  }
  window.sessionStorage.setItem(key, value);
}

export function removeVaultSessionRaw(key: string): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(key);
  if (isDevClient()) {
    window.localStorage.removeItem(key);
  }
}

/** Registered profiles — survives browser restarts. */
export function readVaultProfileRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function writeVaultProfileRaw(key: string, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

export function removeVaultProfileRaw(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}
