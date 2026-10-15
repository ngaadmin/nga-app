import { describe, expect, it } from "vitest";
import { isKidClassPassword, suggestClassPassword } from "@/lib/school/class-password";
import { buildUsernamesPdf, classUsernamesPdfName } from "@/lib/school/class-usernames-pdf";

describe("kid class passwords", () => {
  it("accepts two list words joined by a dash", () => {
    expect(isKidClassPassword("blue-tiger")).toBe(true);
  });

  it("rejects a single word, capitals, and words off the list", () => {
    expect(isKidClassPassword("Yellow")).toBe(false);
    expect(isKidClassPassword("Blue-tiger")).toBe(false);
    expect(isKidClassPassword("blue-dragon")).toBe(false);
    expect(isKidClassPassword("blue tiger")).toBe(false);
  });

  it("suggests a password that passes the same rule", () => {
    expect(isKidClassPassword(suggestClassPassword())).toBe(true);
  });
});

describe("username pdf", () => {
  it("names the file from the class and leaves the password out", () => {
    expect(classUsernamesPdfName("Pathfinder class")).toBe("pathfinder-class-usernames.pdf");
    const pdf = new TextDecoder().decode(
      buildUsernamesPdf({ className: "Pathfinder class", usernames: ["amber2"] }),
    );
    expect(pdf).toContain("Pathfinder class");
    expect(pdf).toContain("amber2");
    expect(pdf.toLowerCase()).not.toContain("password");
    expect(pdf).not.toContain("Yellow");
  });
});