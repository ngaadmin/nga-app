import { markAccountProgressDirty } from "@/lib/dashboard/account-progress-dirty";
import {
  HUB_INTRO_IDS,
  type HubIntroId,
  type HubIntroSeenMap,
} from "@/lib/dashboard/hub-intro/types";
import {
  mergePageIntroFlags,
  type AccountPageIntroFlags,
} from "@/lib/dashboard/page-intro-flags";
import { currentAccountLocalKey } from "@/lib/onboarding/account-local-key";

/** Durable per-account first-visit flags. Survives logout; not shared across accounts. */
export const PAGE_INTRO_SEEN_BY_ACCOUNT_KEY =
  "nga_page_intro_seen_by_account_v1";

export type AccountPageIntroSeen = AccountPageIntroFlags;

type PageIntroSeenStore = Record<string, AccountPageIntroSeen>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseHubs(value: unknown): HubIntroSeenMap {
  if (!isRecord(value)) return {};
  const next: HubIntroSeenMap = {};
  for (const id of HUB_INTRO_IDS) {
    if (value[id] === true) next[id] = true;
  }
  return next;
}

export function parsePageIntroSeenStore(
  raw: string | null,
): PageIntroSeenStore {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const store: PageIntroSeenStore = {};
    for (const [accountKey, value] of Object.entries(parsed)) {
      if (!accountKey.trim() || !isRecord(value)) continue;
      store[accountKey] = {
        hubs: parseHubs(value.hubs),
        vaultAddMoney: value.vaultAddMoney === true,
        skillsCup: value.skillsCup === true,
        medals: value.medals === true,
        profileSwitcherTip: value.profileSwitcherTip === true,
      };
    }
    return store;
  } catch {
    return {};
  }
}

function readStore(): PageIntroSeenStore {
  if (typeof window === "undefined") return {};
  return parsePageIntroSeenStore(
    window.localStorage.getItem(PAGE_INTRO_SEEN_BY_ACCOUNT_KEY),
  );
}

function writeStore(store: PageIntroSeenStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PAGE_INTRO_SEEN_BY_ACCOUNT_KEY,
    JSON.stringify(store),
  );
}

/**
 * One intro bucket shared by every guest pick on this device. Each guest pick
 * gets a fresh genericProfileId, so keying guests by that id made every intro
 * show again after picking a track. Registered accounts stay keyed by Auth uid.
 */
export const GUEST_DEVICE_INTRO_ACCOUNT_KEY = "guest:device";

export function isGuestIntroAccountKey(accountKey: string): boolean {
  return accountKey === "guest" || accountKey.startsWith("guest:");
}

function introStoreKey(accountKey: string): string {
  return isGuestIntroAccountKey(accountKey)
    ? GUEST_DEVICE_INTRO_ACCOUNT_KEY
    : accountKey;
}

function seenForAccount(
  store: PageIntroSeenStore,
  accountKey: string,
): AccountPageIntroSeen {
  const bucket = store[introStoreKey(accountKey)] ?? {};
  if (
    !isGuestIntroAccountKey(accountKey) ||
    accountKey === GUEST_DEVICE_INTRO_ACCOUNT_KEY
  ) {
    return bucket;
  }
  // Older builds wrote guest:<id>; keep honoring those dismissals.
  return mergePageIntroFlags(bucket, store[accountKey] ?? null) ?? {};
}

function readAccountSeen(): AccountPageIntroSeen {
  const accountKey = currentAccountLocalKey();
  if (!accountKey) return {};
  return seenForAccount(readStore(), accountKey);
}

/** Guest dismissals on this device, so a guest who signs up keeps them. */
export function readGuestDevicePageIntroFlags():
  AccountPageIntroSeen | undefined {
  const store = readStore();
  let merged: AccountPageIntroSeen | undefined;
  for (const [key, flags] of Object.entries(store)) {
    if (!isGuestIntroAccountKey(key)) continue;
    merged = mergePageIntroFlags(merged ?? {}, flags);
  }
  return merged;
}

/** Compact seen flags for the signed-in or guest account on this device. */
export function readCurrentPageIntroFlags(): AccountPageIntroSeen | undefined {
  return mergePageIntroFlags(readAccountSeen(), null);
}

function patchAccountSeen(patch: AccountPageIntroSeen): void {
  const accountKey = currentAccountLocalKey();
  if (!accountKey) return;
  const store = readStore();
  const current = seenForAccount(store, accountKey);
  const merged = mergePageIntroFlags(current, patch);
  store[introStoreKey(accountKey)] = {
    hubs: merged?.hubs ?? {},
    vaultAddMoney: merged?.vaultAddMoney === true,
    skillsCup: merged?.skillsCup === true,
    medals: merged?.medals === true,
    profileSwitcherTip: merged?.profileSwitcherTip === true,
  };
  writeStore(store);
  markAccountProgressDirty();
}

/** Union cloud seen-intro flags into this account. Never clears a local dismissal. */
export function mergeRemotePageIntroFlags(
  flags: AccountPageIntroSeen | null | undefined,
): void {
  if (!flags) return;
  patchAccountSeen(flags);
}

export function hasAccountSeenHubIntro(hubId: HubIntroId): boolean {
  return readAccountSeen().hubs?.[hubId] === true;
}

export function markAccountHubIntroSeen(hubId: HubIntroId): void {
  patchAccountSeen({ hubs: { [hubId]: true } });
}

export function hasAccountSeenVaultAddMoneyIntro(): boolean {
  return readAccountSeen().vaultAddMoney === true;
}

export function markAccountVaultAddMoneyIntroSeen(): void {
  patchAccountSeen({ vaultAddMoney: true });
}

export function hasAccountSeenSkillsCupIntro(): boolean {
  return readAccountSeen().skillsCup === true;
}

export function markAccountSkillsCupIntroSeen(): void {
  patchAccountSeen({ skillsCup: true });
}

export function hasAccountSeenMedalsIntro(): boolean {
  return readAccountSeen().medals === true;
}

export function markAccountMedalsIntroSeen(): void {
  patchAccountSeen({ medals: true });
}

export function hasAccountSeenProfileSwitcherTip(): boolean {
  return readAccountSeen().profileSwitcherTip === true;
}

export function markAccountProfileSwitcherTipSeen(): void {
  patchAccountSeen({ profileSwitcherTip: true });
}
