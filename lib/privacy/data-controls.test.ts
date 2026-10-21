import { describe, expect, it } from "vitest";
import {
  assembleLearnerView,
  authorizeLeaderboardWrite,
  authorizeLearnerRead,
  authorizeManagerRead,
  buildClassCsv,
  buildLearnerDataFile,
  buildParentDataFile,
  buildParentHistory,
  buildRecentActivity,
  buildTeacherDataFile,
  classExportRowFromProgress,
  countStoredMedals,
  deleteTeacherPhraseAccepted,
  formatStudentLoginSummary,
  historySummary,
  leaderboardEnabledFromRow,
  resolveLeaderboardView,
  type DataActor,
} from "@/lib/privacy/data-controls";
import { deleteTeacherAccount } from "@/lib/privacy/delete-teacher-account";
import {
  clearGuestProgressFromStores,
  guestProgressClearKeepsSession,
  GUEST_PROGRESS_STORAGE_KEYS,
} from "@/lib/privacy/clear-guest-progress";
import {
  readParentDataGrant,
  signParentDataGrant,
} from "@/lib/privacy/parent-data-grant";

const parent: DataActor = {
  role: "parent_master",
  userId: "parent-1",
  linkedChildIds: ["child-a"],
};
const otherParent: DataActor = {
  role: "parent_master",
  userId: "parent-2",
  linkedChildIds: ["child-b"],
};
const teacher: DataActor = {
  role: "teacher",
  userId: "teacher-1",
  seatIds: ["seat-1"],
};
const otherTeacher: DataActor = {
  role: "teacher",
  userId: "teacher-2",
  seatIds: ["seat-9"],
};
const child: DataActor = { role: "child", userId: "child-a" };

describe("authorise account data", () => {
  it("lets a parent read only their linked child", () => {
    expect(authorizeLearnerRead(parent, "child-a")).toBe(true);
    expect(authorizeLearnerRead(parent, "child-b")).toBe(false);
    expect(authorizeLearnerRead(otherParent, "child-a")).toBe(false);
  });

  it("lets a teacher read only their own class seats", () => {
    expect(authorizeLearnerRead(teacher, "seat-1")).toBe(true);
    expect(authorizeLearnerRead(teacher, "seat-9")).toBe(false);
    expect(authorizeLearnerRead(otherTeacher, "seat-1")).toBe(false);
  });

  it("lets a child read only their own record", () => {
    expect(authorizeLearnerRead(child, "child-a")).toBe(true);
    expect(authorizeLearnerRead(child, "child-b")).toBe(false);
    expect(authorizeLearnerRead({ role: "guest" }, "child-a")).toBe(false);
  });

  it("lets a parent or teacher read only their own manager record", () => {
    expect(authorizeManagerRead(parent, "parent-1")).toBe(true);
    expect(authorizeManagerRead(parent, "parent-2")).toBe(false);
    expect(authorizeManagerRead(teacher, "teacher-1")).toBe(true);
    expect(authorizeManagerRead(teacher, "teacher-2")).toBe(false);
    expect(authorizeManagerRead(child, "child-a")).toBe(false);
  });

  it("lets a parent switch only a linked child, and a teacher only their class", () => {
    expect(authorizeLeaderboardWrite(parent, "child-a")).toBe(true);
    expect(authorizeLeaderboardWrite(parent, "child-b")).toBe(false);
    expect(authorizeLeaderboardWrite(teacher, "teacher-1")).toBe(true);
    expect(authorizeLeaderboardWrite(teacher, "seat-1")).toBe(false);
    expect(authorizeLeaderboardWrite(child, "child-a")).toBe(false);
  });
});

