import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

/**
 * Profile avatar picker. Uses character art that already ships in the app
 * and keeps the choice on this device only (localStorage). No database column.
 */

export type ProfileAvatarId =
  | "lars"
  | "holly"
  | "senna-older"
  | "senna"
  | "immi"
  | "dash";

export type ProfileAvatarOption = {
  id: ProfileAvatarId;
  name: string;
  src: string;
  /** Source image size in px. */
  width: number;
  height: number;
  /** Square head crop inside the source image, in px. */
  cropX: number;
  cropY: number;
  cropSize: number;
};

const CHARACTER_DIR = "/assets/illustrations/characters";

export const PROFILE_AVATAR_OPTIONS: readonly ProfileAvatarOption[] = [
  {
    id: "lars",
    name: "Lars",
    src: `${CHARACTER_DIR}/lars/lars-waving-512.webp`,
    width: 191,
    height: 391,
    cropX: 43,
    cropY: 9,
    cropSize: 117,
  },
  {
    id: "holly",
    name: "Holly",
    src: `${CHARACTER_DIR}/holly/holly-waving-512.webp`,
    width: 199,
    height: 391,
    cropX: 40,
    cropY: 9,
    cropSize: 117,
  },
  {
    id: "senna-older",
    name: "Senna Older",
    src: `${CHARACTER_DIR}/senna-older/senna-older-waving-512.webp`,
    width: 189,
    height: 394,
    cropX: 43,
    cropY: 9,
    cropSize: 118,
  },
  {
    id: "senna",
    name: "Senna",
    src: `${CHARACTER_DIR}/senna/senna-waving-512.webp`,
    width: 188,
    height: 394,
    cropX: 40,
    cropY: 9,
    cropSize: 118,
  },
  {
    id: "immi",
    name: "Immi",
    src: `${CHARACTER_DIR}/immi/immi-waving-512.webp`,
    width: 204,
    height: 391,
    cropX: 46,
    cropY: 9,
    cropSize: 117,
  },
  {
    id: "dash",
    name: "Dash",
    src: `${CHARACTER_DIR}/dash/dash-waving-512.webp`,
    width: 186,
    height: 391,
    cropX: 30,
    cropY: 9,
    cropSize: 117,
  },
];

/** Track art defaults. Maverick uses Senna Older (Aiden is retired). */
export const DEFAULT_PROFILE_AVATAR_BY_COHORT: Record<
  MasteryCohort,
  ProfileAvatarId
> = {
  explorer: "lars",
  pathfinder: "holly",
  maverick: "senna-older",
};

export const PROFILE_AVATAR_STORAGE_KEY = "nga_profile_avatar_v1";
export const PROFILE_AVATAR_CHANGED_EVENT = "nga:profile-avatar-changed";

export function isProfileAvatarId(value: unknown): value is ProfileAvatarId {
  return PROFILE_AVATAR_OPTIONS.some((option) => option.id === value);
}

export function profileAvatarOption(id: ProfileAvatarId): ProfileAvatarOption {
  const option = PROFILE_AVATAR_OPTIONS.find((entry) => entry.id === id);
  if (!option) throw new Error(`Unknown profile avatar: ${id}`);
  return option;
}

type StoredChoices = Record<string, ProfileAvatarId>;

function parseStoredChoices(raw: string | null): StoredChoices {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: StoredChoices = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isProfileAvatarId(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

/** Saved choice for this profile, or the track default. */
export function resolveProfileAvatarId(
  raw: string | null,
  profileKey: string,
  cohort: MasteryCohort,
): ProfileAvatarId {
  return (
    parseStoredChoices(raw)[profileKey] ??
    DEFAULT_PROFILE_AVATAR_BY_COHORT[cohort]
  );
}

/** Saved choice for this profile only, or null when none was picked. */
export function explicitProfileAvatarId(
  raw: string | null,
  profileKey: string,
): ProfileAvatarId | null {
  return parseStoredChoices(raw)[profileKey] ?? null;
}

/** Next stored JSON after picking an avatar for one profile on this device. */
export function nextStoredProfileAvatars(
  raw: string | null,
  profileKey: string,
  id: ProfileAvatarId,
): string {
  const choices = parseStoredChoices(raw);
  choices[profileKey] = id;
  return JSON.stringify(choices);
}

export function readStoredProfileAvatarId(
  profileKey: string,
  cohort: MasteryCohort,
): ProfileAvatarId {
  if (typeof window === "undefined") {
    return DEFAULT_PROFILE_AVATAR_BY_COHORT[cohort];
  }
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY);
  } catch {
    raw = null;
  }
  return resolveProfileAvatarId(raw, profileKey, cohort);
}

export function saveProfileAvatarId(
  profileKey: string,
  id: ProfileAvatarId,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY);
    window.localStorage.setItem(
      PROFILE_AVATAR_STORAGE_KEY,
      nextStoredProfileAvatars(raw, profileKey, id),
    );
  } catch {
    // Storage full or blocked: the picker still updates for this visit.
  }
  window.dispatchEvent(new Event(PROFILE_AVATAR_CHANGED_EVENT));
}
