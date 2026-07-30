import { isDevClient } from "@/lib/dev/client-persist";

/** Guest play — cleared when the browser session ends. */
export function readVaultV2SessionRaw(key: string): string | null {
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

export function writeVaultV2SessionRaw(key: string, value: string): void {
  if (typeof window === "undefined") return;

  if (isDevClient()) {
    window.localStorage.setItem(key, value);
  }
  window.sessionStorage.setItem(key, value);
}

export function removeVaultV2SessionRaw(key: string): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(key);
  if (isDevClient()) {
    window.localStorage.removeItem(key);
  }
}

/** Registered profiles — survives browser restarts. */
export function readVaultV2ProfileRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function writeVaultV2ProfileRaw(key: string, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

export function removeVaultV2ProfileRaw(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}
