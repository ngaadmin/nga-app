// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const server = vi.hoisted(() => ({ decideLaunchpadApproval: vi.fn() }));
vi.mock("@/lib/launchpad/parent-approval/server", () => server);
vi.mock("@/components/ui/modal-shell", () => ({
  ModalShell: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}));

import { LaunchpadApprovalSheet } from "@/components/parent/launchpad-approval";
import { copyMatrix } from "@/constants/copyMatrix";

const item = {
  kind: "launchpad" as const,
  learnerId: "kid-1",
  childUsername: "Sam",
  ventureId: "dog-walking",
  ventureName: "Dog walking",
  status: "pending" as const,
  requestedAt: "2026-11-18T10:00:00.000Z",
};
const copy = copyMatrix.launchpadParentApproval.parent;

function open(onClose = vi.fn(), onDecided = vi.fn()) {
  render(<LaunchpadApprovalSheet item={item} onClose={onClose} onDecided={onDecided} />);
  return { onClose, onDecided };
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("Launchpad approval sheet: one tap, no second PIN", () => {
  it("shows no PIN box, Continue or Forgot your PIN", () => {
    open();
    expect(document.querySelector("[data-parent-tab-pin-input]")).toBeNull();
    expect(document.querySelector("[data-parent-tab-continue]")).toBeNull();
    expect(document.querySelector("[data-parent-tab-forgot]")).toBeNull();
    expect(screen.queryByText(/Forgot your PIN/i)).toBeNull();
    expect(screen.queryByText(/Enter your Parent PIN/i)).toBeNull();
  });

  it("Approve acts at once, tells the Hub, and the sheet is told to close", async () => {
    server.decideLaunchpadApproval.mockResolvedValue({ ok: true, status: "approved" });
    const changed = vi.fn();
    window.addEventListener("parent-hub:unread-changed", changed);
    const { onDecided } = open();
    await act(async () => {
      fireEvent.click(document.querySelector("[data-launchpad-approval-approve]")!);
    });
    expect(server.decideLaunchpadApproval).toHaveBeenCalledWith("kid-1", "dog-walking", "yes");
    expect(onDecided).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledTimes(1);
    window.removeEventListener("parent-hub:unread-changed", changed);
  });

  it("Not now acts at once too", async () => {
    server.decideLaunchpadApproval.mockResolvedValue({ ok: true, status: "declined" });
    const { onDecided } = open();
    await act(async () => {
      fireEvent.click(document.querySelector("[data-launchpad-approval-not-now]")!);
    });
    expect(server.decideLaunchpadApproval).toHaveBeenCalledWith("kid-1", "dog-walking", "no");
    expect(onDecided).toHaveBeenCalledTimes(1);
  });

  it("shows the server's message when it says no, and stays usable", async () => {
    server.decideLaunchpadApproval.mockResolvedValue({ ok: false, error: "That learner isn't linked to your account." });
    const { onDecided } = open();
    await act(async () => {
      fireEvent.click(document.querySelector("[data-launchpad-approval-approve]")!);
    });
    expect(screen.getByRole("alert").textContent).toContain("isn't linked");
    expect(onDecided).not.toHaveBeenCalled();
    expect((document.querySelector("[data-launchpad-approval-approve]") as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows a message and stops waiting when the request throws", async () => {
    server.decideLaunchpadApproval.mockRejectedValue(new Error("network"));
    const { onDecided } = open();
    await act(async () => {
      fireEvent.click(document.querySelector("[data-launchpad-approval-approve]")!);
    });
    expect(screen.getByRole("alert").textContent).toBe(copy.saveError);
    expect(onDecided).not.toHaveBeenCalled();
    expect((document.querySelector("[data-launchpad-approval-approve]") as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows Saving... while waiting and blocks a double tap", async () => {
    let resolve!: (v: { ok: true; status: "approved" }) => void;
    server.decideLaunchpadApproval.mockReturnValue(new Promise((r) => (resolve = r)));
    open();
    const approve = document.querySelector("[data-launchpad-approval-approve]") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(approve);
    });
    expect(approve.textContent).toBe(copy.saving);
    expect(approve.disabled).toBe(true);
    fireEvent.click(approve);
    expect(server.decideLaunchpadApproval).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ ok: true, status: "approved" }));
  });
});
