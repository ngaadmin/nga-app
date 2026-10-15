// TODO: remove after recordings
import {
  readUserSession,
  saveUserSession,
} from "@/lib/onboarding/guest-session";

/** Tab flag for ?recording=1. Survives logout so a recording tab stays suppressed. */
export const RECORDING_SUPPRESS_INTRO_FLAG_KEY = "nga_recording_suppress_intro";

export function readRecordingSuppressIntroFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(RECORDING_SUPPRESS_INTRO_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function writeRecordingSuppressIntroFlag(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RECORDING_SUPPRESS_INTRO_FLAG_KEY, "1");
  } catch {
    // Session storage can throw in locked-down browsers. Intros stay visible.
  }
}

/** Sets the tab flag and stamps the open session when one exists. */
export function enableRecordingSuppressIntroFlag(): void {
  writeRecordingSuppressIntroFlag();
  const session = readUserSession();
  if (session && session.recordingSuppressIntro !== true) {
    saveUserSession({ ...session, recordingSuppressIntro: true });
  }
}

/** `?recording=1` enables the flag. Any other value leaves it unchanged. */
export function captureRecordingSuppressIntroQuery(search: string): boolean {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const recording = new URLSearchParams(query).get("recording");
  if (recording === "1") {
    enableRecordingSuppressIntroFlag();
    return true;
  }
  return readRecordingSuppressIntroFlag();
}
