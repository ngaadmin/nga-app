import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchParentHubSignals } from "@/lib/parent/hub-signals-client";

const body = { access: { eligible: false }, unreadCount: 2 };

afterEach(() => vi.unstubAllGlobals());

describe("fetchParentHubSignals", () => {
  it("shares one request between callers made at the same time", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal("fetch", fetchMock);
    const [a, b] = await Promise.all([fetchParentHubSignals(), fetchParentHubSignals()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/parent/hub-signals");
    expect(a).toEqual(body);
    expect(b).toEqual(body);
  });

  it("asks again for a later call, and rejects on a server error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => body })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);
    await fetchParentHubSignals();
    await expect(fetchParentHubSignals()).rejects.toThrow("hub-signals 500");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
