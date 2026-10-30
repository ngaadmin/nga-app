// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DeclinedNoticeDialog,
  ParentDeclineConfirmDialog,
} from "@/components/onboarding/parent-decline-dialogs";
import { copyMatrix } from "@/constants/copyMatrix";
import {
  useParentDeclineFlow,
  type ParentDeclineOutcome,
} from "@/lib/onboarding/use-parent-decline-flow";

const copy = copyMatrix.onboarding.parentDecline;

beforeEach(() => {
  const root = document.createElement("div");
  root.id = "modal-root";
  document.body.appendChild(root);
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

/** Same wiring as the sign-up form and Settings: Decline only opens the dialog. */
function Harness({
  decline,
  onClosed,
}: {
  decline: (target: string) => Promise<ParentDeclineOutcome>;
  onClosed?: () => void;
}) {
  const flow = useParentDeclineFlow<string>(decline);
  return (
    <>
      <button type="button" onClick={() => flow.requestDecline("River")}>
        Decline
      </button>
      <ParentDeclineConfirmDialog flow={flow} />
      <DeclinedNoticeDialog
        isOpen={flow.isDeclinedOpen}
        onClose={() => {
          flow.closeDeclined();
          onClosed?.();
        }}
      />
    </>
  );
}

describe("parent decline confirmation", () => {
  it("uses the draft copy", () => {
    expect(copy).toMatchObject({
      confirmTitle: "Are you sure?",
      confirmBody:
        "We'll delete all the data linked to your child's profile. This can't be undone.",
      confirmAction: "Yes, decline and delete",
      cancelAction: "Go back",
      declinedTitle: "Request declined",
      declinedBody: "We'll delete this account's details.",
      declinedClose: "Close",
    });
    expect(JSON.stringify(copy)).not.toMatch(/\bNGA\b/);
  });

  it("tapping Decline without confirming does not decline", () => {
    const decline = vi.fn(async () => ({ ok: true }) as const);
    render(<Harness decline={decline} />);
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(screen.getByRole("alertdialog", { name: copy.confirmTitle })).toBeTruthy();
    expect(screen.getByText(copy.confirmBody)).toBeTruthy();
    expect(decline).not.toHaveBeenCalled();
  });

  it("confirming declines exactly once and shows the closeable declined notice", async () => {
    const decline = vi.fn(async () => ({ ok: true }) as const);
    const onClosed = vi.fn();
    render(<Harness decline={decline} onClosed={onClosed} />);
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    const yes = screen.getByRole("button", { name: copy.confirmAction });
    expect(yes.getAttribute("data-tone")).toBe("destructive");
    fireEvent.click(yes);
    fireEvent.click(yes);
    await screen.findByRole("alertdialog", { name: copy.declinedTitle });
    expect(decline).toHaveBeenCalledTimes(1);
    expect(decline).toHaveBeenCalledWith("River");
    expect(screen.getByText(copy.declinedBody)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: copy.declinedClose }));
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("Go back changes nothing", () => {
    const decline = vi.fn(async () => ({ ok: true }) as const);
    render(<Harness decline={decline} />);
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    fireEvent.click(screen.getByRole("button", { name: copy.cancelAction }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(decline).not.toHaveBeenCalled();
  });

  it("Escape on the confirm dialog is cancel", () => {
    const decline = vi.fn(async () => ({ ok: true }) as const);
    render(<Harness decline={decline} />);
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(decline).not.toHaveBeenCalled();
  });

  it("keeps the dialog open with the error when the decline fails", async () => {
    const decline = vi.fn(async () => ({ ok: false, error: "Try again." }) as const);
    render(<Harness decline={decline} />);
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    fireEvent.click(screen.getByRole("button", { name: copy.confirmAction }));
    await waitFor(() => expect(screen.getByText("Try again.")).toBeTruthy());
    expect(screen.getByRole("alertdialog", { name: copy.confirmTitle })).toBeTruthy();
    expect(screen.queryByText(copy.declinedTitle)).toBeNull();
  });
});

describe("every parent Decline button goes through the confirm dialog", () => {
  it("email link (sign-up form)", () => {
    const form = readFileSync("components/onboarding/sign-up-form.tsx", "utf8");
    expect(form).toContain("useParentDeclineFlow<string>(handleExplicitDecline)");
    expect(form).toContain("declineFlow.requestDecline(consentToken)");
    expect(form).toContain("<ParentDeclineConfirmDialog flow={declineFlow} />");
    expect(form).not.toMatch(/void handleExplicitDecline\(/);
    // The decline server action is only called from the confirmed handler.
    expect(form.match(/declineConsentRequest\(/g)?.length).toBe(1);
  });

  it("Settings (both Decline buttons)", () => {
    const panel = readFileSync(
      "components/dashboard/settings/account-subscription-status-panel.tsx",
      "utf8",
    );
    expect(panel).toContain("useParentDeclineFlow<string>(declineChildConfirmed)");
    expect(panel.match(/onClick=\{\(\) => handleDeclineChild\(/g)?.length).toBe(2);
    expect(panel).toContain("<ParentDeclineConfirmDialog flow={declineFlow} />");
    const opener = panel.slice(
      panel.indexOf("function handleDeclineChild"),
      panel.indexOf("async function declineChildConfirmed"),
    );
    expect(opener).toContain("declineFlow.requestDecline(username)");
    expect(opener).not.toContain("declineConsentRequestInApp");
    expect(panel.match(/declineConsentRequestInApp\(/g)?.length).toBe(1);
  });

  it("learner declined pop-up has a Close that leads to a fresh start", () => {
    const gate = readFileSync("components/dashboard/explorer-pending-consent-gate.tsx", "utf8");
    expect(gate).toContain("<DeclinedNoticeDialog");
    expect(gate).toContain("router.replace(DECLINED_LEARNER_CLOSE_PATH)");
  });
});
