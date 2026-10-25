import { afterEach, describe, expect, it, vi } from "vitest";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
  silenceLessonFeedback,
  triggerLessonErrorVibration,
} from "@/lib/academy/lessons/utils";

type StartedNote = { frequency: number; type: string };

function installAudio(muted = false) {
  const started: StartedNote[] = [];
  let closed = 0;
  const store = new Map<string, string>(muted ? [["nga_master_muted", "1"]] : []);

  class FakeOscillator {
    type = "sine";
    frequency = { value: 0 };
    connect() {}
    start() {
      started.push({ frequency: this.frequency.value, type: this.type });
    }
    stop() {}
  }

  class FakeGain {
    gain = {
      setValueAtTime() {},
      exponentialRampToValueAtTime() {},
    };
    connect() {}
  }

  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
    AudioContext: function AudioContext(this: {
      currentTime: number;
      destination: object;
      createOscillator: () => FakeOscillator;
      createGain: () => FakeGain;
      close: () => Promise<void>;
    }) {
      this.currentTime = 0;
      this.destination = {};
      this.createOscillator = () => new FakeOscillator();
      this.createGain = () => new FakeGain();
      this.close = () => {
        closed += 1;
        return Promise.resolve();
      };
    },
  });

  return { started, closed: () => closed };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lesson answer feedback", () => {
  it("plays a high ping when the answer is correct", () => {
    const { started } = installAudio();

    celebrateLessonCorrectAnswer();

    expect(started).toEqual([{ frequency: 880, type: "sine" }]);
  });

  it("plays a short buzzer and vibrates when the answer is wrong", () => {
    const { started } = installAudio();
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    signalLessonIncorrectAnswer();

    expect(started).toEqual([
      { frequency: 180, type: "square" },
      { frequency: 110, type: "square" },
    ]);
    expect(vibrate).toHaveBeenCalledWith([60, 40, 60]);
  });

  it("stays quiet while the master mute is on, and stops a note already ringing", () => {
    const { started, closed } = installAudio();
    celebrateLessonCorrectAnswer();
    expect(started).toEqual([{ frequency: 880, type: "sine" }]);
    silenceLessonFeedback();
    expect(closed()).toBe(1);

    const muted = installAudio(true);
    celebrateLessonCorrectAnswer();
    signalLessonIncorrectAnswer({ vibrate: false });
    expect(muted.started).toEqual([]);
  });

  it("skips sound when the caller turns it off", () => {
    const { started } = installAudio();
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });

    celebrateLessonCorrectAnswer({ sound: false });
    signalLessonIncorrectAnswer({
      sound: false,
      vibrate: false,
    });

    expect(started).toEqual([]);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("does nothing when vibration is missing or throws", () => {
    vi.stubGlobal("navigator", {});
    expect(() => triggerLessonErrorVibration()).not.toThrow();

    vi.stubGlobal("navigator", {
      vibrate() {
        throw new Error("unsupported");
      },
    });
    expect(() => triggerLessonErrorVibration()).not.toThrow();
  });
});
