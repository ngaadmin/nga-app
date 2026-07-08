import { isEligibleBirthYear } from "@/lib/onboarding/birth-years";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const GHOST_SESSION_STORAGE_KEY = "nga_ghost_session";

export const ONBOARDING_START_PATH = "/onboarding/start" as const;
export const DASHBOARD_ACADEMY_PATH = "/dashboard/academy" as const;

export type GhostAccessMode = "ghost";

/** Explorers 10–13 · Titans 14+ (used later for retrospective gates). */
export type ComplianceTier = "explorer" | "titan";

export type GhostProfileInput = {
  username: string;
  birthYear: number;
};

export type GhostAccessSession = {
  accessMode: GhostAccessMode;
  username: string;
  birthYear: number;
  complianceTier: ComplianceTier;
  createdAt: string;
};

export function getComplianceTier(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): ComplianceTier {
  const age = referenceYear - birthYear;
  return age < 14 ? "explorer" : "titan";
}

export function createGhostAccessSession(
  input: GhostProfileInput,
): GhostAccessSession {
  const username = input.username.trim();
  const birthYear = input.birthYear;

  if (!username) {
    throw new Error("Username is required for ghost access.");
  }
  if (!isEligibleBirthYear(birthYear)) {
    throw new Error("Birth year is outside the eligible range.");
  }

  return {
    accessMode: "ghost",
    username,
    birthYear,
    complianceTier: getComplianceTier(birthYear),
    createdAt: new Date().toISOString(),
  };
}

export function saveGhostAccessSession(session: GhostAccessSession): void {
  if (typeof window === "undefined") return;
  writePersisted(GHOST_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function readGhostAccessSession(): GhostAccessSession | null {
  if (typeof window === "undefined") return null;

  const raw = readPersisted(GHOST_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as GhostAccessSession;
    if (
      parsed?.accessMode !== "ghost" ||
      typeof parsed.username !== "string" ||
      !isEligibleBirthYear(parsed.birthYear)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearGhostAccessSession(): void {
  if (typeof window === "undefined") return;
  removePersisted(GHOST_SESSION_STORAGE_KEY);
}
