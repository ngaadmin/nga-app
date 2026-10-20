import { describe, expect, it } from "vitest";
import { loadPrivacyPolicyMarkdown } from "@/lib/privacy/load-privacy-policy";
import {
  collectLinks,
  inlineText,
  parsePrivacyMarkdown,
} from "@/lib/privacy/parse-privacy-markdown";
import { splitTrailingQualifier } from "@/lib/privacy/split-trailing-qualifier";

describe("privacy policy source", () => {
  it("publishes the approved policy with the 20 October 2026 date", () => {
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

    expect(markdown).toContain("**Last updated: 20 October 2026**");
    expect(markdown).not.toContain("[DATE]");
    expect(markdown).not.toContain("[CATH_EMAIL]");
    expect(markdown).not.toContain("## TO CONFIRM");
    expect(markdown).not.toMatch(/\bNGA\b/);
    expect(text).toContain("20 October 2026");
    expect(text).toContain(
      "If an account has no sign-in or activity for about 11 months, we email the parent or the teacher first.",
    );
    expect(text).toContain(
      "Accounts that are still inactive at 12 months are deleted.",
    );
    expect(text).toContain("Activity records are deleted with the account.");
    expect(text).toContain(
      "Guest activity records are kept on our servers and deleted automatically after 30 days.",
    );
    expect(text).toContain(
      "The sign-in log, which includes IP addresses, is kept for 30 days.",
    );
    expect(text).toContain(
      "Our database has no restorable backups, so deleted data cannot be recovered.",
    );
    expect(text).toContain(
      "Parents and teachers can view the data we keep, and download it as a data file, in the app.",
    );
    expect(text).toContain(
      "The community leaderboard is off until a parent switches it on for their child, or a teacher switches it on for their class.",
    );
    expect(text).toContain(
      "Parents and teachers can see the personal information we hold, download it as a data file, and delete it in the app.",
    );
    expect(text).toContain("cath.drdw@nextgenachievers.com");
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
