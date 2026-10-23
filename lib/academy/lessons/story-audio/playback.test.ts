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

  it("autoplays each later beat after the lesson gesture, and keeps mute", async () => {
    const { sink, calls } = fakeSink();
    const playback = createStoryPlayback(sink);
    await playback.primeFromGesture();
    calls.length = 0;
    const intro = await playback.playOnScreen("/clips/intro.mp3", false);
    const second = await playback.playOnScreen("/clips/l2-beat2.mp3", true);
    const afterClose = await playback.playOnScreen("/clips/l6-beat3.mp3", true);
    const moduleEnd = await playback.playOnScreen("/clips/l9-beat1.mp3", false);
    expect(intro && second && afterClose && moduleEnd).toBe(true);
    expect(calls).toEqual([
      "play:/clips/intro.mp3:muted=false",
      "play:/clips/l2-beat2.mp3:muted=true",
      "play:/clips/l6-beat3.mp3:muted=true",
      "play:/clips/l9-beat1.mp3:muted=false",
    ]);
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
