// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { TAB_BAR_CLASS, TAB_BAR_CLEARANCE_CLASS, VentureTestShell } from "@/components/launchpad/venture-test/venture-test-shell";
import {
  AcademyTabIconA,
  CommunityTabIconA,
  LaunchpadTabIconA,
  SubscriptionTabIconA,
  VaultTabIconA,
} from "@/lib/dashboard/tab-icons-a";

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
    const icons = [
      AcademyTabIconA,
      LaunchpadTabIconA,
      VaultTabIconA,
      CommunityTabIconA,
      SubscriptionTabIconA,
    ];
    const drawn = bar.querySelectorAll("a svg");
    expect(drawn).toHaveLength(icons.length);
    icons.forEach((Icon, index) => {
      const sample = document.createElement("div");
      render(createElement(Icon, { className: "size-6" }), { container: sample });
      expect(drawn[index]?.innerHTML).toBe(sample.querySelector("svg")?.innerHTML);
    });
    expect(screen.getByRole("link", { name: "Launchpad" }).querySelector("span")?.className).toContain("bg-nga-cta");
  });
});
