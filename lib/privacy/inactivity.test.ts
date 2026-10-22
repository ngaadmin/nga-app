import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INACTIVITY_DELETE_AFTER_MS,
  INACTIVITY_WARN_AFTER_MS,
  INACTIVITY_WARNING_LEAD_MS,
  PENDING_UNAPPROVED_DELETE_AFTER_MS,
  planInactivityDeletions,
  selectInactivityActions,
  selectUnapprovedAccountDeletions,
  type ActivityAccount,
} from "@/lib/privacy/inactivity";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-20T00:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * DAY).toISOString();
}

function account(overrides: Partial<ActivityAccount> = {}): ActivityAccount {
  return {
    id: "account-1",
    username: "River",
    role: "child",
    createdAt: daysAgo(400),
    lastSignInAt: daysAgo(400),
    lastUsageAt: null,
    warningSentAt: null,
    parentId: "parent-1",
    teacherId: null,
    authEmail: "river@users.nextgenachievers.invalid",
    parentEmail: "parent@example.com",
    teacherEmail: null,
    guardianEmail: null,
    ...overrides,
  };
}

describe("selectInactivityActions", () => {
  it("warns at about 11 months and does not delete yet", () => {
    const actions = selectInactivityActions(
      [account({ lastSignInAt: daysAgo(INACTIVITY_WARN_AFTER_MS / DAY) })],
      now,
    );
    expect(actions).toEqual([
      {
        kind: "warn",
        id: "account-1",
        email: "parent@example.com",
        audience: "parent-child",
        username: "River",
      },
    ]);
  });

  it("does not warn a day earlier than 11 months", () => {
    const actions = selectInactivityActions(
      [account({ lastSignInAt: daysAgo(INACTIVITY_WARN_AFTER_MS / DAY - 1) })],
      now,
    );
    expect(actions).toEqual([]);
  });

  it("deletes at 12 months only after the warning has had 30 days", () => {
    const warned = account({
      lastSignInAt: daysAgo(INACTIVITY_DELETE_AFTER_MS / DAY),
      warningSentAt: daysAgo(INACTIVITY_WARNING_LEAD_MS / DAY),
    });
    expect(selectInactivityActions([warned], now)).toEqual([
      {
        kind: "delete",
        id: "account-1",
        role: "child",
        username: "River",
        parentId: "parent-1",
        teacherId: null,
      },
    ]);

    const justWarned = account({
      lastSignInAt: daysAgo(400),
      warningSentAt: daysAgo(1),
    });
    expect(selectInactivityActions([justWarned], now)).toEqual([]);
  });

  it("does not send a second warning while the first one still stands", () => {
    const actions = selectInactivityActions(
      [
        account({
          lastSignInAt: daysAgo(340),
          warningSentAt: daysAgo(6),
        }),
      ],
      now,
    );
    expect(actions).toEqual([]);
  });

  it("clears the warning when the account is active again", () => {
    const actions = selectInactivityActions(
      [
        account({
          lastSignInAt: daysAgo(2),
          lastUsageAt: daysAgo(1),
          warningSentAt: daysAgo(20),
        }),
      ],
      now,
    );
    expect(actions).toEqual([{ kind: "reset", id: "account-1" }]);
  });

  it("can warn again after activity cleared the previous warning", () => {
    const actions = selectInactivityActions(
      [
        account({
          lastUsageAt: daysAgo(INACTIVITY_WARN_AFTER_MS / DAY),
          warningSentAt: null,
        }),
      ],
      now,
    );
    expect(actions.map((action) => action.kind)).toEqual(["warn"]);
  });

  it("emails the teacher for a class seat and never the student address", () => {
    const actions = selectInactivityActions(
      [
        account({
          id: "seat-1",
          username: "Birch7",
          parentId: null,
          teacherId: "teacher-1",
          authEmail: "birch7@school.example",
          parentEmail: null,
          teacherEmail: "teacher@school.example",
          lastSignInAt: daysAgo(340),
        }),
      ],
      now,
    );
    expect(actions).toEqual([
      {
        kind: "warn",
        id: "seat-1",
        email: "teacher@school.example",
        audience: "teacher-seat",
        username: "Birch7",
      },
    ]);
  });

  it("deletes an account with nobody to email once it reaches 12 months", () => {
    const actions = selectInactivityActions(
      [
        account({
          parentId: null,
          parentEmail: null,
          guardianEmail: null,
          teacherEmail: null,
          authEmail: "river@users.nextgenachievers.invalid",
          lastSignInAt: daysAgo(INACTIVITY_DELETE_AFTER_MS / DAY),
        }),
      ],
      now,
    );
    expect(actions.map((action) => action.kind)).toEqual(["delete"]);
  });

  it("keeps a parent account while a linked child is still active", () => {
    const actions = selectInactivityActions(
      [
        account({
          id: "parent-1",
          username: "ParentSam",
          role: "parent_master",
          parentId: null,
          authEmail: "parent@example.com",
          parentEmail: null,
          lastSignInAt: daysAgo(500),
          warningSentAt: daysAgo(40),
        }),
        account({
          id: "child-1",
          parentId: "parent-1",
          lastUsageAt: daysAgo(3),
          warningSentAt: null,
        }),
      ],
      now,
    );
    expect(actions).toEqual([{ kind: "reset", id: "parent-1" }]);
  });

  it("leaves a never-approved learner to the 30-day clock", () => {
    const pending = account({
      accountStatus: "pending_consent",
      consentApprovedAt: null,
      createdAt: daysAgo(400),
      lastSignInAt: daysAgo(400),
      parentId: null,
      parentEmail: null,
      guardianEmail: null,
    });
    expect(selectInactivityActions([pending], now)).toEqual([]);
  });

  it("treats recent usage as activity even when the last sign-in is old", () => {
    const actions = selectInactivityActions(
      [
        account({
          lastSignInAt: daysAgo(400),
          lastUsageAt: daysAgo(4),
        }),
      ],
      now,
    );
    expect(actions).toEqual([]);
  });
});

