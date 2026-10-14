import { afterEach, describe, expect, it, vi } from "vitest";
import {
  celebrateLessonCorrectAnswer,
  signalLessonIncorrectAnswer,
  triggerLessonErrorVibration,
} from "@/lib/academy/lessons/utils";

type StartedNote = { frequency: number; type: string };

function installAudio() {
  const started: StartedNote[] = [];

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
    AudioContext: function AudioContext(this: {
      currentTime: number;
      destination: object;
      createOscillator: () => FakeOscillator;
      createGain: () => FakeGain;
    }) {
      this.currentTime = 0;
      this.destination = {};
      this.createOscillator = () => new FakeOscillator();
      this.createGain = () => new FakeGain();
    },
  });

  return started;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lesson answer feedback", () => {
  it("plays a high ping when the answer is correct", () => {
    const started = installAudio();
    const flash = vi.fn();

    celebrateLessonCorrectAnswer(flash);

    expect(started).toEqual([{ frequency: 880, type: "sine" }]);
    expect(flash).toHaveBeenCalledWith("success");
  });

  it("plays a short buzzer and vibrates when the answer is wrong", () => {
    const started = installAudio();
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    const flash = vi.fn();

    signalLessonIncorrectAnswer(flash);

    expect(started).toEqual([
      { frequency: 180, type: "square" },
      { frequency: 110, type: "square" },
    ]);
    expect(vibrate).toHaveBeenCalledWith([60, 40, 60]);
    expect(flash).toHaveBeenCalledWith("error");
  });

  it("skips sound when the caller turns it off", () => {
    const started = installAudio();
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });

    celebrateLessonCorrectAnswer(undefined, { sound: false, flash: false });
    signalLessonIncorrectAnswer(undefined, {
      sound: false,
      vibrate: false,
      flash: false,
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
