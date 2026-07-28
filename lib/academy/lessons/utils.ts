export function playLessonSuccessPing(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new window.AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.18);
  } catch {
    /* Audio optional in sandboxed contexts */
  }
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
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(120);
  }
}

type LessonIncorrectFeedbackOptions = {
  /** Screen-wide red flash (default true). */
  flash?: boolean;
  /** Haptic buzz (default true). */
  vibrate?: boolean;
};

/** Shared vibration + screen flash when a learner picks a wrong answer. */
export function signalLessonIncorrectAnswer(
  flashScreen?: (tone: LessonFlashTone) => void,
  options?: LessonIncorrectFeedbackOptions,
): void {
  if (options?.vibrate !== false) {
    triggerLessonErrorVibration();
  }
  if (options?.flash !== false) {
    flashScreen?.("error");
  }
}
