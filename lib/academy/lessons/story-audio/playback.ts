import { readMasterMuted, writeMasterMuted } from "@/lib/academy/lessons/story-audio/master-mute";
import { silenceLessonFeedback } from "@/lib/academy/lessons/utils";

/** Next stays inactive for this long after a story beat appears. */
export const STORY_BEAT_NEXT_LOCK_MS = 2000;

/**
 * Short silent wav. A gesture can play it to unlock the shared element
 * before the beat clip is known.
 */
const SILENT_CLIP_SRC =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

export function storyBeatNextEnabled(input: {
  isStoryBeat: boolean;
  screenReady: boolean;
  elapsedMs: number;
  lockMs?: number;
}): boolean {
  if (!input.screenReady) return false;
  if (!input.isStoryBeat) return true;
  return input.elapsedMs >= (input.lockMs ?? STORY_BEAT_NEXT_LOCK_MS);
}

export function isStoryBeatScreen(
  screen: { type?: string; audio?: { src?: string } } | undefined,
): boolean {
  return screen?.type === "narrative-bonus" && Boolean(screen.audio?.src);
}

export type StoryAudioSink = {
  src: string;
  muted: boolean;
  currentTime: number;
  play: () => Promise<void> | void;
  pause: () => void;
};

function sameClip(current: string, next: string): boolean {
  if (!current || !next) return false;
  if (current === next) return true;
  return current.endsWith(next);
}

/**
 * One narration element. A gesture starts playback immediately.
 * A later beat can play on that same element once a gesture has succeeded.
 */
export function createStoryPlayback(sink: StoryAudioSink) {
  let unlocked = false;
  let blocked = false;
  let activeSrc = "";
  let playGeneration = 0;
  /** A stop or mute owns the element. An older play() must not pause a newer one. */
  let releaseStalePlay = false;

  const silence = (src: string) => {
    playGeneration += 1;
    releaseStalePlay = true;
    activeSrc = src;
    sink.muted = true;
    sink.pause();
    sink.currentTime = 0;
    return Promise.resolve(false);
  };

  const beginPlay = (src: string, muted: boolean, restart: boolean) => {
    const generation = ++playGeneration;
    releaseStalePlay = false;
    const switching = !sameClip(sink.src, src);
    const audible = Boolean(sink.src) && !sink.src.startsWith("data:");
    if ((switching || restart) && audible) {
      sink.pause();
      sink.currentTime = 0;
    }
    if (switching || restart) {
      sink.src = src;
      sink.currentTime = 0;
    }
    sink.muted = muted;
    activeSrc = src;
    let pending: Promise<void> | void;
    try {
      pending = sink.play();
    } catch {
      blocked = true;
      unlocked = false;
      return Promise.resolve(false);
    }
    unlocked = true;
    blocked = false;
    return Promise.resolve(pending).then(
      () => {
        if (generation !== playGeneration) {
          if (releaseStalePlay) sink.pause();
          return false;
        }
        return true;
      },
      () => {
        if (generation !== playGeneration) return false;
        unlocked = false;
        blocked = true;
        return false;
      },
    );
  };

  const stop = () => {
    playGeneration += 1;
    releaseStalePlay = true;
    activeSrc = "";
    blocked = false;
    sink.pause();
    sink.currentTime = 0;
    sink.src = "";
  };

  return {
    isUnlocked: () => unlocked,
    isBlocked: () => blocked,
    activeSrc: () => activeSrc,
    primeFromGesture(): Promise<boolean> {
      const generation = ++playGeneration;
      const hadClip = Boolean(sink.src) && !sink.src.startsWith("data:");
      if (!hadClip) sink.src = SILENT_CLIP_SRC;
      let pending: Promise<void> | void;
      try {
        pending = sink.play();
      } catch {
        blocked = true;
        unlocked = false;
        return Promise.resolve(false);
      }
      unlocked = true;
      blocked = false;
      return Promise.resolve(pending).then(
        () => {
          if (generation !== playGeneration) return true;
          if (!hadClip) {
            sink.pause();
            sink.currentTime = 0;
          }
          return true;
        },
        () => {
          if (generation !== playGeneration) return false;
          unlocked = false;
          blocked = true;
          return false;
        },
      );
    },
    playFromGesture(src: string, muted: boolean): Promise<boolean> {
      if (muted) return silence(src);
      return beginPlay(src, false, true);
    },
    playOnScreen(src: string | undefined, muted: boolean): Promise<boolean> {
      if (!src) {
        stop();
        return Promise.resolve(false);
      }
      if (muted) return silence(src);
      activeSrc = src;
      if (!unlocked) {
        blocked = true;
        return Promise.resolve(false);
      }
      return beginPlay(src, false, false);
    },
    resumeBlocked(muted: boolean): Promise<boolean> {
      if (!blocked || !activeSrc) return Promise.resolve(false);
      if (muted) return silence(activeSrc);
      return beginPlay(activeSrc, false, false);
    },
    /** Pause the clip in place. Unmute must not resume it. */
    holdMute() {
      playGeneration += 1;
      releaseStalePlay = true;
      sink.muted = true;
      sink.pause();
    },
    /** Open the element again without starting playback. */
    releaseMute() {
      sink.muted = false;
    },
    stop,
  };
}

