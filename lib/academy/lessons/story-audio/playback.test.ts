import { describe, expect, it } from "vitest";
import {
  STORY_BEAT_NEXT_LOCK_MS,
  createStoryPlayback,
  storyBeatNextEnabled,
  type StoryAudioSink,
} from "@/lib/academy/lessons/story-audio/playback";

function fakeSink(play: () => Promise<void> | void = () => Promise.resolve()) {
  const calls: string[] = [];
  const sink: StoryAudioSink = {
    src: "",
    muted: false,
    currentTime: 0,
    play: () => {
      calls.push(`play:${sink.src}:muted=${sink.muted}`);
      return play();
    },
    pause: () => {
      calls.push("pause");
    },
  };
  return { sink, calls };
}

describe("story beat next lock", () => {
  it("keeps Next off for 2 seconds on a beat, then allows it", () => {
    expect(STORY_BEAT_NEXT_LOCK_MS).toBe(2000);
    expect(
      storyBeatNextEnabled({ isStoryBeat: true, screenReady: true, elapsedMs: 0 }),
    ).toBe(false);
    expect(
      storyBeatNextEnabled({ isStoryBeat: true, screenReady: true, elapsedMs: 1999 }),
    ).toBe(false);
    expect(
      storyBeatNextEnabled({ isStoryBeat: true, screenReady: true, elapsedMs: 2000 }),
    ).toBe(true);
  });

  it("does not lock screens that are not story beats", () => {
    expect(
      storyBeatNextEnabled({ isStoryBeat: false, screenReady: true, elapsedMs: 0 }),
    ).toBe(true);
    expect(
      storyBeatNextEnabled({ isStoryBeat: true, screenReady: false, elapsedMs: 2000 }),
    ).toBe(false);
  });
});

describe("story beat autoplay", () => {
  it("calls play for the clip opened by a gesture", async () => {
    const { sink, calls } = fakeSink();
    const playback = createStoryPlayback(sink);
    const started = await playback.playFromGesture("/academy-audio/explorer-m1/intro.mp3", false);
    expect(started).toBe(true);
    expect(calls).toEqual(["play:/academy-audio/explorer-m1/intro.mp3:muted=false"]);
    expect(playback.isUnlocked()).toBe(true);
  });

  it("autoplays each later beat after the lesson gesture and pauses the clip it replaces", async () => {
    const { sink, calls } = fakeSink();
    const playback = createStoryPlayback(sink);
    await playback.primeFromGesture();
    calls.length = 0;
    const intro = await playback.playOnScreen("/clips/intro.mp3", false);
    const second = await playback.playOnScreen("/clips/l2-beat2.mp3", false);
    const afterClose = await playback.playOnScreen("/clips/l6-beat3.mp3", false);
    const moduleEnd = await playback.playOnScreen("/clips/l9-beat1.mp3", false);
    expect(intro && second && afterClose && moduleEnd).toBe(true);
    expect(calls).toEqual([
      "play:/clips/intro.mp3:muted=false",
      "pause",
      "play:/clips/l2-beat2.mp3:muted=false",
      "pause",
      "play:/clips/l6-beat3.mp3:muted=false",
      "pause",
      "play:/clips/l9-beat1.mp3:muted=false",
    ]);
  });

  it("pauses a muted beat instead of autoplaying it, then restarts on unmute", async () => {
    const { sink, calls } = fakeSink();
    const playback = createStoryPlayback(sink);
    await playback.primeFromGesture();
    calls.length = 0;
    const intro = await playback.playOnScreen("/clips/intro.mp3", false);
    const held = await playback.playOnScreen("/clips/l2-beat2.mp3", true);
    const restarted = await playback.playFromGesture("/clips/l2-beat2.mp3", false);
    expect(intro).toBe(true);
    expect(held).toBe(false);
    expect(restarted).toBe(true);
    expect(sink.muted).toBe(false);
    expect(calls).toEqual([
      "play:/clips/intro.mp3:muted=false",
      "pause",
      "pause",
      "play:/clips/l2-beat2.mp3:muted=false",
    ]);
  });

  it("releases the clip when the lesson stops", async () => {
    const { sink, calls } = fakeSink();
    const playback = createStoryPlayback(sink);
    await playback.playFromGesture("/clips/intro.mp3", false);
    playback.stop();
    expect(sink.src).toBe("");
    expect(sink.currentTime).toBe(0);
    expect(calls.at(-1)).toBe("pause");
  });

  it("pauses a play that finishes after stop", async () => {
    let release = () => {};
    const { sink, calls } = fakeSink(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const playback = createStoryPlayback(sink);
    const started = playback.playFromGesture("/clips/intro.mp3", false);
    playback.stop();
    release();
    expect(await started).toBe(false);
    expect(sink.src).toBe("");
    expect(calls.filter((call) => call === "pause").length).toBeGreaterThan(0);
  });

  it("does not start a blocked clip while muted", async () => {
    const { sink, calls } = fakeSink();
    const playback = createStoryPlayback(sink);
    await playback.playOnScreen("/clips/intro.mp3", false);
    const resumed = await playback.resumeBlocked(true);
    expect(resumed).toBe(false);
    expect(sink.muted).toBe(true);
    expect(calls).toEqual(["pause"]);
  });

  it("does not call play until a gesture when the screen opens on its own", async () => {
    const { sink, calls } = fakeSink();
    const playback = createStoryPlayback(sink);
    const started = await playback.playOnScreen("/clips/intro.mp3", false);
    expect(started).toBe(false);
    expect(calls).toEqual([]);
    expect(playback.isBlocked()).toBe(true);
    const resumed = await playback.resumeBlocked(false);
    expect(resumed).toBe(true);
    expect(calls).toEqual(["play:/clips/intro.mp3:muted=false"]);
  });

  it("keeps the blocked clip when play is rejected", async () => {
    const { sink, calls } = fakeSink(() => Promise.reject(new Error("blocked")));
    const playback = createStoryPlayback(sink);
    const started = await playback.playFromGesture("/clips/intro.mp3", false);
    expect(started).toBe(false);
    expect(playback.isUnlocked()).toBe(false);
    expect(playback.isBlocked()).toBe(true);
    expect(calls[0]).toBe("play:/clips/intro.mp3:muted=false");
  });
});
