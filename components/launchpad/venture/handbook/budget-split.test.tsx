// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BudgetSplit } from "@/components/launchpad/venture/handbook/budget-split";
import { SurfaceCopyProvider } from "@/components/launchpad/venture/surface-copy";
import { LAUNCHPAD_SURFACE_COPY } from "@/lib/launchpad/content/surface-copy";
import { writeBudgetMoneyMade, writeBudgetSplit } from "@/lib/launchpad/content/budgeting/split";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("My budget split", () => {
  it("has no Money I earned box", () => {
    writeBudgetMoneyMade("200");
    render(<BudgetSplit percents={[10, 15, 35, 40]} />);
    expect(screen.queryByRole("textbox", { name: "Money I earned" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit money I earned" })).toBeNull();
    expect(document.querySelector("#budget-earned")).toBeNull();
    expect(screen.queryByText("Money I earned")).toBeNull();
    expect(document.querySelector("[data-money-made-playback]")?.textContent).toContain("Money made");
    expect(document.querySelector("[data-money-made-playback]")?.textContent).toContain("$200");
    expect(document.querySelector("[data-budget-amount='giving']")?.textContent).toBe("$20");
    expect(document.querySelector("[data-budget-amount='emergencies']")?.textContent).toBe("$30");
    expect(document.querySelector("[data-budget-amount='pay']")?.textContent).toBe("$70");
    expect(document.querySelector("[data-budget-amount='grow']")?.textContent).toBe("$80");
  });

  it("keeps the jar dollars on Money made", () => {
    writeBudgetMoneyMade("80");
    render(<BudgetSplit percents={[5, 15, 40, 40]} />);
    expect(screen.getByText("$4")).toBeTruthy();
    expect(screen.getByText("$12")).toBeTruthy();
    expect(screen.getAllByText("$32")).toHaveLength(2);
    expect(window.localStorage.getItem("lp-venture-test:budget-money-made")).toBe("80");
  });

  it("leaves the bronze percents on the jars", () => {
    writeBudgetSplit([10, 20, 30, 40]);
    writeBudgetMoneyMade("200");
    render(<BudgetSplit />);
    expect(screen.getByText("10%")).toBeTruthy();
    expect(screen.getByText("20%")).toBeTruthy();
    expect(screen.getByText("30%")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.getByText("$20")).toBeTruthy();
    expect(screen.getByText("$40")).toBeTruthy();
    expect(screen.getByText("$60")).toBeTruthy();
    expect(screen.getByText("$80")).toBeTruthy();
  });

  it("shows a payload edit of Money made", () => {
    writeBudgetMoneyMade("80");
    const copy = {
      ...LAUNCHPAD_SURFACE_COPY,
      workbook: { ...LAUNCHPAD_SURFACE_COPY.workbook, moneyMade: "A payload money total" },
    };
    render(
      <SurfaceCopyProvider value={copy as typeof LAUNCHPAD_SURFACE_COPY}>
        <BudgetSplit percents={[5, 15, 40, 40]} />
      </SurfaceCopyProvider>,
    );
    expect(screen.getByText(/A payload money total/)).toBeTruthy();
    expect(screen.queryByText("Money made")).toBeNull();
  });
});
