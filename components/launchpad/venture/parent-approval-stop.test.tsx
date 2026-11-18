// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { copyMatrix } from "@/constants/copyMatrix";
import { ParentApprovalStop } from "@/components/launchpad/venture/parent-approval-stop";

afterEach(cleanup);

const copy = copyMatrix.launchpadParentApproval.learner;

function renderStop(state: Parameters<typeof ParentApprovalStop>[0]["state"]) {
  return render(<ParentApprovalStop state={state} onBack={vi.fn()} onRetry={vi.fn()} />);
}

describe("ParentApprovalStop", () => {
  it("waits for a parent and shows the chip and a way back", () => {
    renderStop("pending");
    expect(screen.getByText(copy.title)).toBeTruthy();
    expect(screen.getByText(copy.waitingBody)).toBeTruthy();
    expect(screen.getByText(copy.waitingChip)).toBeTruthy();
    expect(screen.getByRole("button", { name: copy.back })).toBeTruthy();
    expect(screen.queryByRole("button", { name: copy.retry })).toBeNull();
  });

  it("tells the learner when the parent said not now, with no ask again button", () => {
    renderStop("declined");
    expect(screen.getByText(copy.notNowBody)).toBeTruthy();
    expect(screen.queryByText(copy.waitingChip)).toBeNull();
    expect(screen.queryByRole("button", { name: /ask/i })).toBeNull();
  });

  it("offers a retry when the check fails, never the task", () => {
    renderStop("error");
    expect(screen.getByText(copy.errorBody)).toBeTruthy();
    expect(screen.getByRole("button", { name: copy.retry })).toBeTruthy();
  });

  it("shows no buttons while checking", () => {
    renderStop("checking");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
