import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.hoisted(() => vi.fn());
const rpc = vi.hoisted(() =>
  vi.fn(async (fn: string, args: Record<string, unknown>) => {
    void fn;
    void args;
    return { error: null as { message: string } | null };
  }),
);
const insert = vi.hoisted(() => vi.fn());
const setHeader = vi.hoisted(() => vi.fn(async () => ({ data: null, error: null })));
const maybeSingle = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: (table: string) => {
      if (table === "usage_events") {
        return {
          insert: (value: unknown) => {
            insert(value);
            return { setHeader };
          },
        };
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
      };
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

import { acceptInboundUsage } from "@/lib/usage/inbound-usage";

beforeEach(() => {
  getUser.mockReset();
  rpc.mockClear();
  insert.mockClear();
  setHeader.mockClear();
  maybeSingle.mockReset();
});

describe("acceptInboundUsage", () => {
  it("does not insert a guest usage_events row", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await acceptInboundUsage(
      {
        eventType: "lesson_completed",
        lessonNumber: 1,
        username: "Penny9001",
        xpTotal: 15,
        streakDays: 2,
      },
      (name) => {
        if (name === "user-agent") {
          return "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile";
        }
        if (name === "x-vercel-ip-country") return "nz";
        if (name === "x-forwarded-for") return "203.0.113.8";
        return null;
      },
    );

    expect(insert).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0]?.[0]).toBe("increment_guest_event_count");
    const args = rpc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(args).toMatchObject({
      p_event_type: "lesson_completed",
      p_lesson_number: 1,
      p_device_type: "mobile",
      p_country: "NZ",
    });
    expect(JSON.stringify(args)).not.toMatch(/Penny|xp_total|streak|Mozilla|203\.0\.113\.8/);
  });

  it("inserts a signed-in usage row under the profile username", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValue({
      data: { username: "River", teacher_id: null },
      error: null,
    });

    await acceptInboundUsage(
      { eventType: "lesson_abandoned", lessonNumber: 6, username: "Penny1842" },
      () => {
        throw new Error("signed-in usage must not read count headers");
      },
    );

    expect(rpc).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "River",
        event_type: "lesson_abandoned",
        lesson_number: 6,
        xp_total: null,
        streak_days: null,
      }),
    );
  });
});
