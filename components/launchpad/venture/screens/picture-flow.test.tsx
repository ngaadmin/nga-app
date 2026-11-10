// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MASTER_MUTED_KEY } from "@/lib/academy/lessons/story-audio/master-mute";
import { budgetingDoor } from "@/lib/launchpad/content/budgeting/screens";
import { PictureFlow } from "@/components/launchpad/venture/screens/picture-flow";

vi.mock("@/lib/academy/lessons/story-audio/playback", () => ({
  playStoryClipOnScreen: vi.fn(() => Promise.resolve(false)),
  playStoryClipFromGesture: vi.fn(),
  stopStoryAudio: vi.fn(),
  storyAudioElement: vi.fn(() => null),
  installStoryAudioFallback: vi.fn(() => () => {}),
  applyMasterMute: (muted: boolean) => {
    window.localStorage.setItem("nga_master_muted", muted ? "1" : "0");
  },
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const screenSpec = budgetingDoor().tasks[0]!.screens[0]!;

describe("Budgeting picture screens", () => {
  it("puts the Grok credit above Continue on screen 1 only, and keeps the mute control on every screen", () => {
    if (screenSpec.type !== "picture") throw new Error("expected a picture screen");
    render(<PictureFlow screen={screenSpec} onExit={() => {}} onFinish={() => {}} />);
    const story = document.querySelector("[data-picture-page='s1'] p")!;
    expect(story.textContent).toContain("Your business is starting to make money");
    expect(story.textContent).not.toContain("Voice created with Grok");
    const credit = screen.getByText("Voice created with Grok");
    expect(credit.getAttribute("data-lesson-credit")).toBe("");
    expect(credit.className).toContain("text-[16px]");
    expect(credit.className).toContain("font-medium");
    expect(credit.compareDocumentPosition(screen.getByRole("button", { name: "Continue" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const mute = screen.getByRole("button", { name: "Mute sound" });
    expect(mute.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-picture-page='s2']")).toBeTruthy();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    expect(screen.getByRole("button", { name: "Mute sound" })).toBeTruthy();

    fireEvent.click(mute);
    expect(screen.getByRole("button", { name: "Unmute sound" }).getAttribute("aria-pressed")).toBe("true");
    expect(window.localStorage.getItem(MASTER_MUTED_KEY)).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-picture-page='s3']")).toBeTruthy();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    expect(screen.getByRole("button", { name: "Unmute sound" })).toBeTruthy();
  });
});
