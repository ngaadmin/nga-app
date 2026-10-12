import { describe, expect, it } from "vitest";

import { allowsDirectLessonOpen } from "@/lib/dev/academy-dev-tools";

describe("allowsDirectLessonOpen", () => {
  it("stays closed in production unless the preview flag is set", () => {
    expect(allowsDirectLessonOpen({ nodeEnv: "production" })).toBe(false);
    expect(
      allowsDirectLessonOpen({ preview: true, nodeEnv: "production" }),
    ).toBe(true);
  });

  it("opens any lesson directly while developing", () => {
    expect(allowsDirectLessonOpen({ nodeEnv: "development" })).toBe(true);
    expect(
      allowsDirectLessonOpen({ preview: false, nodeEnv: "development" }),
    ).toBe(true);
  });
});
