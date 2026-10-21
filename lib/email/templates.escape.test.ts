import { afterEach, describe, expect, it } from "vitest";
import {
  buildAccountDeletedChildEmail,
  buildAccountDeletedMasterEmail,
  buildExplorerParentEmail,
  resolveTrustedAppUrl,
} from "@/lib/email/templates";
import {
  isPublicConsentEmailType,
  storedConsentMatchesEmailType,
} from "@/lib/email/public-send-policy";

const ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "VERCEL",
  "VERCEL_URL",
] as const;

const envSnapshot = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = envSnapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("email template escaping", () => {
  it("escapes names and ignores a spoofed link origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://nga.example";
    process.env.VERCEL = "1";
    delete process.env.VERCEL_URL;

    const built = buildExplorerParentEmail(
      {
        username: "Ada<script>\r\nBcc: x@y.z",
        token: "tok",
      },
      "https://evil.example/phish",
    );

    expect(built.html).not.toContain("<script>");
    expect(built.html).toContain("&lt;script&gt;");
    expect(built.subject).not.toMatch(/[\r\n]/);
    expect(built.text).not.toMatch(/[\r\n]Bcc/);
    expect(built.html).toContain("https://nga.example/onboarding/sign-up");
    expect(built.html).not.toContain("evil.example");
    expect(built.text).not.toContain("evil.example");
  });

  it("sends the under-16 teen approval copy without the child's username", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://nga.example";
    process.env.VERCEL = "1";
    delete process.env.VERCEL_URL;

    const built = buildExplorerParentEmail(
      {
        username: "RiverTeen42<script>",
        token: "tok",
        track: "pathfinder",
      },
      "https://evil.example/phish",
    );

    expect(built.subject).toBe("Your teen wants to start NextGenAchiever$");
    expect(built.html).toContain("Please approve your teen&#39;s account");
    expect(built.html).toContain("Approve the account");
    expect(built.html).toContain(
      "Button not working? Copy this link into your browser:",
    );
    expect(built.html).toContain(
      "https://nga.example/onboarding/sign-up?role=parent_master&amp;token=tok",
    );
    expect(built.text).toContain(
      "The account stays locked until a parent approves it.",
    );
    expect(built.text).toContain(
      "Button not working? Copy this link into your browser: https://nga.example/onboarding/sign-up?role=parent_master&token=tok",
    );
    expect(built.html).not.toContain("RiverTeen42");
    expect(built.text).not.toContain("RiverTeen42");
    expect(built.html).not.toContain("<script>");
    expect(built.html).not.toContain("TODO-COPY");
    expect(built.text).not.toContain("TODO-COPY");
    expect(built.html).not.toContain("evil.example");
  });

  it("keeps a configured preview host", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_URL = "preview.vercel.app";
    expect(resolveTrustedAppUrl("https://preview.vercel.app/path")).toBe(
      "https://preview.vercel.app",
    );
    expect(resolveTrustedAppUrl("javascript:alert(1)")).not.toContain(
      "javascript:",
    );
  });
});

describe("account-deleted email contact", () => {
  it("uses info@nextgenachievers.com", () => {
    const child = buildAccountDeletedChildEmail({ username: "delta4" });
    const household = buildAccountDeletedMasterEmail({
      childUsernames: ["delta4"],
    });
    for (const built of [child, household]) {
      expect(built.text).toContain("info@nextgenachievers.com");
      expect(built.html).toContain("info@nextgenachievers.com");
      expect(built.text).not.toContain("support@");
      expect(built.html).not.toContain("support@");
    }
  });
});

describe("public email send policy", () => {
  it("only allows stored consent types", () => {
    expect(isPublicConsentEmailType("EXPLORER_PARENT")).toBe(true);
    expect(isPublicConsentEmailType("FRIEND_INVITE")).toBe(false);
    expect(isPublicConsentEmailType("USERNAME_RECOVERY")).toBe(false);
    expect(isPublicConsentEmailType("PARENT_WELCOME")).toBe(false);
    expect(storedConsentMatchesEmailType("EXPLORER_PARENT", "vpc")).toBe(true);
    expect(
      storedConsentMatchesEmailType("PATHFINDER_PARENT", "parent_claim"),
    ).toBe(true);
    expect(storedConsentMatchesEmailType("PATHFINDER_PARENT", "vpc")).toBe(
      false,
    );
  });
});