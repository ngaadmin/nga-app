// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const server = vi.hoisted(() => ({
  loadParentTabData: vi.fn(),
  renewParentTabGatePass: vi.fn(),
}));
const data = vi.hoisted(() => ({ loadParentHubChildProgress: vi.fn() }));

vi.mock("@/lib/parent/parent-tab-server", () => server);
vi.mock("@/lib/privacy/account-data-server", () => data);
vi.mock("@/lib/onboarding/approve-consent-request", () => ({
  approveConsentRequestFromParentTab: vi.fn(),
  declineConsentRequestFromParentTab: vi.fn(),
}));
vi.mock("@/lib/dashboard/linked-child-exchange-rate", () => ({
  markLinkedChildCashInPaid: vi.fn(),
}));
vi.mock("@/lib/onboarding/registered-accounts", () => ({ upsertRegisteredAccount: vi.fn() }));
vi.mock("@/lib/dashboard/currency-context", () => ({
  useCurrency: () => ({ currencyCode: "USD" }),
}));
vi.mock("@/components/ui/modal-shell", () => ({
  ModalShell: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}));
vi.mock("@/components/parent/hub-child-page", () => ({
  HubChildPage: () => <div data-testid="child-page" />,
}));
vi.mock("@/components/parent/parent-pin-gate", () => ({
  ParentPinGate: ({ onUnlocked }: { onUnlocked: (pass: string) => void }) => (
    <button type="button" data-testid="entry-gate" onClick={() => onUnlocked("pass-1")}>
      Unlock
    </button>
  ),
}));

import { ParentTabScreen } from "@/components/parent/parent-tab-screen";

const hubData = {
  parentName: "Sam",
  messages: [],
  children: [
    { userId: "a1", username: "Zed", cohort: "explorer", status: "active", lessonsDone: 3, coins: 10 },
    { userId: "p1", username: "Amy", cohort: "explorer", status: "waiting", lessonsDone: 0, coins: 0, requestId: "r1" },
  ],
  needsOk: [
    { kind: "approval", requestId: "r1", childUsername: "Amy", childCohort: "explorer", expiresAt: "2026-11-20T00:00:00Z" },
  ],
};

async function openHub() {
  render(<ParentTabScreen parentUserId="parent-1" parentName="Sam" />);
  fireEvent.click(screen.getByTestId("entry-gate"));
  await act(async () => {});
}

beforeEach(() => {
  vi.clearAllMocks();
  server.loadParentTabData.mockResolvedValue({ ok: true, data: hubData });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ParentTabScreen", () => {
  it("shows a waiting child faded whose card opens its approval, not progress", async () => {
    await openHub();
    const card = document.querySelector("[data-parent-tab-child='Amy']")!;
    expect(card.getAttribute("data-parent-tab-child-status")).toBe("waiting");
    expect(card.textContent).toContain("Waiting for approval");
    fireEvent.click(card);
    await act(async () => {});
    expect(screen.getByText("Approve Amy's account?")).toBeTruthy();
    expect(data.loadParentHubChildProgress).not.toHaveBeenCalled();
  });

  it("asks for the PIN at entry only and keeps an open Hub's pass fresh", async () => {
    vi.useFakeTimers();
    server.renewParentTabGatePass
      .mockResolvedValueOnce({ ok: true, pass: "pass-2" })
      .mockResolvedValueOnce({ ok: true, pass: "pass-3" });
    await openHub();
    expect(screen.queryByTestId("entry-gate")).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(4 * 60 * 1000);
    });
    expect(server.renewParentTabGatePass).toHaveBeenLastCalledWith("pass-1");
    await act(async () => {
      vi.advanceTimersByTime(4 * 60 * 1000);
    });
    expect(server.renewParentTabGatePass).toHaveBeenLastCalledWith("pass-2");
    expect(screen.queryByTestId("entry-gate")).toBeNull();

    data.loadParentHubChildProgress.mockResolvedValue({ ok: false, error: "x" });
    fireEvent.click(screen.getByRole("button", { name: "See Zed's progress" }));
    await act(async () => {});
    expect(data.loadParentHubChildProgress).toHaveBeenCalledWith("pass-3", "a1");
  });
});
