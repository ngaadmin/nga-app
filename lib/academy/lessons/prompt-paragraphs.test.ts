import { describe, expect, it } from "vitest";

import { splitPromptParagraphs } from "@/lib/academy/lessons/prompt-paragraphs";

describe("splitPromptParagraphs", () => {
  it("keeps a blank line as its own paragraph", () => {
    expect(
      splitPromptParagraphs(
        'Senna explains why he waited: "Remember the last time."\n\nDrag the steps into order.',
      ),
    ).toEqual([
      'Senna explains why he waited: "Remember the last time."',
      "Drag the steps into order.",
    ]);
  });

  it("leaves a single paragraph as one block", () => {
    expect(splitPromptParagraphs("Ready to build your own Spare Cash?")).toEqual([
      "Ready to build your own Spare Cash?",
    ]);
  });
});
