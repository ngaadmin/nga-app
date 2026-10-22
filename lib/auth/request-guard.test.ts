import { afterEach, describe, expect, it } from "vitest";
import { authorizeBrowserMutation } from "@/lib/auth/request-guard";

const ENV_KEYS = [
  "NODE_ENV",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_VERCEL_URL",
  "NEXT_PUBLIC_VERCEL_BRANCH_URL",
  "EMAIL_API_SECRET",
  "NGA_TOKEN_SECRET",
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

function call(
  headers: Record<string, string>,
  nodeEnv: "production" | "development",
) {
  setEnv("NODE_ENV", nodeEnv);
  process.env.VERCEL = "1";
  delete process.env.VERCEL_ENV;
  process.env.NEXT_PUBLIC_APP_URL = "https://nga.example";
  delete process.env.VERCEL_URL;
  delete process.env.VERCEL_BRANCH_URL;
  delete process.env.NEXT_PUBLIC_VERCEL_URL;
  delete process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL;
  delete process.env.EMAIL_API_SECRET;
  delete process.env.NGA_TOKEN_SECRET;
  return authorizeBrowserMutation(
    new Request("https://nga.example/api/email/send", {
      method: "POST",
      headers,
    }),
  );
}

describe("authorizeBrowserMutation", () => {
  it("rejects a spoofed Origin that only matches the request Host", () => {
    const result = call(
      {
        host: "evil.example",
        origin: "https://evil.example",
        "sec-fetch-site": "same-origin",
      },
      "production",
    );
    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "Forbidden origin.",
    });
  });

  it("rejects a matching Origin when Sec-Fetch-Site is missing", () => {
    const result = call(
      { origin: "https://nga.example", host: "nga.example" },
      "production",
    );
    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "Forbidden request site.",
    });
  });

  it("allows the configured app origin from a same-origin browser fetch", () => {
    const result = call(
      {
        origin: "https://nga.example",
        host: "nga.example",
        "sec-fetch-site": "same-origin",
      },
      "production",
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects a cross-site fetch even when Origin is allowed", () => {
    const result = call(
      {
        origin: "https://nga.example",
        "sec-fetch-site": "cross-site",
      },
      "production",
    );
    expect(result.ok).toBe(false);
  });

  it("allows a local browser call without Origin outside production", () => {
    const result = call({ host: "localhost:3000" }, "development");
    expect(result).toEqual({ ok: true });
  });

  it("rejects this deployment's vercel.app host in production", () => {
    setEnv("NODE_ENV", "production");
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "nga-mhazyq8a0-nga-v2.vercel.app";
    process.env.VERCEL_BRANCH_URL = "nga-app-git-uat-2026-10-22-nga-v2.vercel.app";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.nextgenachievers.com";
    delete process.env.EMAIL_API_SECRET;
    delete process.env.NGA_TOKEN_SECRET;

    const ownPreview = authorizeBrowserMutation(
      new Request("https://app.nextgenachievers.com/api/auth/sign-in", {
        method: "POST",
        headers: {
          origin: "https://nga-app-git-uat-2026-10-22-nga-v2.vercel.app",
          "sec-fetch-site": "same-origin",
        },
      }),
    );
    const other = authorizeBrowserMutation(
      new Request("https://app.nextgenachievers.com/api/auth/sign-in", {
        method: "POST",
        headers: {
          origin: "https://nga-app-other.vercel.app",
          "sec-fetch-site": "same-origin",
        },
      }),
    );
    const production = authorizeBrowserMutation(
      new Request("https://app.nextgenachievers.com/api/auth/sign-in", {
        method: "POST",
        headers: {
          origin: "https://app.nextgenachievers.com",
          "sec-fetch-site": "same-origin",
        },
      }),
    );

    expect(ownPreview).toEqual({
      ok: false,
      status: 403,
      error: "Forbidden origin.",
    });
    expect(other).toEqual({
      ok: false,
      status: 403,
      error: "Forbidden origin.",
    });
    expect(production).toEqual({ ok: true });
  });

  it("allows this preview's own hosts and rejects another vercel.app host", () => {
    setEnv("NODE_ENV", "production");
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_BRANCH_URL = "nga-app-git-uat-2026-10-22-nga-v2.vercel.app";
    process.env.VERCEL_URL = "nga-mhazyq8a0-nga-v2.vercel.app";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.nextgenachievers.com";
    delete process.env.EMAIL_API_SECRET;
    delete process.env.NGA_TOKEN_SECRET;

    const branch = authorizeBrowserMutation(
      new Request(
        "https://nga-app-git-uat-2026-10-22-nga-v2.vercel.app/api/auth/sign-in",
        {
          method: "POST",
          headers: {
            origin: "https://nga-app-git-uat-2026-10-22-nga-v2.vercel.app",
            "sec-fetch-site": "same-origin",
          },
        },
      ),
    );
    const deployment = authorizeBrowserMutation(
      new Request("https://nga-mhazyq8a0-nga-v2.vercel.app/api/auth/consent-token", {
        method: "POST",
        headers: {
          origin: "https://nga-mhazyq8a0-nga-v2.vercel.app",
          "sec-fetch-site": "same-origin",
        },
      }),
    );
    const other = authorizeBrowserMutation(
      new Request(
        "https://nga-app-git-uat-2026-10-22-nga-v2.vercel.app/api/auth/sign-in",
        {
          method: "POST",
          headers: {
            origin: "https://nga-app-other.vercel.app",
            "sec-fetch-site": "same-origin",
          },
        },
      ),
    );

    expect(branch).toEqual({ ok: true });
    expect(deployment).toEqual({ ok: true });
    expect(other).toEqual({
      ok: false,
      status: 403,
      error: "Forbidden origin.",
    });
  });
});
