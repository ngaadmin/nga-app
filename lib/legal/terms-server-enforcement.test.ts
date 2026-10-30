/**
 * Server enforcement of the Terms tick box. Every database, Auth and email
 * call is mocked. Nothing here reaches Supabase or sends mail.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type Op = { method: string; args: unknown[] };
type Call = { table: string; ops: Op[] };

const state = vi.hoisted(() => ({
  calls: [] as { table: string; ops: { method: string; args: unknown[] }[] }[],
  historyInsertError: null as null | { message: string },
  createdUserId: "new-user",
  createUser: undefined as unknown as ReturnType<typeof vi.fn>,
  deleteUser: undefined as unknown as ReturnType<typeof vi.fn>,
  createAdminClient: undefined as unknown as ReturnType<typeof vi.fn>,
  signedInUser: { id: "parent-1", email: "parent@example.com" } as
    | { id: string; email: string }
    | null,
}));

function respond(call: Call): { data: unknown; error: unknown } {
  const methods = call.ops.map((op) => op.method);
  const idEq = call.ops.find((op) => op.method === "eq" && op.args[0] === "id");
  const id = idEq?.args[1] as string | undefined;
  const update = call.ops.find((op) => op.method === "update")?.args[0] as
    | Record<string, unknown>
    | undefined;
  const insert = call.ops.find((op) => op.method === "insert")?.args[0] as
    | Record<string, unknown>
    | undefined;

  if (call.table === "account_history" && insert) {
    return { data: null, error: state.historyInsertError };
  }
  if (call.table === "parent_child") return { data: null, error: null };
  if (call.table === "consent_requests" && update) {
    return { data: { id, status: "approved" }, error: null };
  }
  if (call.table === "consent_requests") {
    return {
      data: {
        id: "req-1",
        kind: "vpc",
        status: "pending",
        child_id: "child-1",
        parent_email: "parent@example.com",
        parent_id: null,
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      },
      error: null,
    };
  }
  if (call.table === "profiles" && update) {
    return { data: { id, ...update }, error: null };
  }
  if (call.table === "profiles" && insert) {
    return { data: { id: insert.id }, error: null };
  }
  if (call.table === "profiles" && methods.includes("select")) {
    if (call.ops.some((op) => op.method === "eq" && op.args[0] === "username")) {
      return { data: null, error: null };
    }
    if (id === "child-1") {
      return {
        data: {
          id,
          username: "kid1",
          account_role: "child",
          account_status: "pending_consent",
          consent_approved_at: null,
          curriculum_cohort: "explorer",
          parent_approval_required: true,
          age_checked_at: "2026-10-01T00:00:00.000Z",
        },
        error: null,
      };
    }
    return {
      data: { id, username: "parentuser", account_role: "parent_master" },
      error: null,
    };
  }
  return { data: null, error: null };
}

function builder(table: string) {
  const call: Call = { table, ops: [] };
  state.calls.push(call);
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "gt", "in", "update", "insert", "delete"]) {
    chain[method] = (...args: unknown[]) => {
      call.ops.push({ method, args });
      return chain;
    };
  }
  chain.maybeSingle = async () => respond(call);
  chain.single = async () => respond(call);
  chain.then = (resolve: (value: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(respond(call)).then(resolve, reject);
  return chain;
}

vi.mock("@/lib/supabase/admin", () => {
  state.createUser = vi.fn(async () => ({
    data: { user: { id: state.createdUserId } },
    error: null,
  }));
  state.deleteUser = vi.fn(async () => ({ data: null, error: null }));
  state.createAdminClient = vi.fn(() => ({
    from: (table: string) => builder(table),
    auth: { admin: { createUser: state.createUser, deleteUser: state.deleteUser } },
  }));
  return { createAdminClient: state.createAdminClient };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.signedInUser } }),
      signInWithPassword: async () => ({ data: null, error: null }),
    },
  }),
}));

vi.mock("@/lib/email/resend-client", () => ({
  sendOnboardingEmail: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/onboarding/issue-guardian-signup-email", () => ({
  issueGuardianSignupEmail: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/onboarding/parent-master-lookup", () => ({
  findAuthUserIdByEmail: vi.fn(async () => null),
  findParentMasterByEmail: vi.fn(async () => ({ id: "parent-1", username: "parentuser" })),
}));

vi.mock("@/lib/onboarding/lookup-consent-request", () => ({
  lookupConsentRequestByToken: vi.fn(async () => ({
    status: "valid",
    request: {
      id: "req-1",
      kind: "vpc",
      status: "pending",
      childId: "child-1",
      childUsername: "kid1",
      parentEmail: "parent@example.com",
    },
  })),
}));

vi.mock("@/lib/school/class-password-crypto", () => ({
  readClassPasswordKey: () => Buffer.alloc(32),
  classPasswordCipherUpdate: () => ({}),
  explainClassPasswordWriteError: (message: string) => message,
}));

vi.mock("@/lib/school/class-open-token", () => ({
  signClassOpenToken: () => "signed-token",
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

import { findParentMasterByEmail } from "@/lib/onboarding/parent-master-lookup";
import { createSupabaseAccount } from "@/lib/onboarding/create-supabase-account";
import { createParentMasterAccount } from "@/lib/onboarding/create-parent-master";
import { createTeacherAccount } from "@/lib/school/create-teacher-account";
import {
  approveConsentRequest,
  approveConsentRequestInApp,
  createParentMasterAndApprove,
} from "@/lib/onboarding/approve-consent-request";
import {
  TERMS_ACCEPTANCE_TITLE,
  TERMS_NOT_FOR_CHILD_ERROR,
  TERMS_REQUIRED_ERROR,
} from "@/lib/legal/terms-consent";

function historyInserts(): Record<string, unknown>[] {
  return state.calls
    .filter((call) => call.table === "account_history")
    .flatMap((call) =>
      call.ops
        .filter((op) => op.method === "insert")
        .map((op) => op.args[0] as Record<string, unknown>),
    );
}

function consentApproved(): boolean {
  return state.calls.some(
    (call) =>
      call.table === "consent_requests" &&
      call.ops.some((op) => op.method === "update"),
  );
}

const thisYear = new Date().getFullYear();
const adultLearner = {
  username: "maya_18",
  cohort: "maverick" as const,
  password: "secret123",
  learnerEmail: "maya@example.com",
  birthYear: thisYear - 20,
};
const under16Learner = {
  username: "kid_12",
  cohort: "explorer" as const,
  password: "secret123",
  parentEmail: "parent@example.com",
  birthYear: thisYear - 12,
};

beforeEach(() => {
  state.calls.length = 0;
  state.historyInsertError = null;
  state.signedInUser = { id: "parent-1", email: "parent@example.com" };
  vi.clearAllMocks();
});

describe("16+ learner self sign-up", () => {
  it("rejects a submission without the tick", async () => {
    const result = await createSupabaseAccount({ ...adultLearner });
    expect(result).toEqual({ success: false, error: TERMS_REQUIRED_ERROR });
    expect(state.createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects termsAccepted false", async () => {
    const result = await createSupabaseAccount({ ...adultLearner, termsAccepted: false });
    expect(result).toEqual({ success: false, error: TERMS_REQUIRED_ERROR });
  });

  it("records acceptance for the learner who ticked", async () => {
    const result = await createSupabaseAccount({ ...adultLearner, termsAccepted: true });
    expect(result.success).toBe(true);
    const rows = historyInserts();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      profile_id: "new-user",
      title: TERMS_ACCEPTANCE_TITLE,
      detail: "Terms version 2026-10-30",
    });
    expect(Date.parse(String(rows[0]?.occurred_at))).not.toBeNaN();
  });

  it("removes the new user when the acceptance cannot be saved", async () => {
    state.historyInsertError = { message: "boom" };
    const result = await createSupabaseAccount({ ...adultLearner, termsAccepted: true });
    expect(result.success).toBe(false);
    expect(state.deleteUser).toHaveBeenCalledWith("new-user");
  });
});

describe("under-16 learner sign-up", () => {
  it("rejects a submission that carries a Terms value", async () => {
    for (const termsAccepted of [true, false]) {
      const result = await createSupabaseAccount({ ...under16Learner, termsAccepted });
      expect(result).toEqual({ success: false, error: TERMS_NOT_FOR_CHILD_ERROR });
    }
    expect(state.createAdminClient).not.toHaveBeenCalled();
  });

  it("still signs up without a Terms value and records nothing", async () => {
    const result = await createSupabaseAccount({ ...under16Learner });
    expect(result.success).toBe(true);
    expect(historyInserts()).toHaveLength(0);
  });

  it("treats a sticky under-16 path as under 16 even with an adult year", async () => {
    const result = await createSupabaseAccount({
      ...under16Learner,
      birthYear: thisYear - 20,
      under16PathReached: true,
      termsAccepted: true,
    });
    expect(result).toEqual({ success: false, error: TERMS_NOT_FOR_CHILD_ERROR });
  });
});

describe("child added by a parent", () => {
  it("rejects a Terms value for the child", async () => {
    const result = await createSupabaseAccount({
      username: "kid_7",
      cohort: "explorer",
      password: "secret123",
      parentInitiatedById: "parent-1",
      termsAccepted: true,
    });
    expect(result).toEqual({ success: false, error: TERMS_NOT_FOR_CHILD_ERROR });
  });
});

describe("parent account creation", () => {
  it("rejects without the tick and touches nothing", async () => {
    const result = await createParentMasterAccount({
      email: "new@example.com",
      password: "secret123",
    });
    expect(result).toEqual({ success: false, error: TERMS_REQUIRED_ERROR });
    expect(state.createAdminClient).not.toHaveBeenCalled();
  });

  it("records acceptance for the new parent", async () => {
    const result = await createParentMasterAccount({
      email: "new@example.com",
      password: "secret123",
      termsAccepted: true,
    });
    expect(result.success).toBe(true);
    expect(historyInserts()).toEqual([
      expect.objectContaining({ profile_id: "new-user", title: TERMS_ACCEPTANCE_TITLE }),
    ]);
  });

  it("removes the parent when the acceptance cannot be saved", async () => {
    state.historyInsertError = { message: "boom" };
    const result = await createParentMasterAccount({
      email: "new@example.com",
      password: "secret123",
      termsAccepted: true,
    });
    expect(result.success).toBe(false);
    expect(state.deleteUser).toHaveBeenCalledWith("new-user");
  });
});

describe("teacher sign-up", () => {
  it("rejects without the tick", async () => {
    const result = await createTeacherAccount({
      email: "teacher@example.com",
      password: "secret123",
      classCohort: "pathfinder",
    });
    expect(result).toEqual({ success: false, error: TERMS_REQUIRED_ERROR });
    expect(state.createAdminClient).not.toHaveBeenCalled();
  });

  it("records acceptance for the teacher", async () => {
    const result = await createTeacherAccount({
      email: "teacher@example.com",
      password: "secret123",
      classCohort: "pathfinder",
      termsAccepted: true,
    });
    expect(result.success).toBe(true);
    expect(historyInserts()).toEqual([
      expect.objectContaining({ profile_id: "new-user", title: TERMS_ACCEPTANCE_TITLE }),
    ]);
  });
});

describe("parent approval path", () => {
  it("approveConsentRequest rejects without the tick", async () => {
    const result = await approveConsentRequest("token");
    expect(result).toEqual({ success: false, error: TERMS_REQUIRED_ERROR });
    expect(consentApproved()).toBe(false);
  });

  it("approveConsentRequest records acceptance for the approving parent", async () => {
    const result = await approveConsentRequest("token", { termsAccepted: true });
    expect(result.success).toBe(true);
    expect(historyInserts()).toEqual([
      expect.objectContaining({ profile_id: "parent-1", title: TERMS_ACCEPTANCE_TITLE }),
    ]);
    expect(consentApproved()).toBe(true);
  });

  it("does not approve when the acceptance cannot be saved", async () => {
    state.historyInsertError = { message: "boom" };
    const result = await approveConsentRequest("token", { termsAccepted: true });
    expect(result.success).toBe(false);
    expect(consentApproved()).toBe(false);
  });

  it("createParentMasterAndApprove rejects without the tick", async () => {
    const result = await createParentMasterAndApprove({
      token: "token",
      username: "parentuser",
      password: "secret123",
    });
    expect(result).toEqual({ success: false, error: TERMS_REQUIRED_ERROR });
    expect(state.createAdminClient).not.toHaveBeenCalled();
  });

  it("createParentMasterAndApprove records acceptance with the tick", async () => {
    const result = await createParentMasterAndApprove({
      token: "token",
      username: "parentuser",
      password: "secret123",
      termsAccepted: true,
    });
    expect(result.success).toBe(true);
    expect(historyInserts()).toEqual([
      expect.objectContaining({ profile_id: "parent-1" }),
    ]);
  });

  it("createParentMasterAndApprove records acceptance for a brand-new parent", async () => {
    vi.mocked(findParentMasterByEmail).mockResolvedValueOnce(null);
    const result = await createParentMasterAndApprove({
      token: "token",
      username: "newparent",
      password: "secret123",
      termsAccepted: true,
    });
    expect(result.success).toBe(true);
    expect(state.createUser).toHaveBeenCalledTimes(1);
    expect(historyInserts()).toEqual([
      expect.objectContaining({ profile_id: "new-user", title: TERMS_ACCEPTANCE_TITLE }),
    ]);
    expect(consentApproved()).toBe(true);
  });

  it("approveConsentRequestInApp rejects without the tick", async () => {
    const result = await approveConsentRequestInApp("req-1");
    expect(result).toEqual({ success: false, error: TERMS_REQUIRED_ERROR });
    expect(state.createAdminClient).not.toHaveBeenCalled();
  });

  it("approveConsentRequestInApp records acceptance for the signed-in parent", async () => {
    const result = await approveConsentRequestInApp("req-1", { termsAccepted: true });
    expect(result.success).toBe(true);
    expect(historyInserts()).toEqual([
      expect.objectContaining({ profile_id: "parent-1", title: TERMS_ACCEPTANCE_TITLE }),
    ]);
    expect(consentApproved()).toBe(true);
  });
});
