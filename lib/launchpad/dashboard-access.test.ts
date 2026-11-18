import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const state = { unreadable: false };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    if (state.unreadable) throw new Error("down");
    return { auth: { getUser } };
  },
}));

import { launchpadViewerIsGuest } from "@/lib/launchpad/dashboard-access";

beforeEach(() => {
  getUser.mockReset();
  state.unreadable = false;
});

describe("launchpadViewerIsGuest", () => {
  it("is true when there is no Auth user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await launchpadViewerIsGuest()).toBe(true);
  });

  it("is false for any signed-in account, so a pending child still goes back to the dashboard", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    expect(await launchpadViewerIsGuest()).toBe(false);
  });

  it("fails closed when the session cannot be read", async () => {
    state.unreadable = true;
    expect(await launchpadViewerIsGuest()).toBe(false);
  });
});
