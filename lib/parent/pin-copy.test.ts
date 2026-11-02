import { describe, expect, it } from "vitest";
import { PIN_NAMES, childDataPhrase, parentHubSubtitle } from "@/lib/parent/pin-copy";

describe("pin copy", () => {
  it("names one PIN only", () => {
    expect(Object.values(PIN_NAMES)).toEqual(["Parent PIN"]);
    expect(JSON.stringify(PIN_NAMES)).not.toMatch(/Hub PIN/);
  });

  it("matches child or children to the count", () => {
    expect(childDataPhrase(2)).toBe("your children's data");
    expect(childDataPhrase(1)).toBe("your child's data");
    expect(childDataPhrase(null)).toBe("your child's data");
    expect(parentHubSubtitle(3)).toBe("Approvals and your children's progress");
    expect(parentHubSubtitle(1)).toBe("Approvals and your child's progress");
  });

  it("shows a neutral Hub line while the count loads", () => {
    expect(parentHubSubtitle(null)).toBe("Approvals and progress");
    expect(parentHubSubtitle(undefined)).toBe("Approvals and progress");
    expect(parentHubSubtitle(null)).not.toMatch(/child/);
  });
});
