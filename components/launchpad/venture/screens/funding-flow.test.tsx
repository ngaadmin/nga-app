// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CostsAnswer, FundingAnswer } from "@/lib/launchpad/content/answers";
import { fundingScreen } from "@/lib/launchpad/content/planning/funding";
import { FundingFlow } from "@/components/launchpad/venture/screens/funding-flow";
import { FundingSheet } from "@/components/launchpad/venture/handbook/planning-sheets";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";

const costs: CostsAnswer = {
  kind: "costs",
  version: 1,
  chosenServiceIds: ["dog-walking"],
  startup: { marketing: [{ id: "setup", label: "Setup", amount: 80 }], starterGear: [], done: true },
  ongoing: [],
};

afterEach(cleanup);

function releaseNarration() {
  act(() => {
    vi.advanceTimersByTime(2000);
  });
}

describe("Funding bronze", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("confirms own cash and plans a borrow payback without a lender", () => {
    const finished = { current: "" };
    const { unmount } = render(<FundingFlow screen={fundingScreen()} answers={{ "l2-costs": costs }} onFinish={(answer) => (finished.current = JSON.stringify(answer))} />);
    expect(screen.getByText("Your start-up cost is $80")).toBeTruthy();
    expect(screen.getByText(/Before you buy the gear/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Fully pay from my own cash or savings" })).toBeNull();
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByText("How will you cover it?")).toBeNull();
    expect(screen.queryByText("From Know your cost")).toBeNull();
    expect(screen.queryByText("That's more than your start-up cost.")).toBeNull();
    expect(screen.queryByText(/parent|bronze|gold|silver/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Fully pay from my own cash or savings" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/from your own cash or savings/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(finished.current).toContain("own_cash");
    expect(finished.current).not.toMatch(/lender|parent/);
    unmount();

    render(<FundingFlow screen={fundingScreen()} answers={{ "l2-costs": costs }} />);
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: /Borrow all the start-up money/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: /Same amount over a set time/ }));
    for (let i = 0; i < 7; i += 1) fireEvent.click(screen.getByRole("button", { name: "More periods" }));
    expect(document.querySelector("[data-period-payment]")?.textContent).toBe("$10.00");
    fireEvent.click(screen.getByRole("button", { name: "Months" }));
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole("button", { name: "Fewer periods" }));
    expect(document.querySelector("[data-period-payment]")?.textContent).toBe("$20.00");
    fireEvent.click(screen.getByRole("button", { name: /A set amount each week/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Weekly amount" }), { target: { value: "5" } });
    expect(document.querySelector("[data-weeks-to-repay]")?.textContent).toMatch(/16 weeks/);
    expect(screen.getByText(/left that out here to keep it simple/)).toBeTruthy();
    expect(screen.queryByText(/parent/i)).toBeNull();
  });

  it("warns with the payload line when a combination is over the start-up total, and plays the saved split back", () => {
    const spec = fundingScreen();
    const finished = { current: null as FundingAnswer | null };
    const { unmount } = render(<FundingFlow screen={spec} answers={{ "l2-costs": costs }} onFinish={(answer) => (finished.current = answer)} />);
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: spec.copy.combination }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 2 of 2")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: spec.copy.ownMoney }), { target: { value: "50" } });
    fireEvent.change(screen.getByRole("textbox", { name: spec.copy.borrowed }), { target: { value: "40" } });
    expect(screen.getByText("Covered: $90 of $80").textContent).toContain("Covered: $90 of $80");
    expect(screen.getByText(spec.copy.overWarning).className).toContain("text-[#B45309]");
    expect(screen.queryByText("That's more than your start-up cost.")).toBeNull();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox", { name: spec.copy.borrowed }), { target: { value: "30" } });
    expect(document.querySelector("[data-split-total]")?.textContent).toContain("Covered: $80 of $80");
    const own = screen.getByRole("textbox", { name: spec.copy.ownMoney }) as HTMLInputElement;
    expect(own.className).toContain("shadow-[inset_0_0_0_1.5px_#0CC1E0]");
    fireEvent.change(own, { target: { value: "050" } });
    expect(own.value).toBe("50");
    fireEvent.change(own, { target: { value: "5" } });
    own.setSelectionRange(0, 0);
    fireEvent.keyDown(own, { key: "Backspace" });
    expect(own.value).toBe("");
    fireEvent.change(own, { target: { value: "50" } });
    own.setSelectionRange(0, 2);
    fireEvent.keyDown(own, { key: "Backspace" });
    expect(own.value).toBe("");
    fireEvent.change(own, { target: { value: "50" } });
    expect(document.querySelector("[data-tick]")).toBeTruthy();
    expect(screen.queryByText(spec.copy.overWarning)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(finished.current).toMatchObject({ fundingSource: "combination", ownAmount: 50, borrowedAmount: 30, startupTotal: 80 });
    unmount();

    const edited = fundingScreen();
    edited.copy.overWarning = "A payload warning line.";
    const editedView = render(<FundingFlow screen={edited} answers={{ "l2-costs": costs }} />);
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: edited.copy.combination }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByRole("textbox", { name: edited.copy.ownMoney }), { target: { value: "90" } });
    expect(screen.getByText("A payload warning line.")).toBeTruthy();
    expect(screen.queryByText(spec.copy.overWarning)).toBeNull();
    editedView.unmount();

    render(
      <LaunchpadAnswersProvider
        value={{
          iconVentureId: "dog-walking",
          answers: { funding_start: { kind: "funding", version: 1, fundingSource: "combination", startupTotal: 80, currency: "USD", ownAmount: 50, borrowedAmount: 30 } },
          setAnswer: () => {},
          floors: [],
        }}
      >
        <FundingSheet />
      </LaunchpadAnswersProvider>,
    );
    const wrap = document.querySelector("[data-funding-wrap]");
    expect(wrap?.textContent).toContain("I'll cover");
    expect(wrap?.textContent).toContain("$50");
    expect(wrap?.textContent).toContain("$30");
    expect(wrap?.textContent).toContain("borrowed.");
  });
});
