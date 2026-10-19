import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PENDING_SCREEN_MAX_MS,
  startPendingScreenTimeout,
} from "@/lib/dashboard/pending-screen-timeout";

describe("pending screen timeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits 8 seconds, then clears and hard-navigates when the path is stuck", () => {
    vi.useFakeTimers();
    const clearPending = vi.fn();
    const assign = vi.fn();
    startPendingScreenTimeout({
      pendingHref: "/dashboard/launchpad",
      readPathname: () => "/dashboard/academy",
      clearPending,
      assign,
    });

    vi.advanceTimersByTime(PENDING_SCREEN_MAX_MS - 1);
    expect(clearPending).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(clearPending).toHaveBeenCalledOnce();
    expect(assign).toHaveBeenCalledOnce();
    expect(assign).toHaveBeenCalledWith("/dashboard/launchpad");
  });

  it("clears without navigating once the path is already the tapped tab", () => {
    vi.useFakeTimers();
    const clearPending = vi.fn();
    const assign = vi.fn();
    startPendingScreenTimeout({
      pendingHref: "/dashboard/vault",
      readPathname: () => "/dashboard/vault",
      clearPending,
      assign,
    });

    vi.advanceTimersByTime(PENDING_SCREEN_MAX_MS);
    expect(clearPending).toHaveBeenCalledOnce();
    expect(assign).not.toHaveBeenCalled();
  });

  it("does nothing when the wait is cancelled", () => {
    vi.useFakeTimers();
    const clearPending = vi.fn();
    const assign = vi.fn();
    const cancel = startPendingScreenTimeout({
      pendingHref: "/dashboard/community",
      readPathname: () => "/dashboard/academy",
      clearPending,
      assign,
    });

    vi.advanceTimersByTime(PENDING_SCREEN_MAX_MS - 1);
    cancel();
    vi.advanceTimersByTime(5_000);
    expect(clearPending).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });
});
