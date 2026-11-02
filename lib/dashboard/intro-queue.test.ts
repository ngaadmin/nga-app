import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasPendingHubIntro,
  resetHubIntroQueue,
  setHubIntroPending,
  subscribeHubIntroQueue,
} from "@/lib/dashboard/intro-queue";

afterEach(() => resetHubIntroQueue());

describe("intro queue (one card at a time)", () => {
  it("holds while a hub intro is pending and releases on dismiss", () => {
    expect(hasPendingHubIntro()).toBe(false);
    setHubIntroPending("academy", true);
    expect(hasPendingHubIntro()).toBe(true);
    setHubIntroPending("academy", false);
    expect(hasPendingHubIntro()).toBe(false);
  });

  it("notifies listeners only on real changes", () => {
    const listener = vi.fn();
    const off = subscribeHubIntroQueue(listener);
    setHubIntroPending("academy", true);
    setHubIntroPending("academy", true);
    setHubIntroPending("academy", false);
    setHubIntroPending("academy", false);
    expect(listener).toHaveBeenCalledTimes(2);
    off();
    setHubIntroPending("vault", true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("stays held until every pending intro is done", () => {
    setHubIntroPending("academy", true);
    setHubIntroPending("vault", true);
    setHubIntroPending("academy", false);
    expect(hasPendingHubIntro()).toBe(true);
    setHubIntroPending("vault", false);
    expect(hasPendingHubIntro()).toBe(false);
  });
});
