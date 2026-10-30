import { describe, expect, it } from "vitest";
import { loadPrivacyPolicyMarkdown } from "@/lib/privacy/load-privacy-policy";
import {
  collectLinks,
  inlineText,
  parsePrivacyMarkdown,
} from "@/lib/privacy/parse-privacy-markdown";
import { splitTrailingQualifier } from "@/lib/privacy/split-trailing-qualifier";

describe("privacy policy source", () => {
  it("publishes the approved policy dated October 30, 2026", () => {
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

    expect(markdown.startsWith("# NextGenAchievers app privacy policy\n")).toBe(
      true,
    );
    expect(markdown).toContain("\nPublished October 30, 2026\n");
    expect(markdown).not.toContain("Last updated");
    expect(markdown).not.toContain("21 October 2026");
    expect(markdown).not.toContain("[DATE]");
    expect(markdown).not.toContain("[CATH_EMAIL]");
    expect(markdown).not.toContain("## TO CONFIRM");
    expect(markdown).not.toMatch(/\bNGA\b/);
    expect(blocks.filter((block) => block.kind === "h2")).toHaveLength(13);
    expect(text).toContain(
      "This page gives the details for the app. It's part of our Privacy policy, which covers the app and our website and forms part of our Terms and Conditions of Service.",
    );
    expect(text).toContain(
      "Every learner who picks Pathfinder or Maverick gives one, including learners under 16, and so does a learner 16 or over who picks Explorer.",
    );
    expect(text).toContain(
      "We don't store it: we keep only whether parent approval was required and when the check happened.",
    );
    expect(text).toContain(
      "An account still waiting for a parent to approve it, or declined, is deleted 30 days after sign-up, together with the whole consent request, including the parent's email address.",
    );
    expect(text).toContain(
      "Learners can't delete their own account in the app, including Self sign-up and Adult account holders.",
    );
    expect(text).toContain(
      "It doesn't include email addresses, real names, IP addresses or device details, and it stays in our own database.",
    );
    expect(text).toContain(
      "Deleting an account doesn't cancel a subscription, whether you bought it on our website or through an app store.",
    );
    expect(text).toContain(
      "After a parent enters the parent PIN, a cookie keeps \"My child's data\" open for 15 minutes.",
    );
    expect(text).toContain(
      "please contact our Privacy Officer at info@nextgenachievers.com.",
    );
    expect(text).not.toContain("cath.drdw@nextgenachievers.com");
    expect(text).not.toContain("support@nextgenachievers.com");
    expect(collectLinks(blocks)).toEqual([
      { href: "https://nextgenachievers.com/privacy", text: "Privacy policy" },
      {
        href: "https://nextgenachievers.com/terms",
        text: "Terms and Conditions of Service",
      },
      {
        href: "https://nextgenachievers.com/privacy/providers",
        text: "nextgenachievers.com/privacy/providers",
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
