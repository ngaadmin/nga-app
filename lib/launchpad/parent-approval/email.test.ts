import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Row = Record<string, unknown>;
const db = vi.hoisted(() => ({
  tables: {} as Record<string, Row[]>,
  sends: [] as Array<{ type: string; to: string; data: Record<string, unknown>; key?: string }>,
  sendOk: true,
}));

/** Reads `col->>key` the way PostgREST does: text of the JSON value, or null. */
function colValue(row: Row, col: string): unknown {
  const [name = "", key] = col.split("->>");
  if (!key) return row[name];
  const obj = row[name] as Record<string, unknown> | null;
  const value = obj?.[key];
  return value === undefined ? null : value;
}

function query(table: string) {
  const filters: Array<(row: Row) => boolean> = [];
  let patch: Row | null = null;
  let wantRows = false;
  let max = Infinity;
  const matching = () => (db.tables[table] ?? []).filter((r) => filters.every((f) => f(r)));
  const run = async () => {
    if (patch) {
      const rows = matching();
      rows.forEach((r) => Object.assign(r, patch));
      return { data: wantRows ? rows.map((r) => ({ id: r.id })) : null, error: null };
    }
    return { data: matching().slice(0, max), error: null };
  };
  const api: Record<string, unknown> = {
    select: () => {
      wantRows = true;
      return api;
    },
    eq: (col: string, val: unknown) => (filters.push((r) => colValue(r, col) === val), api),
    is: (col: string, val: unknown) => (filters.push((r) => colValue(r, col) === val), api),
    not: (col: string, _op: string, val: unknown) => (filters.push((r) => colValue(r, col) !== val), api),
    limit: (n: number) => ((max = n), api),
    update: (p: Row) => ((patch = p), api),
    maybeSingle: async () => ({ data: matching()[0] ?? null, error: null }),
    then: (resolve: (v: unknown) => unknown) => run().then(resolve),
  };
  return api;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: query,
    auth: {
      admin: {
        getUserById: async (id: string) => ({
          data: { user: id === "parent-1" ? { email: "Parent@Example.com" } : null },
        }),
      },
    },
  }),
}));
vi.mock("@/lib/email/resend-client", () => ({
  sendOnboardingEmail: async (input: { type: string; recipientEmail: string; data: Record<string, unknown>; idempotencyKey?: string }) => {
    if (!db.sendOk) return { success: false, error: "boom" };
    db.sends.push({ type: input.type, to: input.recipientEmail, data: input.data, key: input.idempotencyKey });
    return { success: true, simulated: false, id: "email-1" };
  },
}));
vi.mock("@/lib/launchpad/venture-test/launchpad-home-data", () => ({
  LAUNCHPAD_CATEGORIES: [{ tiles: [{ kind: "idea", ventureId: "dog-walking", name: "Dog walking" }] }],
  liveVentureIds: () => ["dog-walking"],
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { runLaunchpadApprovalEmailSweep, sendLaunchpadApprovalEmail } from "@/lib/launchpad/parent-approval/email";

const HOUR = 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();
const venture = () => (db.tables.launchpad_learner_ventures ?? [])[0] as Row;
const map = () => venture().wrap_up_confirmed_at as Record<string, string>;

function seed(wrap: Record<string, string>, linked = true) {
  db.tables = {
    launchpad_learner_ventures: [{ id: "v1", user_id: "kid-1", venture_id: "dog-walking", wrap_up_confirmed_at: wrap }],
    parent_child: linked ? [{ parent_id: "parent-1", child_id: "kid-1" }] : [],
    profiles: [{ id: "kid-1", username: "KidOne" }],
  };
}

beforeEach(() => {
  db.sends = [];
  db.sendOk = true;
});

describe("request email", () => {
  it("sends once to the linked parent and takes the marker first", async () => {
    seed({ "parent-approval-requested": iso(Date.now()) });
    const admin = createAdminClient();
    expect(await sendLaunchpadApprovalEmail(admin, { learnerId: "kid-1", ventureId: "dog-walking", kind: "request" })).toBe("sent");
    expect(db.sends).toHaveLength(1);
    expect(db.sends[0]).toMatchObject({ type: "LAUNCHPAD_PARENT_APPROVAL", to: "parent@example.com" });
    expect(db.sends[0]?.data).toMatchObject({ childUsername: "KidOne", ventureName: "Dog walking" });
    expect(map()["parent-approval-email-sent"]).toBeTruthy();
    expect(map()["parent-approval-requested"]).toBeTruthy();
    // A second call, or a double tap on the learner side, sends nothing.
    expect(await sendLaunchpadApprovalEmail(admin, { learnerId: "kid-1", ventureId: "dog-walking", kind: "request" })).toBe("skipped");
    expect(db.sends).toHaveLength(1);
  });

  it("sends nothing for an unlinked learner (no parent to email)", async () => {
    seed({ "parent-approval-requested": iso(Date.now()) }, false);
    expect(await sendLaunchpadApprovalEmail(createAdminClient(), { learnerId: "kid-1", ventureId: "dog-walking", kind: "request" })).toBe("skipped");
    expect(db.sends).toHaveLength(0);
    expect(map()["parent-approval-email-sent"]).toBeUndefined();
  });

  it("sends nothing once the parent has answered", async () => {
    seed({ "parent-approval-requested": iso(Date.now()), "parent-approval-yes": iso(Date.now()) });
    expect(await sendLaunchpadApprovalEmail(createAdminClient(), { learnerId: "kid-1", ventureId: "dog-walking", kind: "request" })).toBe("skipped");
    expect(db.sends).toHaveLength(0);
  });

  it("releases the marker when the send fails, so it can be retried", async () => {
    seed({ "parent-approval-requested": iso(Date.now()) });
    db.sendOk = false;
    expect(await sendLaunchpadApprovalEmail(createAdminClient(), { learnerId: "kid-1", ventureId: "dog-walking", kind: "request" })).toBe("failed");
    expect(map()["parent-approval-email-sent"]).toBeUndefined();
  });
});

describe("reminder sweep", () => {
  const base = Date.now() - 25 * HOUR;
  const waiting = () => ({ "parent-approval-requested": iso(base), "parent-approval-email-sent": iso(base) });

  it("sends the one reminder when the request is over 24 hours old, and never a second", async () => {
    seed(waiting());
    const admin = createAdminClient();
    expect(await runLaunchpadApprovalEmailSweep(admin)).toMatchObject({ reminderSent: 1, failed: 0 });
    expect(db.sends.map((s) => s.type)).toEqual(["LAUNCHPAD_PARENT_APPROVAL_REMINDER"]);
    expect(map()["parent-approval-reminder-sent"]).toBeTruthy();
    expect(await runLaunchpadApprovalEmailSweep(admin)).toMatchObject({ reminderSent: 0 });
    expect(await runLaunchpadApprovalEmailSweep(admin)).toMatchObject({ reminderSent: 0 });
    expect(db.sends).toHaveLength(1);
  });

  it("waits for the 24 hours", async () => {
    const recent = iso(Date.now() - 23 * HOUR);
    seed({ "parent-approval-requested": recent, "parent-approval-email-sent": recent });
    expect(await runLaunchpadApprovalEmailSweep(createAdminClient())).toMatchObject({ reminderSent: 0 });
    expect(db.sends).toHaveLength(0);
  });

  it("stops once the parent approves or says not now", async () => {
    seed({ ...waiting(), "parent-approval-yes": iso(Date.now()) });
    await runLaunchpadApprovalEmailSweep(createAdminClient());
    seed({ ...waiting(), "parent-approval-no": iso(Date.now()) });
    await runLaunchpadApprovalEmailSweep(createAdminClient());
    expect(db.sends).toHaveLength(0);
  });

  it("two jobs at the same moment still send one reminder", async () => {
    seed(waiting());
    const admin = createAdminClient();
    await Promise.all([runLaunchpadApprovalEmailSweep(admin), runLaunchpadApprovalEmailSweep(admin)]);
    expect(db.sends).toHaveLength(1);
  });

  it("puts the reminder marker back if the send fails, then retries next run", async () => {
    seed(waiting());
    db.sendOk = false;
    expect(await runLaunchpadApprovalEmailSweep(createAdminClient())).toMatchObject({ failed: 1 });
    expect(map()["parent-approval-reminder-sent"]).toBeUndefined();
    db.sendOk = true;
    expect(await runLaunchpadApprovalEmailSweep(createAdminClient())).toMatchObject({ reminderSent: 1 });
    expect(db.sends).toHaveLength(1);
  });

  it("does nothing for an unlinked learner", async () => {
    seed(waiting(), false);
    await runLaunchpadApprovalEmailSweep(createAdminClient());
    expect(db.sends).toHaveLength(0);
  });

  it("retries a request email that failed earlier (under a day old)", async () => {
    seed({ "parent-approval-requested": iso(Date.now() - 2 * HOUR) });
    expect(await runLaunchpadApprovalEmailSweep(createAdminClient())).toMatchObject({ requestSent: 1 });
    expect(db.sends.map((s) => s.type)).toEqual(["LAUNCHPAD_PARENT_APPROVAL"]);
  });
});
