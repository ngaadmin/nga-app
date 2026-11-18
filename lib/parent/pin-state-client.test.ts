import { beforeEach, describe, expect, it, vi } from "vitest";

const server = vi.hoisted(() => ({ getParentPinState: vi.fn() }));
vi.mock("@/lib/parent/parent-tab-server", () => server);

import { clearParentPinStateCache, getParentPinStateCached } from "@/lib/parent/pin-state-client";

beforeEach(() => {
  vi.clearAllMocks();
  clearParentPinStateCache();
});

describe("getParentPinStateCached", () => {
  it("reuses a plain has-a-PIN answer for a short while", async () => {
    server.getParentPinState.mockResolvedValue({ ok: true, hasPin: true, lockedUntil: null });
    await getParentPinStateCached(1000);
    await getParentPinStateCached(5000);
    expect(server.getParentPinState).toHaveBeenCalledTimes(1);
  });

  it("asks again after the short window", async () => {
    server.getParentPinState.mockResolvedValue({ ok: true, hasPin: true, lockedUntil: null });
    await getParentPinStateCached(1000);
    await getParentPinStateCached(1000 + 25_000);
    expect(server.getParentPinState).toHaveBeenCalledTimes(2);
  });

  it("never keeps a locked, no-PIN or failed answer", async () => {
    server.getParentPinState.mockResolvedValue({ ok: true, hasPin: true, lockedUntil: 99999 });
    await getParentPinStateCached(1000);
    await Promise.resolve();
    await getParentPinStateCached(1100);
    server.getParentPinState.mockResolvedValue({ ok: true, hasPin: false, lockedUntil: null });
    await getParentPinStateCached(1200);
    await Promise.resolve();
    await getParentPinStateCached(1300);
    expect(server.getParentPinState).toHaveBeenCalledTimes(4);
  });

  it("forgets the answer when told to", async () => {
    server.getParentPinState.mockResolvedValue({ ok: true, hasPin: true, lockedUntil: null });
    await getParentPinStateCached(1000);
    clearParentPinStateCache();
    await getParentPinStateCached(1100);
    expect(server.getParentPinState).toHaveBeenCalledTimes(2);
  });
});
