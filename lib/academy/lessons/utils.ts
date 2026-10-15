const WRONG_VIBRATION_PATTERN = [60, 40, 60];

/**
 * Lesson feedback audio stays on. The app has no sound or mute preference
 * to read. Callers can still pass `sound: false` to skip a single cue.
 */
function lessonFeedbackSoundEnabled(): boolean {
  return true;
}

function playOscillators(
  notes: readonly {
    frequency: number;
    type: OscillatorType;
    start: number;
    duration: number;
    gain: number;
  }[],
): void {
  if (typeof window === "undefined" || !lessonFeedbackSoundEnabled()) return;
  try {
    const ctx = new window.AudioContext();
    void ctx.resume?.();
    const now = ctx.currentTime;
    for (const note of notes) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = note.type;
      oscillator.frequency.value = note.frequency;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      const startAt = now + note.start;
      gain.gain.setValueAtTime(note.gain, startAt);
      gain.gain.exponentialRampToValueAtTime(0.01, startAt + note.duration);
      oscillator.start(startAt);
      oscillator.stop(startAt + note.duration);
    }
  } catch {
    /* Audio optional in sandboxed contexts */
  }
}

export function playLessonSuccessPing(): void {
  playOscillators([
    { frequency: 880, type: "sine", start: 0, duration: 0.18, gain: 0.12 },
  ]);
}

/** Soft click when a learner selects a tile. About 40ms. */
export function playLessonSelectTap(): void {
  playOscillators([
    { frequency: 640, type: "sine", start: 0, duration: 0.04, gain: 0.05 },
  ]);
}

/** Short two-blip buzz, distinct from the correct-answer ping. */
export function playLessonWrongBuzzer(): void {
  playOscillators([
    { frequency: 180, type: "square", start: 0, duration: 0.08, gain: 0.06 },
    { frequency: 110, type: "square", start: 0.1, duration: 0.1, gain: 0.06 },
  ]);
}

export type LessonFlashTone = "success" | "error";

type LessonCorrectFeedbackOptions = {
  /** Screen-wide green flash (default true). */
  flash?: boolean;
  /** Success ping (default true). */
  sound?: boolean;
};

/** Shared sound + screen flash when a learner answers correctly. */
export function celebrateLessonCorrectAnswer(
  flashScreen?: (tone: LessonFlashTone) => void,
  options?: LessonCorrectFeedbackOptions,
): void {
  if (options?.sound !== false) {
    playLessonSuccessPing();
  }
  if (options?.flash !== false) {
    flashScreen?.("success");
  }
}

export function triggerLessonErrorVibration(): void {
  if (typeof navigator === "undefined") return;
  const vibrate = navigator.vibrate;
  if (typeof vibrate !== "function") return;
  try {
    vibrate.call(navigator, WRONG_VIBRATION_PATTERN);
  } catch {
    /* iOS Safari can expose vibrate and still refuse to buzz. */
  }
}

type LessonIncorrectFeedbackOptions = {
  /** Screen-wide red flash (default true). */
  flash?: boolean;
  /** Haptic buzz (default true). */
  vibrate?: boolean;
  /** Wrong-answer buzzer (default true). */
  sound?: boolean;
};

/** Shared buzzer, vibration, and screen flash when a learner is wrong. */
export function signalLessonIncorrectAnswer(
  flashScreen?: (tone: LessonFlashTone) => void,
  options?: LessonIncorrectFeedbackOptions,
): void {
  if (options?.sound !== false) {
    playLessonWrongBuzzer();
  }
  if (options?.vibrate !== false) {
    triggerLessonErrorVibration();
  }
  if (options?.flash !== false) {
    flashScreen?.("error");
  }
}