describe("leaderboard default", () => {
  it("stays off until a row is explicitly on", () => {
    expect(leaderboardEnabledFromRow(null)).toBe(false);
    expect(leaderboardEnabledFromRow(undefined)).toBe(false);
    expect(leaderboardEnabledFromRow({ enabled: false })).toBe(false);
    expect(leaderboardEnabledFromRow({ enabled: true })).toBe(true);
  });

  it("shows the ask button only for a home child whose board is off", () => {
    expect(resolveLeaderboardView({ audience: "home", enabled: false })).toEqual({
      visible: false,
      askButton: true,
    });
    expect(resolveLeaderboardView({ audience: "home", enabled: true })).toEqual({
      visible: true,
      askButton: false,
    });
    expect(resolveLeaderboardView({ audience: "school", enabled: false })).toEqual({
      visible: false,
      askButton: false,
    });
    expect(resolveLeaderboardView({ audience: "school", enabled: true }).visible).toBe(
      true,
    );
    expect(resolveLeaderboardView({ audience: "guest", enabled: true })).toEqual({
      visible: false,
      askButton: false,
    });
    expect(resolveLeaderboardView({ audience: "manager", enabled: true })).toEqual({
      visible: false,
      askButton: false,
    });
  });
});

describe("download files", () => {
  const secrets = {
    parent_pin_hash: "hash",
    class_password: "yellow-tiger",
    class_password_enc: "v1.secret",
    token_hash: "tok",
    password: "nope",
    nested: { refresh_token: "abc", username: "delta4" },
  };

  it("drops secrets from a child's data file", () => {
    const file = buildLearnerDataFile({
      profile: { username: "delta4", ...secrets },
      learnerProgress: { wallet: { totalPoints: 480 }, parentPinHash: "x" },
      usageEvents: [{ event_type: "login", access_token: "hide" }],
      consentRecords: [{ kind: "vpc", token_hash: "hide-me", status: "approved" }],
    });
    const serialized = JSON.stringify(file);
    expect(serialized).toContain("delta4");
    expect(serialized).toContain("480");
    expect(serialized).toContain("approved");
    expect(serialized).not.toContain("hash");
    expect(serialized).not.toContain("yellow-tiger");
    expect(serialized).not.toContain("v1.secret");
    expect(serialized).not.toContain("tok");
    expect(serialized).not.toContain("nope");
    expect(serialized).not.toContain("hide");
    expect(serialized).not.toContain("hide-me");
    expect(file.profile).toEqual({ username: "delta4", nested: { username: "delta4" } });
  });

  it("keeps a parent file to email, children and consent history", () => {
    const file = buildParentDataFile({
      email: "sam.parent@example.com",
      linkedChildren: [
        { userId: "child-a", username: "delta4", track: "Explorer · Ages 10-13" },
      ],
      consentHistory: [{ title: "Gave consent for delta4", token_hash: "no" }],
    });
    expect(file.email).toBe("sam.parent@example.com");
    expect(file.linkedChildren).toEqual([
      { userId: "child-a", username: "delta4", track: "Explorer · Ages 10-13" },
    ]);
    expect(JSON.stringify(file)).not.toContain("token_hash");
    expect(JSON.stringify(file)).not.toContain("\"no\"");
  });

  it("keeps a teacher file free of class passwords", () => {
    const file = buildTeacherDataFile({
      username: "ms_rivera",
      email: "j.rivera@school.example",
      classes: [
        {
          name: "Explorer class",
          students: [{ userId: "seat-1", username: "raven3" }],
        },
      ],
      history: [{ title: "Made Explorer class", class_password: "secret" }],
    });
    const serialized = JSON.stringify(file);
    expect(serialized).toContain("ms_rivera");
    expect(serialized).toContain("raven3");
    expect(serialized).toContain("studentCount");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("class_password");
  });

  it("exports a class CSV without passwords or emails", () => {
    const csv = buildClassCsv([
      classExportRowFromProgress({
        username: "raven3",
        track: "Explorer",
        progress: {
          wallet: { totalPoints: 210, lifetimePointsEarned: 980 },
          academyProgress: [{ status: "completed" }, { status: "active" }],
          skillProgress: { a: "gold", b: "bronze" },
          dayStreak: 2,
          vaultProfile: {
            jarBalances: { "save-jar": 0, "spend-jar": 0, "give-jar": 0, "emergencies-jar": 0 },
          },
        },
      }),
    ]);
    expect(csv.split("\n")[0]).toBe(
      "username,track,lessons_done,coins,lifetime_xp,bronze_medals,silver_medals,gold_medals,day_streak,save,spend,give,emergency",
    );
    expect(csv).toContain("raven3,Explorer,1,210,980,2,1,1,2,0,0,0,0");
    expect(csv.toLowerCase()).not.toContain("password");
    expect(csv).not.toContain("@");
  });
});

