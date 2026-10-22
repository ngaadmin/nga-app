import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bindLessonAbandon,
  lessonAbandonedBody,
  markLessonAttemptCompleted,
} from "@/lib/usage/lesson-abandon";

type Listener = (event: Event) => void;

function emitter() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    visibilityState: "visible" as DocumentVisibilityState,
    addEventListener(type: string, fn: EventListener) {
      const set = listeners.get(type) ?? new Set<Listener>();
      set.add(fn as Listener);
      listeners.set(type, set);
    },
    removeEventListener(type: string, fn: EventListener) {
      listeners.get(type)?.delete(fn as Listener);
    },
    dispatchEvent(event: Event) {
      for (const fn of listeners.get(event.type) ?? []) fn(event);
      return true;
    },
  };
}

describe("lesson_abandoned", () => {
  const beacons: Blob[] = [];

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    beacons.length = 0;
  });

  it("posts only the event type and lesson number", () => {
    expect(JSON.parse(lessonAbandonedBody(3))).toEqual({
      eventType: "lesson_abandoned",
      lessonNumber: 3,
    });
  });

  it("fires once on leave, and not after the lesson is completed", async () => {
    vi.useFakeTimers();
    const documentEmitter = emitter();
    const windowEmitter = emitter();
    vi.stubGlobal("document", documentEmitter);
    vi.stubGlobal("window", windowEmitter);
    vi.stubGlobal("navigator", {
      sendBeacon: (_url: string, data: Blob) => {
        beacons.push(data);
        return true;
      },
    });

    const stop = bindLessonAbandon(4);
    stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(beacons).toHaveLength(0);

    const leave = bindLessonAbandon(4);
    await vi.advanceTimersByTimeAsync(0);
    documentEmitter.visibilityState = "hidden";
    documentEmitter.dispatchEvent(new Event("visibilitychange"));
    leave();
    expect(beacons).toHaveLength(1);
    expect(JSON.parse(await beacons[0]!.text())).toEqual({
      eventType: "lesson_abandoned",
      lessonNumber: 4,
    });

    const finished = bindLessonAbandon(4);
    await vi.advanceTimersByTimeAsync(0);
    markLessonAttemptCompleted(4);
    finished();
    expect(beacons).toHaveLength(1);
  });
});
