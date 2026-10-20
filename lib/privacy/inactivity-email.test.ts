import { describe, expect, it } from "vitest";
import { buildInactivityWarningEmail } from "@/lib/email/templates";

describe("inactivity warning email", () => {
  it("names the child by username and stays plain", () => {
    const built = buildInactivityWarningEmail({
      audience: "parent-child",
      username: "River<script>",
    });

    expect(built.subject).toContain("River<script>");
    expect(built.text).toContain("River<script>");
    expect(built.text).toContain("about 11 months");
    expect(built.text).toContain("NextGenAchievers");
    expect(built.html).toContain("River&lt;script&gt;");
    expect(built.text).not.toMatch(/\bNGA\b/);
    expect(built.html).not.toMatch(/\bNGA\b/);
    expect(built.text).not.toContain("@");
  });

  it("does not name a child when the notice is about the parent", () => {
    const built = buildInactivityWarningEmail({
      audience: "parent-self",
      username: "River",
    });
    expect(built.text).not.toContain("River");
    expect(built.subject).toContain("Your NextGenAchievers account");
  });
});
