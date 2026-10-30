import { beforeEach, describe, expect, it, vi } from "vitest";

const sendOnboardingEmail = vi.fn(async (input: unknown) => ({
  input,
  success: true as const,
  simulated: true,
}));
vi.mock("@/lib/email/resend-client", () => ({
  sendOnboardingEmail: (input: unknown) => sendOnboardingEmail(input),
}));

const lookupConsentRequestByToken = vi.fn();
const rotateConsentRequestToken = vi.fn(async () => true);
vi.mock("@/lib/onboarding/lookup-consent-request", () => ({
  lookupConsentRequestByToken: (...args: unknown[]) =>
    lookupConsentRequestByToken(...args),
  rotateConsentRequestToken: (...args: unknown[]) =>
    rotateConsentRequestToken(...(args as [])),
}));

vi.mock("@/lib/auth/request-guard", () => ({
  authorizeBrowserMutation: () => ({ ok: true }),
  clientIpKey: () => "test-ip",
}));
vi.mock("@/lib/auth/rate-limit", () => ({
  consumeRateLimit: () => ({ allowed: true }),
}));

import { POST } from "@/app/api/auth/consent-token/route";
import { notifyAccountDeletedChild } from "@/lib/onboarding/issue-account-deleted-email";
import { resolveSelfDeleteNoticeRecipient } from "@/lib/onboarding/self-delete-notice-recipient";
import {
  PARENT_APPROVAL_MIN_AGE,
  planLearnerSignup,
} from "@/lib/onboarding/signup-age-check";
import { resolveSignupFailureMessage } from "@/lib/onboarding/signup-failure-message";

beforeEach(() => {
  sendOnboardingEmail.mockClear();
  lookupConsentRequestByToken.mockReset();
  rotateConsentRequestToken.mockClear();
});

async function deleteOwnDeviceOnlyAccount(input: {
  householdEmail: string | null;
  account: { parentEmail?: string | null; learnerEmail?: string | null; email?: string | null };
}) {
  const recipient = resolveSelfDeleteNoticeRecipient(input);
  if (recipient) {
    await notifyAccountDeletedChild({ recipientEmail: recipient, username: "delta4" });
  }
  return recipient;
}

describe("item 15: account deleted notice recipient", () => {
  it("never emails the device-only learner's own address", async () => {
    const recipient = await deleteOwnDeviceOnlyAccount({
      householdEmail: null,
      account: { learnerEmail: "kid@example.com", email: "kid@example.com" },
    });
    expect(recipient).toBeNull();
    expect(sendOnboardingEmail).not.toHaveBeenCalled();
  });

  it("emails the linked parent where one exists", async () => {
    await deleteOwnDeviceOnlyAccount({
      householdEmail: null,
      account: { parentEmail: "Parent@Example.com", learnerEmail: "kid@example.com" },
    });
    expect(sendOnboardingEmail).toHaveBeenCalledTimes(1);
    expect(sendOnboardingEmail.mock.calls[0]?.[0]).toMatchObject({
      type: "ACCOUNT_DELETED_CHILD",
      recipientEmail: "parent@example.com",
    });
  });

  it("prefers the household (parent) email", () => {
    expect(
      resolveSelfDeleteNoticeRecipient({
        householdEmail: "home@example.com",
        account: { parentEmail: "parent@example.com" },
      }),
    ).toBe("home@example.com");
  });
});

function resendRequest() {
  return new Request("https://preview.example/api/auth/consent-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "resend", token: "tok" }),
  });
}

describe("item 18: resend approval for every under-16 track", () => {
  it.each(["explorer", "pathfinder", "maverick"] as const)(
    "resends for an under-16 %s",
    async (cohort) => {
      lookupConsentRequestByToken.mockResolvedValue({
        status: "valid",
        request: {
          id: "req-1",
          kind: "vpc",
          parentEmail: "parent@example.com",
          childUsername: "River",
          cohort,
        },
      });
      const response = await POST(resendRequest());
      const body = (await response.json()) as { success: boolean };
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(sendOnboardingEmail).toHaveBeenCalledTimes(1);
      const call = sendOnboardingEmail.mock.calls[0]?.[0] as {
        type: string;
        data: { track: string };
      };
      expect(call.type).toBe("EXPLORER_PARENT");
      expect(call.data.track).toBe(cohort);
    },
  );

  it("a non-approval request gets a cohort-neutral error and no email", async () => {
    lookupConsentRequestByToken.mockResolvedValue({
      status: "valid",
      request: {
        id: "req-2",
        kind: "parent_claim",
        parentEmail: "parent@example.com",
        childUsername: "River",
        cohort: "pathfinder",
      },
    });
    const response = await POST(resendRequest());
    const body = (await response.json()) as { success: boolean; error: string };
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe(
      "Parent approval resend is only available for profiles waiting for parent approval.",
    );
    expect(body.error).not.toMatch(/explorer|pathfinder|maverick/i);
    expect(sendOnboardingEmail).not.toHaveBeenCalled();
  });

  it("an under-16 Pathfinder sign-up failure does not say Explorer", () => {
    const message = resolveSignupFailureMessage(new Error(""), {
      isExplorer: false,
      needsParentApproval: true,
    });
    expect(message).toBe(
      "We could not start parent approval for this profile. Check your details and try again.",
    );
  });

  it("a 16+ Explorer sign-up failure does not mention parent approval", () => {
    expect(
      resolveSignupFailureMessage(new Error(""), {
        isExplorer: true,
        needsParentApproval: false,
      }),
    ).toBe("We could not create your profile. Check your details and try again.");
  });

  it("the approval link error never names a cohort", () => {
    for (const isExplorer of [true, false]) {
      const message = resolveSignupFailureMessage(
        new Error("consent token signature mismatch"),
        { isExplorer, needsParentApproval: true },
      );
      expect(message).toBe(
        "We could not verify the approval link for this profile. Please try sending again.",
      );
    }
  });

  it("keeps real server errors visible (not swallowed)", () => {
    expect(
      resolveSignupFailureMessage(new Error("Please enter a valid parent email."), {
        isExplorer: false,
        needsParentApproval: true,
      }),
    ).toBe("Please enter a valid parent email.");
  });
});

describe("16-year-old Pathfinder needs no parent approval (unchanged)", () => {
  it("uses PARENT_APPROVAL_MIN_AGE = 16", () => {
    expect(PARENT_APPROVAL_MIN_AGE).toBe(16);
  });

  it("a 16-year-old Pathfinder is active with no parent email", () => {
    // Conservative age: 2026 - 2009 - 1 = 16.
    const plan = planLearnerSignup({
      pickedCohort: "pathfinder",
      birthYear: 2009,
      referenceYear: 2026,
    });
    expect(plan).toMatchObject({
      parentApprovalRequired: false,
      accountStatus: "ACTIVE",
      requiresParentEmail: false,
      sendParentConsentEmail: false,
    });
  });

  it("a 15-year-old Pathfinder still needs approval", () => {
    const plan = planLearnerSignup({
      pickedCohort: "pathfinder",
      birthYear: 2010,
      referenceYear: 2026,
    });
    expect(plan?.parentApprovalRequired).toBe(true);
  });
});
