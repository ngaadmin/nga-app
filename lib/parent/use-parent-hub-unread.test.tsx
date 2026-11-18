// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const server = vi.hoisted(() => ({ fetchParentHubSignals: vi.fn() }));
vi.mock("@/lib/parent/hub-signals-client", () => server);
const signals = (unreadCount: number) => ({ access: { eligible: false as const }, unreadCount });

import { useParentHubUnreadCount } from "@/lib/parent/use-parent-hub-unread";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useParentHubUnreadCount", () => {
  it("drops the count at once when a waiting request is answered, then confirms with the server", async () => {
    server.fetchParentHubSignals.mockResolvedValueOnce(signals(1)).mockResolvedValue(signals(0));
    const { result } = renderHook(() => useParentHubUnreadCount(true));
    await act(async () => {});
    expect(result.current).toBe(1);

    let release!: (n: ReturnType<typeof signals>) => void;
    server.fetchParentHubSignals.mockReturnValueOnce(new Promise<ReturnType<typeof signals>>((r) => (release = r)));
    act(() => {
      window.dispatchEvent(new CustomEvent("parent-hub:unread-changed", { detail: { pendingDelta: -1 } }));
    });
    expect(result.current).toBe(0);
    await act(async () => release(signals(0)));
    expect(result.current).toBe(0);
  });

  it("never goes below zero and ignores an event with no change", async () => {
    server.fetchParentHubSignals.mockResolvedValue(signals(0));
    const { result } = renderHook(() => useParentHubUnreadCount(true));
    await act(async () => {});
    act(() => {
      window.dispatchEvent(new CustomEvent("parent-hub:unread-changed", { detail: { pendingDelta: -1 } }));
    });
    expect(result.current).toBe(0);
  });

  it("is 0 for a non-parent", () => {
    const { result } = renderHook(() => useParentHubUnreadCount(false));
    expect(result.current).toBe(0);
  });
});
