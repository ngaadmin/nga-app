import { describe, expect, it } from "vitest";
import type { UserSession } from "@/lib/onboarding/guest-session";
import {
  displayAccountIdentity,
  TEACHER_IDENTITY_FALLBACK,
} from "@/lib/onboarding/registered-accounts";

const TEACHER_EMAIL = "cath+recteacher1@example.com";

function session(overrides: Partial<UserSession>): UserSession {
  return {
    accessMode: "registered",
    username: "teachertest",
    ageTier: "pathfinder",
    createdAt: "2026-01-01T00:00:00.000Z",
    accountRole: "teacher",
    isTeacher: true,
    learnerEmail: TEACHER_EMAIL,
    email: TEACHER_EMAIL,
    ...overrides,
  };
}

describe("displayAccountIdentity", () => {
  it("uses a teacher's public username and never the email", () => {
    expect(
      displayAccountIdentity(session({ username: "MsCath" })),
    ).toBe("MsCath");
    expect(
      displayAccountIdentity(session({ username: TEACHER_EMAIL })),
    ).toBe(TEACHER_IDENTITY_FALLBACK);
    expect(displayAccountIdentity(session({ username: TEACHER_EMAIL }))).not.toContain(
      "@",
    );
  });

  it("uses Teacher when the only stored name is a stub or missing", () => {
    expect(
      displayAccountIdentity(
        session({ username: "uaaaaaaaaaaaaaaaaaaa" }),
      ),
    ).toBe("Teacher");
    expect(
      displayAccountIdentity(
        session({ username: "tbbbbbbbbbbbbbbbbbbb" }),
      ),
    ).toBe("Teacher");
    expect(displayAccountIdentity(session({ username: "  " }))).toBe("Teacher");
  });

  it("keeps a parent display name and falls back to Parent, not the email", () => {
    expect(
      displayAccountIdentity(
        session({
          accountRole: "parent_master",
          isTeacher: false,
          username: "Alex",
        }),
      ),
    ).toBe("Alex");
    expect(
      displayAccountIdentity(
        session({
          accountRole: "parent_master",
          isTeacher: false,
          username: "pccccccccccccccccccc",
          learnerEmail: "parent@example.com",
          email: "parent@example.com",
        }),
      ),
    ).toBe("Parent");
  });

  it("still shows a learner username", () => {
    expect(
      displayAccountIdentity(
        session({
          accountRole: "child",
          isTeacher: false,
          username: "amber2",
          learnerEmail: undefined,
          email: undefined,
        }),
      ),
    ).toBe("amber2");
  });
});
