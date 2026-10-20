import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LeaderboardSwitch } from "@/components/privacy/leaderboard-switch";

function markup(enabled: boolean): string {
  return renderToStaticMarkup(
    createElement(LeaderboardSwitch, {
      enabled,
      scope: "child",
      onChange: () => undefined,
    }),
  );
}

describe("LeaderboardSwitch", () => {
  it("draws off with a grey track and the knob anchored at the left", () => {
    const html = markup(false);

    expect(html).toContain('aria-checked="false"');
    expect(html).toContain("Off until you switch it on.");
    expect(html).toContain("bg-gray-300");
    expect(html).not.toContain("bg-[#BDE9FB]");
    expect(html).toContain("left-0");
    expect(html).toContain("translate-x-0.5");
    expect(html).not.toContain("translate-x-5");
  });

  it("draws on with a teal track and the knob shifted to the right", () => {
    const html = markup(true);

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("On for this child.");
    expect(html).toContain("bg-[#0CC1E0]");
    expect(html).toContain("left-0");
    expect(html).toContain("translate-x-5");
    expect(html).not.toContain("translate-x-0.5");
  });
});
