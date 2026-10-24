/** One preference for every sound in a lesson. */
export const MASTER_MUTED_KEY = "nga_master_muted";

/** Previous per-beat voiceover preference. Read once, then removed. */
const LEGACY_STORY_MUTED_KEY = "nga_story_audio_muted";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Whether the learner has silenced the app.
 * A stored voiceover mute is copied onto the master switch once, then the old key is deleted.
 */
export function readMasterMuted(): boolean {
  const bin = storage();
  if (!bin) return false;
  try {
    const current = bin.getItem(MASTER_MUTED_KEY);
    if (current === "1" || current === "0") {
      bin.removeItem(LEGACY_STORY_MUTED_KEY);
      return current === "1";
    }
    const legacy = bin.getItem(LEGACY_STORY_MUTED_KEY);
    bin.removeItem(LEGACY_STORY_MUTED_KEY);
    if (legacy === "1") {
      bin.setItem(MASTER_MUTED_KEY, "1");
      return true;
    }
    if (legacy === "0") bin.setItem(MASTER_MUTED_KEY, "0");
    return false;
  } catch {
    return false;
  }
}

export function writeMasterMuted(muted: boolean): void {
  const bin = storage();
  if (!bin) return;
  try {
    bin.setItem(MASTER_MUTED_KEY, muted ? "1" : "0");
    bin.removeItem(LEGACY_STORY_MUTED_KEY);
  } catch {
    // A private window can refuse storage. The switch still works for this visit.
  }
}
