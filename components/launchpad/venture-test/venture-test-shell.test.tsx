// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TAB_BAR_CLASS, TAB_BAR_CLEARANCE_CLASS, VentureTestShell } from "@/components/launchpad/venture-test/venture-test-shell";

afterEach(cleanup);

describe("VentureTestShell tab bar clearance", () => {
  it("pads the page by the tab bar height plus the bottom safe-area inset", () => {
    expect(TAB_BAR_CLASS).toContain("h-[calc(78px+env(safe-area-inset-bottom,0px))]");
    expect(TAB_BAR_CLEARANCE_CLASS).toBe("pb-[calc(78px+env(safe-area-inset-bottom,0px))]");
    render(
      <VentureTestShell>
        <button type="button">Continue</button>
      </VentureTestShell>,
    );
    const main = screen.getByRole("main");
    expect(main.className).toContain(TAB_BAR_CLEARANCE_CLASS);
    const bar = screen.getByRole("navigation", { name: "Main navigation" });
    expect(bar.className).toContain("fixed");
    expect(bar.className).toContain("pb-[env(safe-area-inset-bottom,0px)]");
  });
});
