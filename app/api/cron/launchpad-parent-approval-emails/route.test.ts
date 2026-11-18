import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const sweep = vi.hoisted(() => vi.fn(async () => ({ checked: 2, requestSent: 0, reminderSent: 1, skipped: 1, failed: 0 })));
vi.mock("@/lib/launchpad/parent-approval/email", () => ({ runLaunchpadApprovalEmailSweep: sweep }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));

import { GET } from "@/app/api/cron/launchpad-parent-approval-emails/route";

afterEach(() => {
  vi.unstubAllEnvs();
  sweep.mockClear();
});

describe("GET /api/cron/launchpad-parent-approval-emails", () => {
  it("rejects a request with no secret, a wrong secret, or no CRON_SECRET configured", async () => {
    expect((await GET(new Request("https://x.test/api/cron/x"))).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "right-secret");
    expect((await GET(new Request("https://x.test/api/cron/x", { headers: { authorization: "Bearer wrong" } }))).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(new Request("https://x.test/api/cron/x", { headers: { authorization: "Bearer " } }))).status).toBe(401);
    expect(sweep).not.toHaveBeenCalled();
  });

  it("runs the sweep for the right secret and returns counts only", async () => {
    vi.stubEnv("CRON_SECRET", "right-secret");
    const res = await GET(new Request("https://x.test/api/cron/x", { headers: { authorization: "Bearer right-secret" } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, checked: 2, requestSent: 0, reminderSent: 1, skipped: 1, failed: 0 });
  });
});
