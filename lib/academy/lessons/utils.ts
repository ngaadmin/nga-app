import { readMasterMuted } from "@/lib/academy/lessons/story-audio/master-mute";

const WRONG_VIBRATION_PATTERN = [60, 40, 60];

const liveContexts = new Set<AudioContext>();
const liveStops: ReturnType<typeof setTimeout>[] = [];

/** Answer sounds follow the master mute. Callers can still pass `sound: false` for one cue. */
function lessonFeedbackSoundEnabled(): boolean {
  return !readMasterMuted();
}

/** Stop every answer sound that is still ringing. */
export function silenceLessonFeedback(): void {
  for (const timer of liveStops) clearTimeout(timer);
  liveStops.length = 0;
  for (const ctx of liveContexts) {
    try {
      void ctx.close();
    } catch {
      /* A closed or fake context can refuse. */
    }
  }
  liveContexts.clear();
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
    liveContexts.add(ctx);
    void ctx.resume?.();
    const now = ctx.currentTime;
    let endAt = 0;
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
      endAt = Math.max(endAt, note.start + note.duration);
    }
    const timer = setTimeout(() => {
      liveContexts.delete(ctx);
      try {
        void ctx.close();
      } catch {
        /* Already closed by the master switch. */
      }
    }, endAt * 1000 + 40);
    liveStops.push(timer);
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

type LessonCorrectFeedbackOptions = {
  /** Success ping (default true). */
  sound?: boolean;
};

/** Ping when a learner answers correctly. */
export function celebrateLessonCorrectAnswer(
  options?: LessonCorrectFeedbackOptions,
): void {
  if (options?.sound !== false) {
    playLessonSuccessPing();
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
  /** Haptic buzz (default true). */
  vibrate?: boolean;
  /** Wrong-answer buzzer (default true). */
  sound?: boolean;
};

/** Soft buzzer and vibration when a learner is wrong. */
export function signalLessonIncorrectAnswer(
  options?: LessonIncorrectFeedbackOptions,
): void {
  if (options?.sound !== false) {
    playLessonWrongBuzzer();
  }
  if (options?.vibrate !== false) {
    triggerLessonErrorVibration();
  }
}
