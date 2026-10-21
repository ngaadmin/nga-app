import { describe, expect, it } from "vitest";
import { loadPrivacyPolicyMarkdown } from "@/lib/privacy/load-privacy-policy";
import {
  collectLinks,
  inlineText,
  parsePrivacyMarkdown,
} from "@/lib/privacy/parse-privacy-markdown";
import { splitTrailingQualifier } from "@/lib/privacy/split-trailing-qualifier";

describe("privacy policy source", () => {
  it("publishes the approved policy with the 21 October 2026 date", () => {
    const markdown = loadPrivacyPolicyMarkdown();
    const blocks = parsePrivacyMarkdown(markdown);
    const text = blocks
      .map((block) => {
        if (block.kind === "ul") return block.items.map(inlineText).join("\n");
        if (block.kind === "table") {
          return [
            ...block.headers.map(inlineText),
            ...block.rows.flatMap((row) => row.map(inlineText)),
          ].join("\n");
        }
        return inlineText(block.children);
      })
      .join("\n");

    expect(markdown).toContain("**Last updated: 21 October 2026**");
    expect(markdown).not.toContain("[DATE]");
    expect(markdown).not.toContain("[CATH_EMAIL]");
    expect(markdown).not.toContain("## TO CONFIRM");
    expect(markdown).not.toMatch(/\bNGA\b/);
    expect(text).toContain("21 October 2026");
    expect(text).toContain(
      "An account still waiting for a parent to approve it is deleted after 30 days.",
    );
    expect(text).toContain(
      "A learner who is 16 or over and picks Explorer must give an email address, and we use it only for password resets.",
    );
    expect(text).toContain(
      "This policy covers the app only. Our website has its own policy.",
    );
    expect(text).toContain(
      "progress (lessons completed, coins, Lifetime XP, skills, Vault jars and goals, streak)",
    );
    expect(text).toContain(
      "We keep our own sign-in audit log, which includes IP addresses, and delete it after 30 days (see section 9).",
    );
    expect(text).toContain(
      "Our sign-in provider (Supabase Auth) keeps the IP address and device or browser details for each active sign-in until the user signs out, the session is revoked, or the account is deleted.",
    );
    expect(text).toContain(
      "Our hosting and service providers also keep short-term technical logs, which may include IP addresses.",
    );
    expect(text).toContain(
      "Coins are what a learner earns and cashes in. Lifetime XP is a separate progress score, and cashing in does not lower it.",
    );
    expect(text).toContain(
      "The Community leaderboard is off unless a parent switches it on for a child, or a teacher switches it on for a class.",
    );
    expect(text).toContain(
      "When it is on, it shows the signed-in user's username and sample player names, each with a rank, a day streak and Lifetime XP.",
    );
    expect(text).toContain(
      "sends emails to parents, teachers and self sign-up learners who give a personal email, from mail.nextgenachievers.com.",
    );
    expect(text).toContain(
      "We do not email a class student or a child on a parent account.",
    );
    expect(text).toContain(
      "A self sign-up learner does not get that warning, even with a personal email.",
    );
    expect(text).toContain(
      "For rate-limiting, IP addresses are used briefly, in memory only.",
    );
    expect(text).toContain(
      "If an account has no sign-in or activity at 11 months, we email the parent or the teacher.",
    );
    expect(text).toContain(
      "When a warning is sent, deletion waits at least 30 days after that email.",
    );
    expect(text).toContain(
      "If there is nobody to email, the account is deleted at 12 months with no warning.",
    );
    expect(text).toContain(
      "Accounts that are still inactive at 12 months are deleted.",
    );
    expect(text).toContain("Activity records are deleted with the account.");
    expect(text).toContain(
      "streak days and a small technical field",
    );
    expect(text).toContain(
      "Lessons, coins, Lifetime XP, medals and Vault activity stay on the device.",
    );
    expect(text).toContain(
      "A guest's lessons, coins, Lifetime XP, medals and Vault activity stay on the device. Our server keeps simple guest activity records under a made-up guest username, with no real name, email or class, and deletes them after 30 days. Clear this device's progress clears the device only.",
    );
    expect(text).not.toContain("metadata");
    expect(text).toContain("the parent PIN (stored as a hash)");
    expect(text).toContain("consent history");
    expect(text).toContain(
      "Teacher passwords and the parent PIN are stored as a hash.",
    );
    expect(text).toContain(
      "You can view, download and delete data in the app (see section 9).",
    );
    expect(text).toContain(
      "We delete our sign-in audit log, which includes IP addresses, after 30 days (see section 2).",
    );
    expect(text).toContain(
      "Hosting and service providers keep short-term technical logs, which may include IP addresses.",
    );
    expect(text).toContain(
      "We don't currently keep restorable backups, so deleted data cannot be recovered.",
    );
    expect(text).toContain("Clear this device's progress");
    expect(text).toContain("read-only My info page");
    expect(text).toContain("info@nextgenachievers.com");
    expect(text).not.toContain("cath.drdw@nextgenachievers.com");
    expect(text).not.toContain("XP/points");
    expect(text).not.toContain("about 11 months");
    expect(text).not.toContain("parents only");
    expect(text).not.toContain("cannot see other students");
    expect(text).not.toContain("no restorable backups");
    expect(text).not.toContain("This policy covers the app and nextgenachievers.com.");
    expect(text).not.toContain("for their child");
    expect(text).not.toContain("support@nextgenachievers.com");
    expect(text).not.toContain("sign-in provider also keeps");
    expect(collectLinks(blocks)).toEqual([]);
  });
});

describe("splitTrailingQualifier", () => {
  it("puts a trailing parenthetical on its own qualifier and keeps the brackets", () => {
    expect(splitTrailingQualifier("Students (school class seats)")).toEqual({
      label: "Students",
      qualifier: "(school class seats)",
    });
    expect(splitTrailingQualifier("Students (parent accounts)")).toEqual({
      label: "Students",
      qualifier: "(parent accounts)",
    });
  });

  it("leaves labels without a trailing parenthetical unchanged", () => {
    expect(splitTrailingQualifier("Parents and guardians")).toEqual({
      label: "Parents and guardians",
      qualifier: null,
    });
    expect(splitTrailingQualifier("Teachers")).toEqual({
      label: "Teachers",
      qualifier: null,
    });
  });
});
