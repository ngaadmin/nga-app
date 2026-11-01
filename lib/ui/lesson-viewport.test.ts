import { describe, expect, it } from "vitest";
import { isTopInsetRedundant } from "@/lib/ui/lesson-viewport";

const iphone = { screenHeight: 874, screenWidth: 402, viewportWidth: 402 };

describe("isTopInsetRedundant", () => {
  it("drops a doubled top inset in a letterboxed home-screen app", () => {
    expect(
      isTopInsetRedundant({ ...iphone, standalone: true, viewportHeight: 812, insetTop: 62 }),
    ).toBe(true);
  });

  it("keeps the inset when the page runs under the status bar", () => {
    expect(
      isTopInsetRedundant({ ...iphone, standalone: true, viewportHeight: 874, insetTop: 62 }),
    ).toBe(false);
  });

  it("never touches Safari tabs or screens with no inset", () => {
    expect(
      isTopInsetRedundant({ ...iphone, standalone: false, viewportHeight: 700, insetTop: 62 }),
    ).toBe(false);
    expect(
      isTopInsetRedundant({ ...iphone, standalone: true, viewportHeight: 812, insetTop: 0 }),
    ).toBe(false);
  });

  it("leaves landscape alone", () => {
    expect(
      isTopInsetRedundant({
        standalone: true,
        screenHeight: 874,
        screenWidth: 402,
        viewportHeight: 360,
        viewportWidth: 812,
        insetTop: 62,
      }),
    ).toBe(false);
  });
});
