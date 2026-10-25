import { describe, expect, it } from "vitest";

import { academyLaunchName, explicitLessons, parseUatArgs } from "@/tools/uat-explorer-args";

describe("uat explorer args", () => {
  it("defaults to every lesson, both viewports, and no WebKit", () => {
    const args = parseUatArgs([]);
    expect(args.lessons).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(args.viewports).toEqual(["phone", "desktop"]);
    expect(args.chain).toBe(false);
    expect(args.webkit).toBe(false);
  });

  it("accepts a lesson and a comma list", () => {
    expect(parseUatArgs(["--lesson=2"]).lessons).toEqual([2]);
    expect(parseUatArgs(["--lesson=1,2,4"]).lessons).toEqual([1, 2, 4]);
    expect(parseUatArgs(["3,5"]).lessons).toEqual([3, 5]);
  });

  it("accepts phone, desktop, and both", () => {
    expect(parseUatArgs(["--viewport=phone"]).viewports).toEqual(["phone"]);
    expect(parseUatArgs(["--viewport=desktop"]).viewports).toEqual(["desktop"]);
    expect(parseUatArgs(["--viewport=both"]).viewports).toEqual(["phone", "desktop"]);
  });

  it("turns on a chained walk and a first-screen shot", () => {
    const args = parseUatArgs(["--chain", "--shot", "--spot=4,5"]);
    expect(args.chain).toBe(true);
    expect(args.shot).toBe(true);
    expect(args.spot).toEqual([4, 5]);
  });

  it("uses the phase-closer name for lesson 9 and the step name for the others", () => {
    expect(academyLaunchName(2)).toBe("Academy step 2");
    expect(academyLaunchName(9)).toBe("Level 1 milestone");
    expect(academyLaunchName(20)).not.toBe("Academy step 2");
  });

  it("leaves lesson unset when the quick check forgot --lesson", () => {
    expect(explicitLessons([])).toBeNull();
    expect(explicitLessons(["--lesson=2,3"])).toEqual([2, 3]);
    expect(explicitLessons(["8"])).toEqual([8]);
  });
});
