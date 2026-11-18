import { beforeEach, describe, expect, it, vi } from "vitest";

const server = vi.hoisted(() => ({ openParentHubWithPin: vi.fn() }));
vi.mock("@/lib/parent/parent-tab-server", () => server);

import { POST } from "@/app/api/parent/hub-open/route";

const post = (body: unknown, type = "application/json") =>
  POST(new Request("http://x/api/parent/hub-open", { method: "POST", headers: { "content-type": type }, body: JSON.stringify(body) }));

beforeEach(() => vi.clearAllMocks());

describe("POST /api/parent/hub-open", () => {
  it("passes a 4-digit PIN to the same check the Hub always used", async () => {
    server.openParentHubWithPin.mockResolvedValue({ ok: true, pass: "p", hub: { ok: true } });
    const response = await post({ pin: "1234" });
    expect(server.openParentHubWithPin).toHaveBeenCalledWith("1234");
    expect(await response.json()).toMatchObject({ ok: true, pass: "p" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("refuses a malformed PIN without calling the check", async () => {
    const response = await post({ pin: "12" });
    expect(server.openParentHubWithPin).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ ok: false });
  });

  it("refuses anything that is not JSON", async () => {
    const response = await post({ pin: "1234" }, "text/plain");
    expect(response.status).toBe(415);
    expect(server.openParentHubWithPin).not.toHaveBeenCalled();
  });
});
