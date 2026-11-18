// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExplorerPendingConsentView } from "@/components/onboarding/explorer-pending-consent-view";
import { copyMatrix } from "@/constants/copyMatrix";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  markExplorerPendingPlayAllowed: vi.fn(),
  signOutApp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/onboarding/sign-out", () => ({
  signOutApp: mocks.signOutApp,
}));

vi.mock("@/lib/onboarding/explorer-pending-consent", () => ({
  markExplorerPendingPlayAllowed: mocks.markExplorerPendingPlayAllowed,
}));

vi.mock("@/lib/onboarding/parent-consent-pending", () => ({
  findLocalPendingForUsername: () => null,
  resendParentConsentApproval: vi.fn(),
}));

vi.mock("@/lib/onboarding/resend-explorer-pending-approval", () => ({
  resendExplorerPendingApprovalEmail: vi.fn(),
}));

const copy = copyMatrix.onboarding.pendingConsent;

afterEach(() => {
  cleanup();
  mocks.push.mockReset();
  mocks.refresh.mockReset();
  mocks.markExplorerPendingPlayAllowed.mockReset();
  mocks.signOutApp.mockReset();
});

describe("ExplorerPendingConsentView", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.markExplorerPendingPlayAllowed.mockReset();
    mocks.signOutApp.mockReset();
  });

  it("shows Storybird's pending copy and keeps Resend on the return gate", () => {
    render(<ExplorerPendingConsentView approved={false} session={null} />);

    expect(screen.getByRole("heading", { name: copy.heading })).toBeTruthy();
    expect(screen.getByText(copy.body)).toBeTruthy();
    expect(screen.getByRole("button", { name: copy.resend })).toBeTruthy();
    expect(screen.getByRole("button", { name: copy.logOut })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Back to login" })).toBeNull();
  });

  it("leaves approved-state copy unchanged", () => {
    render(<ExplorerPendingConsentView approved session={null} />);

    expect(
      screen.getByRole("heading", { name: copy.headingApproved }),
    ).toBeTruthy();
    expect(screen.getByText(copy.bodyApproved)).toBeTruthy();
    expect(screen.getByRole("button", { name: copy.continue })).toBeTruthy();
  });

  it("takes a pending learner to the Academy without signing out", () => {
    render(<ExplorerPendingConsentView approved={false} session={null} />);

    fireEvent.click(screen.getByRole("button", { name: copy.logOut }));

    expect(mocks.markExplorerPendingPlayAllowed).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith(DASHBOARD_ACADEMY_PATH);
    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.signOutApp).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("keeps the just-submitted Keep playing button on the Academy path", () => {
    render(
      <ExplorerPendingConsentView
        approved={false}
        session={null}
        variant="justSubmitted"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.keepPlaying }));

    expect(mocks.markExplorerPendingPlayAllowed).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith(DASHBOARD_ACADEMY_PATH);
    expect(mocks.signOutApp).not.toHaveBeenCalled();
  });
});

describe("Storybird pending-consent copy", () => {
  it("keeps the waiting-screen strings exact", () => {
    expect(copy.heading).toBe("Waiting for a parent's OK");
    expect(copy.body).toBe(
      "You can keep playing in the Academy while you wait! Your coins will start saving once a parent approves your account.",
    );
    expect(copy.logOut).toBe("Back to the Academy");
    expect(copy.resend).toBe("Resend approval email");
    expect(copy.headingApproved).toBe("You're cleared to play!");
    expect(copy.bodyApproved).toBe(
      "Your parent or guardian said yes. Pick up right where you left off.",
    );
  });
});
