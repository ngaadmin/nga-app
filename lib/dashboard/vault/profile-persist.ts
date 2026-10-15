import { isDevClient } from "@/lib/dev/client-persist";
import {
  isGuestDeviceStorageKey,
  mirrorGuestDeviceWrite,
  readGuestDevicePersisted,
} from "@/lib/dev/guest-device-store";

/** Guest Vault balances. Kept on the device for 30 days while the learner is a guest. */
export function readVaultSessionRaw(key: string): string | null {
  if (typeof window === "undefined") return null;

  const guest = readGuestDevicePersisted(key);
  if (guest !== undefined) return guest;

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

  window.sessionStorage.setItem(key, value);
  if (isDevClient()) {
    window.localStorage.setItem(key, value);
  }
  mirrorGuestDeviceWrite(key, value);
}

export function removeVaultSessionRaw(key: string): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(key);
  if (isDevClient() || isGuestDeviceStorageKey(key)) {
    window.localStorage.removeItem(key);
  }
}

/** Registered profiles - survives browser restarts. */
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
