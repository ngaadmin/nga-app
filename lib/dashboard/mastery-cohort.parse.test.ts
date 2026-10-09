import { describe, expect, it } from "vitest";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortNameAndAgeLabel,
  parseMasteryCohort,
} from "@/lib/dashboard/mastery-cohort";

describe("parseMasteryCohort", () => {
  it("accepts the three class tracks", () => {
    expect(parseMasteryCohort("explorer")).toBe("explorer");
    expect(parseMasteryCohort("pathfinder")).toBe("pathfinder");
    expect(parseMasteryCohort("maverick")).toBe("maverick");
  });

  it("rejects unknown values", () => {
    expect(parseMasteryCohort("teen")).toBeNull();
    expect(parseMasteryCohort(null)).toBeNull();
  });
});

describe("mastery cohort list labels", () => {
  it("lists Explorer, Pathfinder, then Maverick with hyphen age ranges", () => {
    expect([...MASTERY_COHORT_ORDER]).toEqual([
      "explorer",
      "pathfinder",
      "maverick",
    ]);
    expect(masteryCohortNameAndAgeLabel("explorer")).toBe("Explorer 10-12");
    expect(masteryCohortNameAndAgeLabel("pathfinder")).toBe("Pathfinder 13-15");
    expect(masteryCohortNameAndAgeLabel("maverick")).toBe("Maverick 16+");
    for (const cohort of MASTERY_COHORT_ORDER) {
      const range = masteryCohortAgeRangeLabel(cohort);
      expect(range).not.toMatch(/[\u2013\u2014]/);
      expect(range.includes("-") || range.endsWith("+")).toBe(true);
    }
  });
});
