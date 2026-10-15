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
export const PAGE_INTRO_SEEN_BY_ACCOUNT_KEY = "nga_page_intro_seen_by_account_v1";

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

export function parsePageIntroSeenStore(raw: string | null): PageIntroSeenStore {
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

function readAccountSeen(): AccountPageIntroSeen {
  const accountKey = currentAccountLocalKey();
  if (!accountKey) return {};
  return readStore()[accountKey] ?? {};
}

/** Compact seen flags for the signed-in or guest account on this device. */
export function readCurrentPageIntroFlags(): AccountPageIntroSeen | undefined {
  return mergePageIntroFlags(readAccountSeen(), null);
}

function patchAccountSeen(patch: AccountPageIntroSeen): void {
  const accountKey = currentAccountLocalKey();
  if (!accountKey) return;
  const store = readStore();
  const current = store[accountKey] ?? {};
  const merged = mergePageIntroFlags(current, patch);
  store[accountKey] = {
    hubs: merged?.hubs ?? {},
    vaultAddMoney: merged?.vaultAddMoney === true,
    skillsCup: merged?.skillsCup === true,
    medals: merged?.medals === true,
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
