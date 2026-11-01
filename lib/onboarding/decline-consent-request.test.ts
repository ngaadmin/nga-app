import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
const childRow = {
  value: {
    id: "child-1",
    account_role: "child",
    account_status: "pending_consent",
    consent_approved_at: null,
  } as Record<string, unknown> | null,
};

function chain(table: string) {
  const builder = {
    select: () => builder,
    update: (patch: Record<string, unknown>) => {
      calls.push(`update:${table}:${JSON.stringify(patch)}`);
      return builder;
    },
    eq: () => builder,
    maybeSingle: async () => ({ data: table === "profiles" ? childRow.value : null }),
    then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => chain(table) }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/email/resend-client", () => ({ sendOnboardingEmail: vi.fn() }));
vi.mock("@/lib/onboarding/lookup-consent-request", () => ({
  lookupConsentRequestByToken: vi.fn(async (token: string) =>
    token === "good"
      ? {
          status: "valid",
          request: { id: "request-1", childId: "child-1", childUsername: "River" },
        }
      : { status: "invalid" },
  ),
}));
const deleteDeclinedLearner = vi.fn();
vi.mock("@/lib/privacy/delete-declined-learner", () => ({
  deleteDeclinedLearner: (childId: string) => {
    calls.push(`delete:${childId}`);
    return deleteDeclinedLearner(childId);
  },
}));

const { declineConsentRequest } = await import("@/lib/onboarding/approve-consent-request");

beforeEach(() => {
  calls.length = 0;
  deleteDeclinedLearner.mockReset();
  deleteDeclinedLearner.mockResolvedValue({ deleted: true });
  childRow.value = {
    id: "child-1",
    account_role: "child",
    account_status: "pending_consent",
    consent_approved_at: null,
  };
});

describe("declineConsentRequest (runs after the parent confirms)", () => {
  it("marks the learner declined, then deletes only that learner once", async () => {
    const result = await declineConsentRequest("good");
    expect(result).toEqual({ success: true, childUsername: "River", deleted: true });
    expect(deleteDeclinedLearner).toHaveBeenCalledTimes(1);
    expect(deleteDeclinedLearner).toHaveBeenCalledWith("child-1");
    const deleteAt = calls.indexOf("delete:child-1");
    const markAt = calls.findIndex((c) => c.startsWith("update:profiles:"));
    expect(markAt).toBeGreaterThanOrEqual(0);
    expect(deleteAt).toBeGreaterThan(markAt);
  });

  it("still reports the decline when the delete step fails", async () => {
    deleteDeclinedLearner.mockResolvedValueOnce({ deleted: false, reason: "failed" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await declineConsentRequest("good");
    expect(result).toEqual({ success: true, childUsername: "River", deleted: false });
    error.mockRestore();
  });

  it("never deletes an approved learner", async () => {
    childRow.value = { ...childRow.value, account_status: "active" };
    const result = await declineConsentRequest("good");
    expect(result.success).toBe(false);
    expect(deleteDeclinedLearner).not.toHaveBeenCalled();
  });

  it("never deletes on a bad link", async () => {
    const result = await declineConsentRequest("bad");
    expect(result.success).toBe(false);
    expect(deleteDeclinedLearner).not.toHaveBeenCalled();
  });
});
