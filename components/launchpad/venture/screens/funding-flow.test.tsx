// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CostsAnswer } from "@/lib/launchpad/content/answers";
import { fundingScreen } from "@/lib/launchpad/content/planning/funding";
import { FundingFlow } from "@/components/launchpad/venture/screens/funding-flow";

const costs: CostsAnswer = {
  kind: "costs",
  version: 1,
  chosenServiceIds: ["dog-walking"],
  startup: { marketing: [{ id: "setup", label: "Setup", amount: 80 }], starterGear: [], done: true },
  ongoing: [],
};

afterEach(cleanup);

describe("Funding bronze", () => {
  it("confirms own cash and plans a borrow payback without a lender", () => {
    const finished = { current: "" };
    const { unmount } = render(<FundingFlow screen={fundingScreen()} answers={{ "l2-costs": costs }} onFinish={(answer) => (finished.current = JSON.stringify(answer))} />);
    expect(screen.getByText("$80")).toBeTruthy();
    expect(screen.queryByText(/parent|bronze|gold|silver/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "From my own cash or savings" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/from your own cash or savings/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(finished.current).toContain("own_cash");
    expect(finished.current).not.toMatch(/lender|parent/);
    unmount();

    render(<FundingFlow screen={fundingScreen()} answers={{ "l2-costs": costs }} />);
    fireEvent.click(screen.getByRole("button", { name: "Borrow it" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
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
});
