import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  generateClassPassword,
  isKidClassPassword,
  storedClassPasswordCanSignIn,
  suggestClassPassword,
} from "@/lib/school/class-password";
import { parseTeacherClassPage } from "@/lib/school/class-page-payload";
import {
  CLASS_PAGE_ROUNDS_AFTER,
  CLASS_PAGE_ROUNDS_BEFORE,
  classPageNetworkWaitMs,
} from "@/lib/school/class-page-timing";
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

  it("gives a new class the same two-word password as Suggest one", () => {
    const password = generateClassPassword();
    expect(isKidClassPassword(password)).toBe(true);
    expect(password).toBe(password.toLowerCase());
    expect(password.includes("-")).toBe(true);
  });

  it("lets sign-in accept a new pair and an older single word", () => {
    expect(storedClassPasswordCanSignIn("blue-tiger")).toBe(true);
    expect(storedClassPasswordCanSignIn("Yellow")).toBe(true);
    expect(isKidClassPassword("Yellow")).toBe(false);
    expect(storedClassPasswordCanSignIn("short")).toBe(false);
  });
});

describe("class page loader", () => {
  it("reads teacher, seats, and XP from one payload", () => {
    const page = parseTeacherClassPage({
      error: null,
      id: "teacher-1",
      is_teacher: true,
      account_status: "active",
      seat_cap: 30,
      class_password: null,
      class_password_enc: "cipher",
      class_cohort: "pathfinder",
      seats: [
        {
          id: "seat-1",
          username: "amber2",
          curriculum_cohort: "pathfinder",
          payload: { wallet: { lifetimePointsEarned: 12, totalPoints: 4 } },
        },
      ],
    });
    expect(page?.error).toBeNull();
    if (!page || page.error) return;
    expect(page.seats[0]?.username).toBe("amber2");
    expect(page.seats[0]?.payload).toMatchObject({
      wallet: { lifetimePointsEarned: 12 },
    });
  });

  it("waits on one Tokyo hop instead of three", () => {
    expect(classPageNetworkWaitMs(CLASS_PAGE_ROUNDS_BEFORE)).toBe(510);
    expect(classPageNetworkWaitMs(CLASS_PAGE_ROUNDS_AFTER)).toBe(170);
  });

  it("loads the class page from one definer function", () => {
    const sql = readFileSync(
      "supabase/migrations/20261015193000_load_teacher_class_page.sql",
      "utf8",
    );
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.load_teacher_class_page()");
    expect(sql).toContain("learner_progress");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.load_teacher_class_page() FROM anon");
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.load_teacher_class_page() TO authenticated",
    );
    expect(sql).not.toContain("GRANT EXECUTE ON FUNCTION public.load_teacher_class_page() TO anon");
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