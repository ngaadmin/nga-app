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
    expect(built.html).toContain("NextGenAchievers");
    expect(built.html).toContain("penny-master-email.png");
    expect(built.html).not.toContain("penny-email-header");
    expect(built.html).toContain("background: #FFA503");
    expect(built.html).not.toContain("#FFC93C");
  });

  it("sends the locked under-16 teen approval copy with an escaped username", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://nga.example";
    process.env.VERCEL = "1";
    delete process.env.VERCEL_URL;

    const built = buildExplorerParentEmail(
      {
        username: "RiverTeen42<script>",
        token: "tok",
        track: "maverick",
      },
      "https://evil.example/phish",
    );

    expect(built.subject).toBe("Your teen wants to start NextGenAchiever$");
    expect(built.html).toContain("Please approve your teen&#39;s account");
    expect(built.html).toContain("RiverTeen42&lt;script&gt;");
    expect(built.html).toContain("Approve the account");
    expect(built.html).toContain(
      "https://nga.example/onboarding/sign-up?role=parent_master&amp;token=tok",
    );
    expect(built.html).toContain('href="https://nextgenachievers.com/privacy"');
    expect(built.html).toContain(
      "Privacy policy</a>: nextgenachievers.com/privacy · Next Gen Achievers Pty Ltd, ABN 49 685 561 344, Queensland, Australia",
    );
    expect(built.text).toContain(
      "Your teen has just signed up to NextGenAchiever$ with the username RiverTeen42<script>.",
    );
    expect(built.text).toContain(
      "the account stays on hold until a parent approves it.",
    );
    expect(built.text).toContain("This link only works for 24 hours.");
    expect(built.text).toContain(
      "Approve the account: https://nga.example/onboarding/sign-up?role=parent_master&token=tok",
    );
    expect(built.text).toContain(
      "Privacy policy: nextgenachievers.com/privacy · Next Gen Achievers Pty Ltd, ABN 49 685 561 344, Queensland, Australia",
    );
    expect(built.html).not.toContain("<script>");
    expect(built.html).not.toContain("TODO-COPY");
    expect(built.text).not.toContain("TODO-COPY");
    expect(built.html).not.toContain("www.nextgenachievers.com/privacy");
    expect(built.html).not.toContain("evil.example");
    expect(built.text).not.toContain("evil.example");
    expect(built.html).toContain(
      '<img src="https://app.nextgenachievers.com/email/penny-email-header@2x.png" width="600" height="170" alt="Penny from NextGenAchiever$ saying hello" style="display:block;width:100%;max-width:600px;height:auto;border:0;">',
    );
    expect(built.html.indexOf("penny-email-header@2x.png")).toBeLessThan(
      built.html.indexOf("<h1"),
    );
    expect(built.html).toContain("border-radius:16px;overflow:hidden");
    expect(built.html).toContain("padding:28px 36px 28px");
    expect(built.html).toContain("background: #FFC93C");
    expect(built.html).toContain("color: #031F82");
    expect(built.html).not.toContain("#FFA503");
    expect(built.html).not.toContain("NextGenAchievers");
    expect(built.html).not.toContain("penny-master-email.png");
    expect(built.text).not.toContain("penny-email-header");
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