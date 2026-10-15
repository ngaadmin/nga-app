import { describe, expect, it } from "vitest";
import { loadPrivacyPolicyMarkdown } from "@/lib/privacy/load-privacy-policy";
import {
  collectLinks,
  inlineText,
  parsePrivacyMarkdown,
} from "@/lib/privacy/parse-privacy-markdown";
import { splitTrailingQualifier } from "@/lib/privacy/split-trailing-qualifier";

const BACKUP_SENTENCE =
  "Deleted data is removed from our live database; we don't keep restorable backups.";

describe("privacy policy source", () => {
  it("keeps the publication placeholders and confirmed retention wording", () => {
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

    expect(markdown).toContain("[DATE]");
    expect(markdown).not.toContain("[CATH_EMAIL]");
    expect(markdown).not.toContain("## TO CONFIRM");
    expect(markdown).not.toContain("remove before publishing");
    expect(text).toContain("[DATE]");
    expect(text).toContain("[Region: TO CONFIRM]");
    expect(text).toContain(
      "Inactive accounts are deleted after 12 months of inactivity.",
    );
    expect(text).toContain(BACKUP_SENTENCE);
    expect(collectLinks(blocks)).toEqual([
      {
        href: "mailto:cath.drdw@nextgenachievers.com",
        text: "cath.drdw@nextgenachievers.com",
      },
    ]);
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
