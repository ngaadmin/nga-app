let unlocked = false;

export function isStoryAudioUnlocked(): boolean {
  return unlocked;
}

export function unlockStoryAudio(): void {
  unlocked = true;
}

/** Test helper. Playback unlock is process-wide in the browser tab. */
export function resetStoryAudioUnlockForTests(): void {
  unlocked = false;
}