describe("learner view numbers", () => {
  it("counts medals cumulatively and keeps coins apart from lifetime XP", () => {
    expect(countStoredMedals({ a: "gold", b: "silver", c: "bronze", d: "locked" })).toEqual({
      bronze: 3,
      silver: 2,
      gold: 1,
    });
    const view = assembleLearnerView({
      userId: "child-a",
      username: "delta4",
      trackLabel: "Explorer · Ages 10-13",
      linkedParentEmail: "sam.parent@example.com",
      progress: {
        academyProgress: [{ status: "completed" }, { status: "completed" }],
        wallet: { totalPoints: 480, lifetimePointsEarned: 1250 },
        skillProgress: { a: "bronze" },
        dayStreak: 4,
        vaultProfile: {
          jarBalances: { "save-jar": 20, "spend-jar": 8.5, "give-jar": 4, "emergencies-jar": 6 },
          savingsGoals: [{ name: "New bike", emoji: "🚲", balance: 40, targetAmount: 120 }],
        },
      },
      bestStreakFromEvents: 9,
      activity: [],
      leaderboardEnabled: false,
    });
    expect(view.coins).toBe(480);
    expect(view.lifetimeXp).toBe(1250);
    expect(view.lessonsDone).toBe(2);
    expect(view.bestStreak).toBe(9);
    expect(view.jars.map((jar) => jar.name)).toEqual(["Save", "Spend", "Give", "Emergency"]);
    expect(view.goals[0]).toMatchObject({ name: "New bike", balance: 40, target: 120 });
    expect(view.leaderboardEnabled).toBe(false);
  });
});

describe("history and activity copy", () => {
  it("builds parent consent history and a latest line", () => {
    const entries = buildParentHistory({
      accountCreatedAt: "2026-09-03T00:00:00.000Z",
      consents: [
        {
          at: "2026-09-03T01:00:00.000Z",
          username: "delta4",
          trackLabel: "Explorer · Ages 10-13",
        },
      ],
      events: [
        {
          at: "2026-10-12T00:00:00.000Z",
          title: "Leaderboard kept off",
          detail: "For delta4 and sky7",
        },
      ],
    });
    expect(entries.map((entry) => entry.title)).toEqual([
      "Made a parent account",
      "Gave consent for delta4",
      "Leaderboard kept off",
    ]);
    expect(historySummary(entries)).toBe("Latest: 12 Oct 2026, Leaderboard kept off");
  });

  it("lists recent activity with coins and XP kept apart", () => {
    const rows = buildRecentActivity({
      now: new Date("2026-10-20T12:00:00"),
      usageEvents: [
        {
          createdAt: "2026-10-20T09:00:00",
          eventType: "lesson_completed",
          metadata: { skill: "Catch Impulse Spending" },
        },
        {
          createdAt: "2026-10-17T09:00:00",
          eventType: "medal_earned",
          metadata: { tier: "bronze", skill: "Choose Needs Over Wants" },
        },
      ],
      walletSpends: [{ at: "2026-10-19T09:00:00", points: 150 }],
      vaultMoves: [{ at: "2026-10-18T09:00:00", title: "Moved $5.00 to Save" }],
    });
    expect(rows.map((row) => row.title)).toEqual([
      "Finished a lesson",
      "Cashed in 150 coins",
      "Moved $5.00 to Save",
      "Bronze medal",
    ]);
    expect(rows.map((row) => row.when)).toEqual(["Today", "Yesterday", "18 Oct", "17 Oct"]);
    expect(rows.some((row) => /xp/i.test(row.title) && /coin/i.test(row.title))).toBe(false);
  });

  it("shows the first six student names and the rest as a count", () => {
    const many = Array.from({ length: 30 }, (_, index) => `raven${index + 1}`);
    expect(formatStudentLoginSummary(many)).toBe(
      "raven1, raven2, raven3, raven4, raven5, raven6 and 24 more",
    );
    expect(
      formatStudentLoginSummary(["raven2", "raven3", "raven4", "raven5", "raven7", "raven9"]),
    ).toBe("raven2, raven3, raven4, raven5, raven7 and raven9");
  });
});

