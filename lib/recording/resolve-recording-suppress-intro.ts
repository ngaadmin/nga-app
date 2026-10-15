// TODO: remove after recordings
import {
  readUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import { recordingIdentitySuppressesIntros } from "@/lib/recording/suppress-intro-action";
import {
  captureRecordingSuppressIntroQuery,
  enableRecordingSuppressIntroFlag,
  readRecordingSuppressIntroFlag,
  RECORDING_SUPPRESS_INTRO_FLAG_KEY,
} from "@/lib/recording/suppress-intro-flag";

const DECISION_CACHE_KEY = "nga_recording_suppress_intro_decision";

const memoryDecision = new Map<string, boolean>();
const inflight = new Map<string, Promise<boolean>>();

export function resetRecordingSuppressDecisionCache(): void {
  memoryDecision.clear();
  inflight.clear();
}

export function recordingIntroIdentityCandidates(
  session: UserSession | null,
): string[] {
  if (!session) return [];
  const seen = new Set<string>();
  const identities: string[] = [];
  for (const value of [
    session.username,
    session.learnerEmail,
    session.email,
    session.parentEmail,
  ]) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    identities.push(trimmed);
  }
  return identities;
}

function identityCacheKey(identities: readonly string[]): string {
  return identities
    .map((identity) => identity.trim().toLowerCase())
    .filter((identity) => identity.length > 0)
    .sort()
    .join("\n");
}

function readDecisionCache(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(DECISION_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

function readCachedDecision(key: string): boolean | null {
  if (memoryDecision.has(key)) return memoryDecision.get(key) ?? null;
  const stored = readDecisionCache()[key];
  if (typeof stored !== "boolean") return null;
  memoryDecision.set(key, stored);
  return stored;
}

function writeCachedDecision(key: string, suppress: boolean): void {
  memoryDecision.set(key, suppress);
  if (typeof window === "undefined") return;
  try {
    const cache = readDecisionCache();
    cache[key] = suppress;
    window.sessionStorage.setItem(DECISION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // The in-memory result still covers this page.
  }
}

function rememberSessionFlag(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RECORDING_SUPPRESS_INTRO_FLAG_KEY, "1");
  } catch {
    // Intros still close for this resolution via the session field.
  }
}

/**
 * True when this tab passed ?recording=1 or the signed-in user is on the
 * recording allow-list. A failed lookup leaves intros visible.
 */
export async function resolveRecordingSuppressIntro(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  captureRecordingSuppressIntroQuery(window.location.search);
  if (readRecordingSuppressIntroFlag()) {
    const session = readUserSession();
    if (session && session.recordingSuppressIntro !== true) {
      enableRecordingSuppressIntroFlag();
    }
    return true;
  }

  const session = readUserSession();
  if (session?.recordingSuppressIntro === true) {
    rememberSessionFlag();
    return true;
  }

  const identities = recordingIntroIdentityCandidates(session);
  if (identities.length === 0) return false;

  const key = identityCacheKey(identities);
  const cached = readCachedDecision(key);
  if (cached !== null) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = recordingIdentitySuppressesIntros(identities)
    .then((suppress) => {
      const decision = suppress === true;
      writeCachedDecision(key, decision);
      return decision;
    })
    .catch(() => false)
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}
