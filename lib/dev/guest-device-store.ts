/**
 * Guest play progress kept on the device. Registered accounts stay on the
 * existing session store. A pending Explorer keeps this copy until approval.
 */

export const GUEST_DEVICE_META_KEY = "nga_guest_device_meta_v1";

/** Abandoned guest progress expires 30 days after the last save. */
export const GUEST_DEVICE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const GUEST_SESSION_STORAGE_KEY = "nga_guest_session";

const GUEST_DEVICE_KEYS = [
  GUEST_SESSION_STORAGE_KEY,
  "nga_ghost_session",
  "nga_guest_progress_snapshot_v1",
  "nga_dashboard_wallet_v2",
  "nga_academy_progress_v1",
  "nga_vault_skill_progress_v1",
  "nga_vault_session_v1",
  "nga_vault_v2_session_v1",
] as const;

type SessionHint = {
  accessMode?: string;
  accountStatus?: string;
  accountRole?: string;
  isTeacher?: boolean;
  genericProfileId?: string;
  username?: string;
};

type GuestDeviceMeta = {
  guestId: string;
  expiresAt: number;
};

export function isGuestDeviceStorageKey(key: string): boolean {
  return (GUEST_DEVICE_KEYS as readonly string[]).includes(key);
}

function parseHint(raw: string | null): SessionHint | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionHint;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function readSessionHint(): SessionHint | null {
  if (typeof window === "undefined") return null;
  return (
    parseHint(window.sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY)) ??
    parseHint(window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY))
  );
}

/** Guest play, or a child still waiting on parent approval. */
export function sessionUsesGuestDeviceStore(session: SessionHint | null): boolean {
  if (!session) return false;
  if (session.accessMode === "guest" || session.accountStatus === "GUEST") {
    return true;
  }
  if (session.accessMode !== "registered") return false;
  if (
    session.accountRole === "parent_master" ||
    session.accountRole === "teacher" ||
    session.isTeacher === true
  ) {
    return false;
  }
  return session.accountStatus === "PENDING_CONSENT";
}

function readMeta(): GuestDeviceMeta | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(GUEST_DEVICE_META_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GuestDeviceMeta>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.expiresAt !== "number" || typeof parsed.guestId !== "string") {
      return null;
    }
    return { guestId: parsed.guestId, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

function guestDeviceMetaExpired(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(GUEST_DEVICE_META_KEY);
  if (!raw) return false;
  const meta = readMeta();
  if (!meta) return true;
  return meta.expiresAt <= Date.now();
}

function touchGuestDeviceMeta(): void {
  if (typeof window === "undefined") return;
  const hint = readSessionHint();
  const guestId =
    (typeof hint?.genericProfileId === "string" && hint.genericProfileId.trim()) ||
    (typeof hint?.username === "string" && hint.username.trim()) ||
    "guest";
  const meta: GuestDeviceMeta = {
    guestId,
    expiresAt: Date.now() + GUEST_DEVICE_TTL_MS,
  };
  window.localStorage.setItem(GUEST_DEVICE_META_KEY, JSON.stringify(meta));
}

/** Drop the device copy. The open tab's session store is left as-is. */
export function releaseGuestDeviceLocalCopy(): void {
  if (typeof window === "undefined") return;
  for (const key of GUEST_DEVICE_KEYS) {
    window.localStorage.removeItem(key);
  }
  window.localStorage.removeItem(GUEST_DEVICE_META_KEY);
}

/** Log out or a new guest: remove guest progress from both stores. */
export function wipeGuestDeviceProgress(): void {
  if (typeof window === "undefined") return;
  for (const key of GUEST_DEVICE_KEYS) {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  }
  window.sessionStorage.removeItem(GUEST_DEVICE_META_KEY);
  window.localStorage.removeItem(GUEST_DEVICE_META_KEY);
}

/**
 * Read a guest-device key.
 * Returns undefined when this key should use the normal session store.
 * An expired device copy is wiped; the open tab can still read its session value.
 */
export function readGuestDevicePersisted(key: string): string | null | undefined {
  if (typeof window === "undefined") return undefined;
  if (!isGuestDeviceStorageKey(key)) return undefined;

  if (guestDeviceMetaExpired()) {
    releaseGuestDeviceLocalCopy();
    return window.sessionStorage.getItem(key);
  }

  if (!sessionUsesGuestDeviceStore(readSessionHint())) return undefined;

  const local = window.localStorage.getItem(key);
  if (local !== null) return local;
  return window.sessionStorage.getItem(key);
}

/** Mirror a guest-scoped write into localStorage and slide the 30-day expiry. */
export function mirrorGuestDeviceWrite(key: string, value: string): void {
  if (typeof window === "undefined") return;
  if (!isGuestDeviceStorageKey(key)) return;
  if (!sessionUsesGuestDeviceStore(readSessionHint())) return;
  window.localStorage.setItem(key, value);
  touchGuestDeviceMeta();
}
