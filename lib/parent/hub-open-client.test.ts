import { afterEach, describe, expect, it, vi } from "vitest";
import { openParentHubFromBrowser } from "@/lib/parent/hub-open-client";

afterEach(() => vi.unstubAllGlobals());

describe("openParentHubFromBrowser", () => {
  it("posts the PIN as JSON and returns the answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, pass: "p" }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await openParentHubFromBrowser("1234")).toEqual({ ok: true, pass: "p" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/parent/hub-open");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ pin: "1234" });
  });

  it("answers with a plain error, never hangs, when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await openParentHubFromBrowser("1234");
    expect(result).toMatchObject({ ok: false, reason: "error" });
  });
});
