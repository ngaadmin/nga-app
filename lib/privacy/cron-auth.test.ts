import { afterEach, describe, expect, it } from "vitest";
import { authorizeCronRequest } from "@/lib/privacy/cron-auth";

const original = process.env.CRON_SECRET;

afterEach(() => {
  if (original === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = original;
});

function request(authorization?: string): Request {
  return new Request("https://app.example/api/cron/privacy-retention", {
    headers: authorization ? { authorization } : {},
  });
}

describe("authorizeCronRequest", () => {
  it("accepts only the bearer cron secret", () => {
    process.env.CRON_SECRET = "long-random-secret";
    expect(authorizeCronRequest(request("Bearer long-random-secret"))).toBe(true);
    expect(authorizeCronRequest(request("Bearer wrong"))).toBe(false);
    expect(authorizeCronRequest(request())).toBe(false);
  });

  it("fails closed when the secret is unset", () => {
    delete process.env.CRON_SECRET;
    expect(authorizeCronRequest(request("Bearer long-random-secret"))).toBe(false);
  });
});
