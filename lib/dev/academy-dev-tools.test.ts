import { describe, expect, it } from "vitest";
import {
  m1L5LocalPreviewPath,
  parseAcademyPreviewCohort,
} from "@/lib/dev/academy-dev-tools";

describe("parseAcademyPreviewCohort", () => {
  it("reads explorer, pathfinder, and maverick from the query", () => {
    expect(parseAcademyPreviewCohort(new URLSearchParams("cohort=pathfinder"))).toBe(
      "pathfinder",
    );
    expect(parseAcademyPreviewCohort(new URLSearchParams("cohort=Maverick"))).toBe(
      "maverick",
    );
    expect(parseAcademyPreviewCohort(new URLSearchParams("cohort=explorer"))).toBe(
      "explorer",
    );
  });

  it("falls back to explorer when the query is missing or unknown", () => {
    expect(parseAcademyPreviewCohort(new URLSearchParams())).toBe("explorer");
    expect(parseAcademyPreviewCohort(new URLSearchParams("cohort=teen"))).toBe(
      "explorer",
    );
  });
});

describe("m1L5LocalPreviewPath", () => {
  it("points at the local Module 1 Lesson 5 preview with a cohort", () => {
    expect(m1L5LocalPreviewPath("pathfinder")).toBe(
      "/dashboard/academy/lesson/preview/m1-l5?cohort=pathfinder",
    );
  });
});
