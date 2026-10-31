/**
 * Parent tab PIN. TEST-ONLY STAND-IN: the hash lives on this device in
 * localStorage, keyed per parent user id. Server-side storage is drafted in
 * docs/draft-migrations/parent_tab_pin.sql and is not applied.
 *
 * This PIN is separate from the profile-switch parent PIN
 * (profiles.parent_pin_hash). It never gates switching into the parent
 * profile; it only gates the Parent tab, and it is asked on every open.
 *
 * Hash: PBKDF2-SHA-256, random 16-byte salt per parent, never plain text.
 */

export const PARENT_TAB_PIN_STORAGE_KEY = "nga_parent_tab_pin_v1";
export const PARENT_TAB_PIN_ITERATIONS = 150_000;
export const PARENT_TAB_PIN_MAX_TRIES = 5;
export const PARENT_TAB_PIN_LOCKOUT_MS = 5 * 60 * 1000;

export type ParentTabPinRecord = {
  /** base64 salt */
  salt: string;
  /** base64 PBKDF2-SHA-256 digest */
  hash: string;
  iterations: number;
  failedTries: number;
  /** Epoch ms. Null when not locked out. */
  lockedUntil: number | null;
};

type Store = Record<string, ParentTabPinRecord>;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is ParentTabPinRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.salt === "string" &&
    typeof row.hash === "string" &&
    typeof row.iterations === "number"
  );
}

function readStore(): Store {
  const raw = storage()?.getItem(PARENT_TAB_PIN_STORAGE_KEY) ?? null;
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    const out: Store = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!isRecord(value)) continue;
      out[key] = {
        salt: value.salt,
        hash: value.hash,
        iterations: value.iterations,
        failedTries: Number.isInteger(value.failedTries)
          ? value.failedTries
          : 0,
        lockedUntil:
          typeof value.lockedUntil === "number" ? value.lockedUntil : null,
      };
    }
    return out;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  storage()?.setItem(PARENT_TAB_PIN_STORAGE_KEY, JSON.stringify(store));
}

function toBase64(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

function fromBase64(value: string): Uint8Array {
  const text = atob(value);
  const out = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    out[index] = text.charCodeAt(index);
  }
  return out;
}

export function isParentTabPin(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export async function deriveParentTabPinHash(
  pin: string,
  salt: Uint8Array,
  iterations = PARENT_TAB_PIN_ITERATIONS,
): Promise<string> {
  const subtle = globalThis.crypto.subtle;
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

export function hasParentTabPin(parentUserId: string): boolean {
  return Boolean(readStore()[parentUserId]);
}

export function parentTabPinLockedUntil(
  parentUserId: string,
  now = Date.now(),
): number | null {
  const record = readStore()[parentUserId];
  if (!record?.lockedUntil) return null;
  return record.lockedUntil > now ? record.lockedUntil : null;
}

export async function setParentTabPin(
  parentUserId: string,
  pin: string,
): Promise<void> {
  if (!isParentTabPin(pin)) throw new Error("PIN must be 4 digits.");
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveParentTabPinHash(pin, salt);
  const store = readStore();
  store[parentUserId] = {
    salt: toBase64(salt),
    hash,
    iterations: PARENT_TAB_PIN_ITERATIONS,
    failedTries: 0,
    lockedUntil: null,
  };
  writeStore(store);
}

export type ParentTabPinCheck =
  | { ok: true }
  | {
      ok: false;
      reason: "missing" | "wrong" | "locked";
      triesLeft: number;
      lockedUntil: number | null;
    };

export async function checkParentTabPin(
  parentUserId: string,
  pin: string,
  now = Date.now(),
): Promise<ParentTabPinCheck> {
  const store = readStore();
  const record = store[parentUserId];
  if (!record) {
    return { ok: false, reason: "missing", triesLeft: 0, lockedUntil: null };
  }
  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      ok: false,
      reason: "locked",
      triesLeft: 0,
      lockedUntil: record.lockedUntil,
    };
  }
  if (record.lockedUntil && record.lockedUntil <= now) {
    record.lockedUntil = null;
    record.failedTries = 0;
  }
  const hash = isParentTabPin(pin)
    ? await deriveParentTabPinHash(
        pin,
        fromBase64(record.salt),
        record.iterations,
      )
    : "";
  if (hash && constantTimeEqual(hash, record.hash)) {
    record.failedTries = 0;
    record.lockedUntil = null;
    store[parentUserId] = record;
    writeStore(store);
    return { ok: true };
  }
  record.failedTries += 1;
  if (record.failedTries >= PARENT_TAB_PIN_MAX_TRIES) {
    record.failedTries = 0;
    record.lockedUntil = now + PARENT_TAB_PIN_LOCKOUT_MS;
  }
  store[parentUserId] = record;
  writeStore(store);
  if (record.lockedUntil) {
    return {
      ok: false,
      reason: "locked",
      triesLeft: 0,
      lockedUntil: record.lockedUntil,
    };
  }
  return {
    ok: false,
    reason: "wrong",
    triesLeft: PARENT_TAB_PIN_MAX_TRIES - record.failedTries,
    lockedUntil: null,
  };
}

/** Removes this parent's Parent tab PIN on this device (after a password check). */
export function clearParentTabPin(parentUserId: string): void {
  const store = readStore();
  delete store[parentUserId];
  writeStore(store);
}
