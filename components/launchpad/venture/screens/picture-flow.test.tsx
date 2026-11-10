// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MASTER_MUTED_KEY } from "@/lib/academy/lessons/story-audio/master-mute";
import { playStoryClipFromGesture } from "@/lib/academy/lessons/story-audio/playback";
import { BUDGETING_SPLIT_ASK, BUDGETING_SPLIT_CONTEXT, BUDGETING_SPLIT_GUIDANCE } from "@/lib/launchpad/content/budgeting/copy";
import { readBudgetSplit } from "@/lib/launchpad/content/budgeting/split";
import { budgetingDoor } from "@/lib/launchpad/content/budgeting/screens";
import { PictureFlow } from "@/components/launchpad/venture/screens/picture-flow";

vi.mock("@/lib/academy/lessons/story-audio/playback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/academy/lessons/story-audio/playback")>();
  return {
    ...actual,
    playStoryClipOnScreen: vi.fn(() => Promise.resolve(false)),
    playStoryClipFromGesture: vi.fn(),
    stopStoryAudio: vi.fn(),
    storyAudioElement: vi.fn(() => null),
    installStoryAudioFallback: vi.fn(() => () => {}),
    applyMasterMute: (muted: boolean) => {
      window.localStorage.setItem("nga_master_muted", muted ? "1" : "0");
    },
  };
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const screenSpec = budgetingDoor().tasks[0]!.screens[0]!;

function continueButton() {
  return screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
}

function releaseContinue() {
  act(() => {
    vi.advanceTimersByTime(2000);
  });
}

describe("Budgeting picture screens", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("holds Continue for 2 seconds on each Budgeting page, then lets it go", () => {
    if (screenSpec.type !== "picture") throw new Error("expected a picture screen");
    render(<PictureFlow screen={screenSpec} onExit={() => {}} onFinish={() => {}} />);
    expect(continueButton().disabled).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(continueButton().disabled).toBe(true);
    releaseContinue();
    expect(continueButton().disabled).toBe(false);
    fireEvent.click(continueButton());
    expect(document.querySelector("[data-picture-page='s2']")).toBeTruthy();
    expect(continueButton().disabled).toBe(true);
    releaseContinue();
    fireEvent.click(continueButton());
    expect(document.querySelector("[data-picture-page='s3']")).toBeTruthy();
    expect(continueButton().disabled).toBe(true);
  });

  it("replays the current page from the start through the shared player", () => {
    if (screenSpec.type !== "picture") throw new Error("expected a picture screen");
    render(<PictureFlow screen={screenSpec} onExit={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(playStoryClipFromGesture).toHaveBeenCalledWith("/launchpad/budgeting/l6-s1-vo.mp3");
    releaseContinue();
    fireEvent.click(continueButton());
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(playStoryClipFromGesture).toHaveBeenLastCalledWith("/launchpad/budgeting/l6-s2-vo.mp3");
  });

  it("locks the split only when the four rows add up to 100", () => {
    if (screenSpec.type !== "picture") throw new Error("expected a picture screen");
    const onFinish = vi.fn();
    render(<PictureFlow screen={screenSpec} onExit={() => {}} onFinish={onFinish} />);
    for (let i = 0; i < 3; i += 1) {
      releaseContinue();
      fireEvent.click(continueButton());
    }
    const lock = screen.getByRole("button", { name: "Lock in my split" }) as HTMLButtonElement;
    expect(screen.getByText("Total 100%")).toBeTruthy();
    expect(lock.disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Less Giving" }));
    expect(screen.getByText("Total 95%")).toBeTruthy();
    expect(lock.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "More Giving" }));
    expect(lock.disabled).toBe(false);
    fireEvent.click(lock);
    expect(readBudgetSplit()).toEqual([5, 15, 40, 40]);
    expect(onFinish).toHaveBeenCalled();
  });

  it("puts the split context, guidance, and question above the first row, in that order", () => {
    if (screenSpec.type !== "picture") throw new Error("expected a picture screen");
    render(<PictureFlow screen={screenSpec} onExit={() => {}} onFinish={() => {}} />);
    for (let i = 0; i < 3; i += 1) {
      releaseContinue();
      fireEvent.click(continueButton());
    }
    const editor = document.querySelector("[data-budget-editor]")!;
    const text = editor.textContent ?? "";
    const contextAt = text.indexOf(BUDGETING_SPLIT_CONTEXT);
    const guidanceAt = text.indexOf(BUDGETING_SPLIT_GUIDANCE);
    const askAt = text.indexOf(BUDGETING_SPLIT_ASK);
    const givingAt = text.indexOf("Giving");
    expect(contextAt).toBeGreaterThanOrEqual(0);
    expect(contextAt).toBeLessThan(guidanceAt);
    expect(guidanceAt).toBeLessThan(askAt);
    expect(askAt).toBeLessThan(givingAt);
    const context = editor.querySelector("[data-split-copy='context']")!;
    expect(context.className).toContain("text-[18px]");
    expect(context.className).toContain("leading-[26px]");
    const guidance = [...editor.querySelectorAll("p")].find((node) => node.textContent === BUDGETING_SPLIT_GUIDANCE)!;
    const ask = [...editor.querySelectorAll("p")].find((node) => node.textContent === BUDGETING_SPLIT_ASK)!;
    expect(guidance.className).toContain("text-[16px]");
    expect(ask.className).toContain("text-[21px]");
    expect(editor.textContent).not.toMatch(/rule of thumb/i);
  });

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

    releaseContinue();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-picture-page='s2']")).toBeTruthy();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    expect(screen.getByRole("button", { name: "Mute sound" })).toBeTruthy();

    fireEvent.click(mute);
    expect(screen.getByRole("button", { name: "Unmute sound" }).getAttribute("aria-pressed")).toBe("true");
    expect(window.localStorage.getItem(MASTER_MUTED_KEY)).toBe("1");

    releaseContinue();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-picture-page='s3']")).toBeTruthy();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    expect(screen.getByRole("button", { name: "Unmute sound" })).toBeTruthy();
  });
});
