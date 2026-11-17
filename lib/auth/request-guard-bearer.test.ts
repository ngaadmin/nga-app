import { afterEach, describe, expect, it } from "vitest";
import { apiBearerSecret, authorizeBrowserMutation } from "@/lib/auth/request-guard";

const KEYS = ["NODE_ENV", "API_BEARER_SECRET", "EMAIL_API_SECRET", "NGA_TOKEN_SECRET"] as const;
const snapshot = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

function setEnv(key: (typeof KEYS)[number], value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[key];
  else env[key] = value;
}

afterEach(() => {
  for (const key of KEYS) setEnv(key, snapshot[key]);
});

function bearerCall(token: string) {
  setEnv("NODE_ENV", "production");
  return authorizeBrowserMutation(
    new Request("https://app.example/api/email/send", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    }),
  );
}

describe("API bearer secret split (security review finding 7)", () => {
  it("uses API_BEARER_SECRET when it is set", () => {
    setEnv("API_BEARER_SECRET", "api-bearer");
    setEnv("EMAIL_API_SECRET", undefined);
    setEnv("NGA_TOKEN_SECRET", "token-signing");
    expect(apiBearerSecret()).toBe("api-bearer");
    expect(bearerCall("api-bearer")).toEqual({ ok: true });
  });

  it("stops accepting NGA_TOKEN_SECRET as a bearer once API_BEARER_SECRET is set", () => {
    setEnv("API_BEARER_SECRET", "api-bearer");
    setEnv("EMAIL_API_SECRET", undefined);
    setEnv("NGA_TOKEN_SECRET", "token-signing");
    expect(bearerCall("token-signing")).toEqual({
      ok: false,
      status: 401,
      error: "Unauthorized.",
    });
  });

  it("falls back to EMAIL_API_SECRET, then NGA_TOKEN_SECRET, while API_BEARER_SECRET is unset", () => {
    setEnv("API_BEARER_SECRET", undefined);
    setEnv("EMAIL_API_SECRET", "email-secret");
    setEnv("NGA_TOKEN_SECRET", "token-signing");
    expect(apiBearerSecret()).toBe("email-secret");
    expect(bearerCall("email-secret")).toEqual({ ok: true });

    setEnv("EMAIL_API_SECRET", undefined);
    expect(apiBearerSecret()).toBe("token-signing");
    expect(bearerCall("token-signing")).toEqual({ ok: true });
  });

  it("rejects any bearer when no secret is configured", () => {
    setEnv("API_BEARER_SECRET", undefined);
    setEnv("EMAIL_API_SECRET", undefined);
    setEnv("NGA_TOKEN_SECRET", undefined);
    expect(apiBearerSecret()).toBeNull();
    expect(bearerCall("anything").ok).toBe(false);
  });
});