describe("delete teacher cascade", () => {
  function admin(overrides?: { failSeat?: boolean }) {
    const calls: string[] = [];
    return {
      calls,
      port: {
        async loadTeacher() {
          calls.push("loadTeacher");
          return { ok: true as const, username: "ms_rivera" };
        },
        async listOwnedSeats() {
          calls.push("listOwnedSeats");
          return {
            ok: true as const,
            seats: [
              { id: "seat-1", username: "raven2", accountRole: "child" },
              { id: "seat-2", username: "raven3", accountRole: "child" },
            ],
          };
        },
        async deleteProgress(userId: string) {
          calls.push(`progress:${userId}`);
          if (overrides?.failSeat && userId === "seat-2") {
            return { ok: false as const, error: "db" };
          }
          return { ok: true as const };
        },
        async deleteUsageEvents(username: string) {
          calls.push(`usage:${username}`);
          return { ok: true as const };
        },
        async deleteAuthUser(userId: string) {
          calls.push(`auth:${userId}`);
          return { ok: true as const };
        },
        async deleteTeacherUsage(username: string) {
          calls.push(`teacher-usage:${username}`);
          return { ok: true as const };
        },
        async deleteTeacherAuth(teacherId: string) {
          calls.push(`teacher-auth:${teacherId}`);
          return { ok: true as const };
        },
      },
    };
  }

  it("rejects anything other than the exact word DELETE and touches nothing", async () => {
    const harness = admin();
    expect(deleteTeacherPhraseAccepted("delete")).toBe(false);
    const result = await deleteTeacherAccount(harness.port, "teacher-1", "delete");
    expect(result.ok).toBe(false);
    expect(harness.calls).toEqual([]);
  });

  it("deletes every student login, then the teacher activity and login", async () => {
    const harness = admin();
    const result = await deleteTeacherAccount(harness.port, "teacher-1", "DELETE");
    expect(result).toEqual({ ok: true, removedStudents: ["raven2", "raven3"] });
    expect(harness.calls).toEqual([
      "loadTeacher",
      "listOwnedSeats",
      "progress:seat-1",
      "usage:raven2",
      "auth:seat-1",
      "progress:seat-2",
      "usage:raven3",
      "auth:seat-2",
      "teacher-usage:ms_rivera",
      "teacher-auth:teacher-1",
    ]);
  });

  it("stops before the teacher login if a student delete fails", async () => {
    const harness = admin({ failSeat: true });
    const result = await deleteTeacherAccount(harness.port, "teacher-1", "DELETE");
    expect(result.ok).toBe(false);
    expect(harness.calls).not.toContain("teacher-auth:teacher-1");
  });
});

describe("guest progress clear", () => {
  it("clears progress keys and keeps the guest session", () => {
    expect(guestProgressClearKeepsSession()).toBe(true);
    expect(GUEST_PROGRESS_STORAGE_KEYS).not.toContain("nga_guest_session");
    const removed: string[] = [];
    clearGuestProgressFromStores({
      removeItem(key: string) {
        removed.push(key);
      },
    });
    expect(removed).toContain("nga_dashboard_wallet_v2");
    expect(removed).toContain("nga_vault_profile_v1");
    expect(removed).toContain("nga_learning_streak_v1");
    expect(removed).not.toContain("nga_guest_session");
  });
});

describe("parent data grant", () => {
  it("accepts a fresh grant for that parent and rejects a tampered one", () => {
    process.env.NGA_TOKEN_SECRET = "test-secret";
    const token = signParentDataGrant("parent-1", 1_000);
    expect(readParentDataGrant(token, 1_000)?.userId).toBe("parent-1");
    expect(readParentDataGrant(token, 1_000 + 16 * 60 * 1000)).toBeNull();
    expect(readParentDataGrant(`${token}x`, 1_000)).toBeNull();
  });
});
