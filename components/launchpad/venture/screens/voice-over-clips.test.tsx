// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playStoryClipOnScreen } from "@/lib/academy/lessons/story-audio/playback";
import { storyClipDurationLabel } from "@/lib/academy/lessons/story-audio/next-clip";
import { fundingScreen } from "@/lib/launchpad/content/planning/funding";
import { dogWalkingJobsCoverScreen, dogWalkingSetPriceScreen } from "@/lib/launchpad/content/pricing/screens";
import { FundingFlow } from "@/components/launchpad/venture/screens/funding-flow";
import { JobsCoverFlow } from "@/components/launchpad/venture/screens/jobs-cover-flow";
import { SetPriceFlow } from "@/components/launchpad/venture/screens/set-price-flow";

vi.mock("@/lib/academy/lessons/story-audio/playback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/academy/lessons/story-audio/playback")>();
  return {
    ...actual,
    playStoryClipOnScreen: vi.fn(() => Promise.resolve(false)),
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

describe("intro narration clips", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(playStoryClipOnScreen).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays Set the price from the payload and keeps the credit on that intro only", () => {
    const spec = dogWalkingSetPriceScreen();
    expect(spec.audio).toEqual({ src: "/launchpad/pricing/l2-s2-vo.mp3", durationMs: 30119 });
    render(<SetPriceFlow screen={spec} floors={[]} />);
    expect(playStoryClipOnScreen).toHaveBeenCalledWith(spec.audio!.src);
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
    expect(screen.getByText(storyClipDurationLabel(spec.audio!.durationMs)!)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mute sound" })).toBeTruthy();
    expect(screen.getByText(spec.copy.credit!)).toBeTruthy();
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
    expect(playStoryClipOnScreen).toHaveBeenCalledWith(spec.audio!.src);
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
    expect(screen.getByText(storyClipDurationLabel(spec.audio!.durationMs)!)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mute sound" })).toBeTruthy();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("button", { name: "Replay" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mute sound" })).toBeNull();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    expect(spec.weekAudio).toBeUndefined();
  });

  it("plays a jobs week intro from the payload slot when a clip is set", () => {
    const spec = dogWalkingJobsCoverScreen();
    spec.weekAudio = { src: "/launchpad/pricing/l2-jobs-week-vo.mp3", durationMs: 12000 };
    render(<JobsCoverFlow screen={spec} floors={[]} />);
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(playStoryClipOnScreen).toHaveBeenCalledWith(spec.weekAudio.src);
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mute sound" })).toBeTruthy();
    expect(screen.getByText(spec.copy.weekIntro!)).toBeTruthy();
  });

  it("plays the funding intro from the payload and adds no credit", () => {
    const spec = fundingScreen();
    expect(spec.audio).toEqual({ src: "/launchpad/planning/l2-funding-vo.mp3", durationMs: 30119 });
    render(<FundingFlow screen={spec} />);
    expect(playStoryClipOnScreen).toHaveBeenCalledWith(spec.audio!.src);
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
    expect(screen.getByText(storyClipDurationLabel(spec.audio!.durationMs)!)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mute sound" })).toBeTruthy();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("button", { name: "Replay" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mute sound" })).toBeNull();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
  });
});