describe("selectUnapprovedAccountDeletions", () => {
  it("deletes a never-approved learner 30 days after the account was created", () => {
    const pending = account({
      accountStatus: "pending_consent",
      consentApprovedAt: null,
      createdAt: daysAgo(PENDING_UNAPPROVED_DELETE_AFTER_MS / DAY),
      lastSignInAt: daysAgo(1),
      parentId: null,
      parentEmail: "parent@example.com",
    });
    expect(selectUnapprovedAccountDeletions([pending], now)).toEqual([
      {
        kind: "standalone",
        userId: "account-1",
        username: "River",
      },
    ]);
  });

  it("deletes a declined learner on the same 30-day clock", () => {
    const declined = account({
      accountStatus: "declined",
      consentApprovedAt: null,
      createdAt: daysAgo(PENDING_UNAPPROVED_DELETE_AFTER_MS / DAY),
      parentId: null,
    });
    expect(selectUnapprovedAccountDeletions([declined], now)).toEqual([
      {
        kind: "standalone",
        userId: "account-1",
        username: "River",
      },
    ]);
  });

  it("keeps a never-approved learner for 29 days", () => {
    const pending = account({
      accountStatus: "pending_consent",
      consentApprovedAt: null,
      createdAt: daysAgo(PENDING_UNAPPROVED_DELETE_AFTER_MS / DAY - 1),
      parentId: null,
    });
    expect(selectUnapprovedAccountDeletions([pending], now)).toEqual([]);
  });

  it("does not use the 30-day clock for teachers, class seats, or approved accounts", () => {
    const old = daysAgo(40);
    const rows = [
      account({
        id: "teacher-1",
        role: "teacher",
        accountStatus: "pending_consent",
        consentApprovedAt: null,
        createdAt: old,
        parentId: null,
      }),
      account({
        id: "seat-1",
        accountStatus: "pending_consent",
        consentApprovedAt: null,
        createdAt: old,
        parentId: null,
        teacherId: "teacher-1",
      }),
      account({
        id: "approved-1",
        accountStatus: "active",
        consentApprovedAt: daysAgo(10),
        createdAt: old,
        parentId: null,
      }),
      account({
        id: "dated-1",
        accountStatus: "pending_consent",
        consentApprovedAt: daysAgo(2),
        createdAt: old,
        parentId: null,
      }),
    ];
    expect(selectUnapprovedAccountDeletions(rows, now)).toEqual([]);
  });

  it("states the 30-day clock in the retention migration", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20261022120000_under16_consent_mechanics.sql"),
      "utf8",
    );
    expect(sql).toContain("deleted after 30 days");
    expect(sql).toContain("account_status");
    expect(sql).toContain("consent_approved_at");
    expect(sql).toContain("grandfathered");
    expect(sql).not.toContain("interval '12 months'");
    expect(sql).not.toMatch(/UPDATE\s+public\.profiles/i);
    expect(sql).not.toMatch(/DELETE\s+FROM\s+public\.profiles/i);
  });
});

describe("planInactivityDeletions", () => {
  it("deletes a household once, and a class with its teacher, without repeating seats", () => {
    const planned = planInactivityDeletions([
      {
        kind: "delete",
        id: "parent-1",
        role: "parent_master",
        username: "ParentSam",
        parentId: null,
        teacherId: null,
      },
      {
        kind: "delete",
        id: "child-1",
        role: "child",
        username: "River",
        parentId: "parent-1",
        teacherId: null,
      },
      {
        kind: "delete",
        id: "teacher-1",
        role: "teacher",
        username: "Teacher",
        parentId: null,
        teacherId: null,
      },
      {
        kind: "delete",
        id: "seat-1",
        role: "child",
        username: "Birch7",
        parentId: null,
        teacherId: "teacher-1",
      },
      {
        kind: "delete",
        id: "seat-2",
        role: "child",
        username: "Acorn3",
        parentId: null,
        teacherId: "teacher-2",
      },
    ]);

    expect(planned).toEqual([
      { kind: "household", parentId: "parent-1" },
      { kind: "teacher", teacherId: "teacher-1" },
      { kind: "class-seat", teacherId: "teacher-2", username: "Acorn3" },
    ]);
  });
});
