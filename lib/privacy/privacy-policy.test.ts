import { describe, expect, it } from "vitest";
import { loadPrivacyPolicyMarkdown } from "@/lib/privacy/load-privacy-policy";
import {
  collectLinks,
  inlineText,
  parsePrivacyMarkdown,
} from "@/lib/privacy/parse-privacy-markdown";
import { splitTrailingQualifier } from "@/lib/privacy/split-trailing-qualifier";

describe("privacy policy source", () => {
  it("publishes the approved policy with the 15 October 2026 date", () => {
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

    expect(markdown).toContain("**Last updated: 15 October 2026**");
    expect(markdown).not.toContain("[DATE]");
    expect(markdown).not.toContain("[CATH_EMAIL]");
    expect(markdown).not.toContain("## TO CONFIRM");
    expect(markdown).not.toMatch(/\bNGA\b/);
    expect(text).toContain("15 October 2026");
    expect(text).toContain(
      "Accounts inactive for 12 months are reviewed and deleted.",
    );
    expect(text).toContain(
      "Our database has no restorable backups, so deleted data cannot be recovered.",
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
