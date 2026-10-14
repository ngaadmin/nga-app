import { describe, expect, it } from "vitest";

import {
  allowsDirectLessonOpen,
  isAcademyLessonPreview,
} from "@/lib/dev/academy-dev-tools";

describe("allowsDirectLessonOpen", () => {
  it("stays closed in production even when the preview flag is set", () => {
    expect(allowsDirectLessonOpen({ nodeEnv: "production" })).toBe(false);
    expect(
      allowsDirectLessonOpen({ preview: true, nodeEnv: "production" }),
    ).toBe(false);
  });

  it("opens any lesson directly while developing", () => {
    expect(allowsDirectLessonOpen({ nodeEnv: "development" })).toBe(true);
    expect(
      allowsDirectLessonOpen({ preview: false, nodeEnv: "development" }),
    ).toBe(true);
  });
});

describe("isAcademyLessonPreview", () => {
  const params = { get: () => "1" };

  it("ignores the preview query outside development", () => {
    expect(isAcademyLessonPreview(params, "production")).toBe(false);
  });

  it("accepts the preview query while developing", () => {
    expect(isAcademyLessonPreview(params, "development")).toBe(true);
  });
});
