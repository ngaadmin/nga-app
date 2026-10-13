import { afterEach, describe, expect, it } from "vitest";
import {
  getPasswordResetTokenSecretSource,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/auth/password-reset-token";

const ENV_KEYS = [
  "NODE_ENV",
  "NGA_TOKEN_SECRET",
  "EMAIL_API_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

const envSnapshot = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

function setEnv(key: (typeof ENV_KEYS)[number], value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else (process.env as Record<string, string | undefined>)[key] = value;
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    setEnv(key, envSnapshot[key]);
  }
});

const claims = {
  userId: "user-1",
  username: "ada",
  createdAt: "2026-10-13T00:00:00.000Z",
};

describe("password reset token secret", () => {
  it("does not sign with the service role key in production", () => {
    setEnv("NODE_ENV", "production");
    delete process.env.NGA_TOKEN_SECRET;
    delete process.env.EMAIL_API_SECRET;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret";

    expect(getPasswordResetTokenSecretSource()).toBe("missing");
    expect(() => signPasswordResetToken(claims)).toThrow(/NGA_TOKEN_SECRET/);
  });

  it("signs and verifies with NGA_TOKEN_SECRET in production", () => {
    setEnv("NODE_ENV", "production");
    process.env.NGA_TOKEN_SECRET = "dedicated-reset-secret";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret";
    process.env.EMAIL_API_SECRET = "email-secret";

    expect(getPasswordResetTokenSecretSource()).toBe("nga_token_secret");
    const token = signPasswordResetToken(claims);
    expect(verifyPasswordResetToken(token)).toEqual(claims);

    process.env.NGA_TOKEN_SECRET = "different-secret";
    expect(verifyPasswordResetToken(token)).toBeNull();
  });
});
