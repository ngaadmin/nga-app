// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

beforeEach(() => {
  const root = document.createElement("div");
  root.id = "modal-root";
  document.body.appendChild(root);
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      isOpen
      title="Are you sure?"
      body="Body text"
      confirmLabel="Yes, decline and delete"
      confirmTone="destructive"
      cancelLabel="Go back"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
  it("is a labelled modal alert dialog", () => {
    renderDialog();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByRole("alertdialog", { name: "Are you sure?" })).toBe(dialog);
  });

  it("Escape cancels and never confirms", () => {
    const { onConfirm, onCancel } = renderDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Go back cancels and never confirms", () => {
    const { onConfirm, onCancel } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirm runs once per click", () => {
    const { onConfirm, onCancel } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Yes, decline and delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("starts focus on Go back and traps Tab inside the dialog", async () => {
    renderDialog();
    const back = screen.getByRole("button", { name: "Go back" });
    const yes = screen.getByRole("button", { name: "Yes, decline and delete" });
    await waitFor(() => expect(document.activeElement).toBe(back));
    const focusables = [yes, back].sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
    const first = focusables[0]!;
    const last = focusables[1]!;
    act(() => last.focus());
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    act(() => first.focus());
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("ignores Escape and Go back while busy", () => {
    const { onCancel } = renderDialog({ busy: true, busyLabel: "Declining…" });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Declining…" })).toBeTruthy();
  });

  it("one-button notice closes with its button or Escape", async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Request declined"
        body="We'll delete this account's details."
        confirmLabel="Close"
        onConfirm={onClose}
        onCancel={onClose}
      />,
    );
    const close = screen.getByRole("button", { name: "Close" });
    await waitFor(() => expect(document.activeElement).toBe(close));
    fireEvent.click(close);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders nothing when closed", () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