type StoryPlayback = ReturnType<typeof createStoryPlayback>;

let element: HTMLAudioElement | null = null;
let playback: StoryPlayback | null = null;
let fallbackInstalled = false;
let lifecycleInstalled = false;

/** One listener set for the shared element. Leaving the page cannot miss it. */
function installStoryAudioLifecycle(): void {
  if (lifecycleInstalled || typeof window === "undefined") return;
  lifecycleInstalled = true;
  window.addEventListener("pagehide", stopStoryAudio);
  window.addEventListener("popstate", stopStoryAudio);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") stopStoryAudio();
  });
}

export function storyAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  if (!element) {
    element = new Audio();
    element.preload = "auto";
    installStoryAudioLifecycle();
  }
  return element;
}

function session(): StoryPlayback | null {
  const audio = storyAudioElement();
  if (!audio) return null;
  if (!playback) {
    const sink: StoryAudioSink = {
      get src() {
        return audio.src;
      },
      set src(value: string) {
        if (!value) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
          return;
        }
        if (audio.src !== value && !audio.src.endsWith(value)) audio.src = value;
      },
      get muted() {
        return audio.muted;
      },
      set muted(value: boolean) {
        audio.muted = value;
      },
      get currentTime() {
        return audio.currentTime;
      },
      set currentTime(value: number) {
        try {
          audio.currentTime = value;
        } catch {
          // A released element rejects seeks. Stop still clears the clip.
        }
      },
      play: () => audio.play().then(() => undefined),
      pause: () => audio.pause(),
    };
    playback = createStoryPlayback(sink);
  }
  return playback;
}

/** Call inside the tap that opens a lesson, before the runner mounts. */
export function primeStoryAudioFromGesture(): void {
  void session()?.primeFromGesture();
}

/** Call inside the tap that advances onto a beat. Starts that clip now. */
export function playStoryClipFromGesture(src: string): void {
  const active = session();
  if (!active) return;
  void active.playFromGesture(src, readMasterMuted());
}

/**
 * Master switch. Muting pauses narration and answer sounds immediately.
 * Opening the switch does not start playback again.
 */
export function applyMasterMute(muted: boolean): void {
  writeMasterMuted(muted);
  const active = session();
  if (muted) {
    active?.holdMute();
    silenceLessonFeedback();
    return;
  }
  active?.releaseMute();
}

/** Pause, rewind, and drop the shared clip. Safe to call when no lesson is open. */
export function stopStoryAudio(): void {
  playback?.stop();
}

/** Start the clip for the beat that just appeared, after a gesture has unlocked sound. */
export function playStoryClipOnScreen(src: string | undefined): Promise<boolean> {
  const active = session();
  if (!active) return Promise.resolve(false);
  return active.playOnScreen(src, readMasterMuted());
}

export function isStoryAudioUnlocked(): boolean {
  return session()?.isUnlocked() ?? false;
}

/** Hard refresh onto a beat: the first tap or key starts the clip that was blocked. */
export function installStoryAudioFallback(): () => void {
  if (typeof document === "undefined") return () => {};
  const onGesture = () => {
    const active = session();
    if (!active) return;
    if (active.isBlocked()) {
      void active.resumeBlocked(readMasterMuted());
      return;
    }
    if (!active.isUnlocked()) {
      void active.primeFromGesture();
    }
  };
  if (fallbackInstalled) return () => {};
  fallbackInstalled = true;
  document.addEventListener("pointerdown", onGesture, true);
  document.addEventListener("keydown", onGesture, true);
  return () => {
    document.removeEventListener("pointerdown", onGesture, true);
    document.removeEventListener("keydown", onGesture, true);
    fallbackInstalled = false;
  };
}

export function resetStoryPlaybackForTests(): void {
  playback = null;
  element = null;
  fallbackInstalled = false;
}
