import { describe, expect, it } from "vitest";
import { parseMasteryCohort } from "@/lib/dashboard/mastery-cohort";

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
