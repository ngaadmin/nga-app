import { readPersisted, writePersisted } from "@/lib/dev/client-persist";
import {
  HUB_INTRO_IDS,
  type HubIntroId,
  type HubIntroSeenMap,
} from "@/lib/dashboard/hub-intro/types";

export const HUB_INTRO_SEEN_STORAGE_KEY = "nga_hub_intro_seen_v2";

export function parseHubIntroSeenMap(raw: string | null): HubIntroSeenMap {
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const record = parsed as Record<string, unknown>;
    const next: HubIntroSeenMap = {};
    for (const id of HUB_INTRO_IDS) {
      if (record[id] === true) next[id] = true;
    }
    return next;
  } catch {
    return {};
  }
}

export function hasSeenHubIntro(hubId: HubIntroId): boolean {
  if (typeof window === "undefined") return false;
  return parseHubIntroSeenMap(readPersisted(HUB_INTRO_SEEN_STORAGE_KEY))[hubId] === true;
}

export function markHubIntroSeen(hubId: HubIntroId): void {
  if (typeof window === "undefined") return;
  const current = parseHubIntroSeenMap(readPersisted(HUB_INTRO_SEEN_STORAGE_KEY));
  writePersisted(
    HUB_INTRO_SEEN_STORAGE_KEY,
    JSON.stringify({ ...current, [hubId]: true }),
  );
}
