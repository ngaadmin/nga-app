import { describe, expect, it } from "vitest";
import { peelLeadingEmoji, presentLightningCard } from "@/lib/academy/lessons/peel-leading-emoji";

describe("peelLeadingEmoji", () => {
  it("splits a BMP alarm clock off the label so it is not shown twice", () => {
    expect(peelLeadingEmoji("⏰ It's a limited time offer - I have to buy it now!")).toEqual({
      emoji: "⏰",
      label: "It's a limited time offer - I have to buy it now!",
    });
  });

  it("splits a supplementary pictograph", () => {
    expect(peelLeadingEmoji("💰 I can wait and get it cheaper later.")).toEqual({
      emoji: "💰",
      label: "I can wait and get it cheaper later.",
    });
  });

  it("leaves a label with no emoji unchanged", () => {
    expect(peelLeadingEmoji("I'll sleep on it and decide tomorrow.")).toEqual({
      label: "I'll sleep on it and decide tomorrow.",
    });
  });
});

describe("presentLightningCard", () => {
  it("keeps the authored emoji and strips the same emoji from the text", () => {
    expect(
      presentLightningCard({
        emoji: "⏰",
        label: "⏰ It's a limited time offer - I have to buy it now!",
      }),
    ).toEqual({
      emoji: "⏰",
      label: "It's a limited time offer - I have to buy it now!",
    });
  });
});
