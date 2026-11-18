import { describe, expect, it } from "vitest";
import {
  launchpadLearnerMayEnterProfile,
  launchpadLearnerRoleAllowed,
} from "@/lib/launchpad/learner-access";

describe("launchpadLearnerMayEnterProfile", () => {
  it("denies a pending child, including one still allowed to play Academy", () => {
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: "child",
        accountStatus: "pending_consent",
      }),
    ).toBe(false);
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: "child",
        accountStatus: "PENDING_CONSENT",
      }),
    ).toBe(false);
  });

  it("denies a declined child", () => {
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: "child",
        accountStatus: "declined",
      }),
    ).toBe(false);
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: "child",
        accountStatus: "DECLINED",
      }),
    ).toBe(false);
  });

  it("allows an active under-16 child after a parent approved", () => {
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: "child",
        accountStatus: "active",
      }),
    ).toBe(true);
  });

  it("allows a 16+ child whose account is already active", () => {
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: "child",
        accountStatus: "ACTIVE",
      }),
    ).toBe(true);
  });

  it("denies a parent, a teacher, and a guest", () => {
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: "parent_master",
        accountStatus: "active",
      }),
    ).toBe(false);
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: "teacher",
        accountStatus: "active",
      }),
    ).toBe(false);
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: null,
        accountStatus: "active",
      }),
    ).toBe(false);
    expect(launchpadLearnerMayEnterProfile({})).toBe(false);
    expect(launchpadLearnerRoleAllowed(undefined)).toBe(false);
  });

  it("fails closed when a child has no account status", () => {
    expect(
      launchpadLearnerMayEnterProfile({
        accountRole: "child",
        accountStatus: null,
      }),
    ).toBe(false);
    expect(launchpadLearnerMayEnterProfile({ accountRole: "child" })).toBe(false);
  });
});
