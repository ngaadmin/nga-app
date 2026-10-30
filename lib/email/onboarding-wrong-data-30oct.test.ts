import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendOnboardingEmail } from "@/lib/email/resend-client";
import {
  buildExplorerParentEmail,
  buildParentWelcomeEmail,
} from "@/lib/email/templates";

/**
 * Items 7 and 9 (30 Oct 2026). The real sender runs with a fake API key and a
 * stubbed fetch, so nothing leaves the test and we read the exact payload.
 */
type SentPayload = { to: string[]; subject: string; html: string; text: string };

const sent: SentPayload[] = [];

function only(): SentPayload {
  expect(sent).toHaveLength(1);
  return sent[0] as SentPayload;
}

beforeEach(() => {
  sent.length = 0;
  vi.stubEnv("RESEND_API_KEY", "test-key-not-real");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: { body: string }) => {
      sent.push(JSON.parse(init.body) as SentPayload);
      return new Response(JSON.stringify({ id: "mock-email" }), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("item 7: parent welcome greeting", () => {
  it("never greets a parent with the auto p… username", async () => {
    const result = await sendOnboardingEmail({
      type: "PARENT_WELCOME",
      recipientEmail: "parent@example.com",
      data: { username: "p0123456789abcdef012" },
    });
    expect(result.success).toBe(true);
    const email = only();
    expect(email.to).toEqual(["parent@example.com"]);
    expect(email.text).toContain("Hi there,");
    expect(email.html).toContain("Hi there,");
    expect(email.text).not.toContain("p0123456789abcdef012");
    expect(email.html).not.toContain("p0123456789abcdef012");
  });

  it("keeps a real chosen name", async () => {
    await sendOnboardingEmail({
      type: "PARENT_WELCOME",
      recipientEmail: "parent@example.com",
      data: { username: "RiverMum" },
    });
    expect(only().text).toContain("Hi RiverMum,");
    expect(only().text).not.toContain("Hi there,");
  });

  it("falls back to Hi there for a blank name", () => {
    const built = buildParentWelcomeEmail({ username: "  " });
    expect(built.text).toContain("Hi there,");
  });
});

describe("item 9: approval wording does not assume age or track band", () => {
  it.each(["explorer", "pathfinder", "maverick"] as const)(
    "the %s approval email is age-neutral",
    async (track) => {
      await sendOnboardingEmail({
        type: "EXPLORER_PARENT",
        recipientEmail: "parent@example.com",
        data: { username: "River", token: "tok", track },
      });
      const email = only();
      for (const part of [email.subject, email.text, email.html]) {
        expect(part).not.toMatch(/your teen/i);
        expect(part).not.toMatch(/aged 10-13|ages 10-13|10–13/i);
        expect(part).not.toMatch(/\bNGA\b/);
      }
      expect(email.text.toLowerCase()).toContain("your child");
    },
  );

  it("an under-13 on Pathfinder gets 'your child', not 'your teen'", () => {
    const built = buildExplorerParentEmail({
      username: "Kid12",
      token: "tok",
      track: "pathfinder",
    });
    expect(built.subject).toBe("Your child wants to start NextGenAchiever$");
    expect(built.text).toContain("Because your child is under 16");
  });

  it("a 14 or 15 year-old Explorer is not told the track is for kids aged 10-13", () => {
    const built = buildExplorerParentEmail({
      username: "Teen15",
      token: "tok",
      track: "explorer",
    });
    expect(built.text).toContain(
      "Your child has chosen the Explorer track. And to make their profile official, we need a parent/guardian's approval.",
    );
  });
});
