// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playStoryClipOnMount } from "@/lib/academy/lessons/story-audio/playback";
import { storyClipDurationLabel } from "@/lib/academy/lessons/story-audio/next-clip";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { fundingScreen } from "@/lib/launchpad/content/planning/funding";
import { dogWalkingJobsCoverScreen, dogWalkingSetPriceScreen } from "@/lib/launchpad/content/pricing/screens";
import { screenHasNarration } from "@/components/launchpad/venture-test/venture-flow";
import { FundingFlow } from "@/components/launchpad/venture/screens/funding-flow";
import { JobsCoverFlow } from "@/components/launchpad/venture/screens/jobs-cover-flow";
import { SetPriceFlow } from "@/components/launchpad/venture/screens/set-price-flow";

vi.mock("@/lib/academy/lessons/story-audio/playback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/academy/lessons/story-audio/playback")>();
  return {
    ...actual,
    playStoryClipOnScreen: vi.fn(() => Promise.resolve(false)),
    playStoryClipOnMount: vi.fn(() => Promise.resolve(false)),
    playStoryClipFromGesture: vi.fn(),
    stopStoryAudio: vi.fn(),
    storyAudioElement: vi.fn(() => null),
    installStoryAudioFallback: vi.fn(() => () => {}),
  };
});

afterEach(cleanup);

function releaseNarration() {
  act(() => {
    vi.advanceTimersByTime(2000);
  });
}

function expectMuteInsideFrame() {
  const mute = screen.getByRole("button", { name: "Mute sound" });
  const frame = mute.closest("[data-screen-frame]");
  expect(frame).toBeTruthy();
  expect(frame?.className).toContain("relative");
  expect(mute.className).toContain("absolute");
  expect(mute.className).toContain("right-2");
  expect(mute.className).toContain("top-2");
}

describe("intro narration clips", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(playStoryClipOnMount).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays Set the price from the payload and keeps the credit on that intro only", () => {
    const spec = dogWalkingSetPriceScreen();
    expect(spec.audio).toEqual({ src: "/launchpad/pricing/l2-s2-vo.mp3", durationMs: 30119 });
    render(<SetPriceFlow screen={spec} floors={[]} />);
    expect(playStoryClipOnMount).toHaveBeenCalledWith(spec.audio!.src);
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
    expect(screen.getByText(storyClipDurationLabel(spec.audio!.durationMs)!)).toBeTruthy();
    expectMuteInsideFrame();
    expect(screen.getByText(spec.copy.credit!)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("button", { name: "Replay" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mute sound" })).toBeNull();
    expect(screen.queryByText(spec.copy.credit!)).toBeNull();
  });

  it("plays Jobs to cover your costs from the payload and adds no credit", () => {
    const spec = dogWalkingJobsCoverScreen();
    expect(spec.audio).toEqual({ src: "/launchpad/pricing/l2-jobs-vo.mp3", durationMs: 25626 });
    render(<JobsCoverFlow screen={spec} floors={[]} />);
    expect(playStoryClipOnMount).toHaveBeenCalledWith(spec.audio!.src);
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
    expect(screen.getByText(storyClipDurationLabel(spec.audio!.durationMs)!)).toBeTruthy();
    expectMuteInsideFrame();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    expect(spec.weekAudio).toEqual({ src: "/launchpad/pricing/l2-jobs-week-vo.mp3", durationMs: 14420 });
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(playStoryClipOnMount).toHaveBeenCalledWith(spec.weekAudio!.src);
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
    expect(screen.getByText(storyClipDurationLabel(spec.weekAudio!.durationMs)!)).toBeTruthy();
    expectMuteInsideFrame();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    expect(screen.getByText(spec.copy.weekIntro!)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    releaseNarration();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("plays the funding intro from the payload and adds no credit", () => {
    const spec = fundingScreen();
    expect(spec.audio).toEqual({ src: "/launchpad/planning/l2-funding-vo.mp3", durationMs: 30119 });
    render(<FundingFlow screen={spec} />);
    expect(playStoryClipOnMount).toHaveBeenCalledWith(spec.audio!.src);
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
    expect(screen.getByText(storyClipDurationLabel(spec.audio!.durationMs)!)).toBeTruthy();
    expectMuteInsideFrame();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("button", { name: "Replay" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mute sound" })).toBeNull();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
  });

  it("lists every dog-walking narration clip", () => {
    const clips: string[] = [];
    for (const floor of launchpadTestVentureSeed("dog-walking").floors) {
      for (const silver of floor.silvers) {
        for (const bronze of silver.bronzes) {
          for (const task of bronze.tasks) {
            for (const item of task.screens) {
              if (!screenHasNarration(item)) continue;
              if ("audio" in item && item.audio && "src" in item.audio) clips.push(item.audio.src);
              if ("weekAudio" in item && item.weekAudio?.src) clips.push(item.weekAudio.src);
              if ("pages" in item && item.pages) {
                for (const page of item.pages) {
                  if (page && typeof page === "object" && "audio" in page && page.audio?.src) clips.push(page.audio.src);
                }
              }
            }
          }
        }
      }
    }
    expect(clips).toEqual([
      "/launchpad/pricing/l2-s2-vo.mp3",
      "/launchpad/pricing/l2-jobs-vo.mp3",
      "/launchpad/pricing/l2-jobs-week-vo.mp3",
      "/launchpad/planning/l2-funding-vo.mp3",
      "/launchpad/budgeting/l6-s1-vo.mp3",
      "/launchpad/budgeting/l6-s2-vo.mp3",
      "/launchpad/budgeting/l6-s3-vo.mp3",
    ]);
  });
});
