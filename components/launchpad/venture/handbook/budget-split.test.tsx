// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BudgetSplit } from "@/components/launchpad/venture/handbook/budget-split";
import { writeBudgetSplit } from "@/lib/launchpad/content/budgeting/split";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function field() {
  return screen.getByRole("textbox", { name: "Money I earned" }) as HTMLInputElement;
}

describe("My budget split field", () => {
  it("starts at 100 and recalculates the dollar column on each keystroke", () => {
    render(<BudgetSplit percents={[5, 15, 40, 40]} />);
    const earned = field();
    expect(earned.value).toBe("100");
    expect(screen.getByText("5%")).toBeTruthy();
    expect(screen.getByText("15%")).toBeTruthy();
    expect(screen.getAllByText("40%")).toHaveLength(2);
    expect(screen.getByText("$5")).toBeTruthy();
    expect(screen.getByText("$15")).toBeTruthy();
    expect(screen.getAllByText("$40")).toHaveLength(2);

    fireEvent.change(earned, { target: { value: "250" } });
    expect(earned.value).toBe("250");
    expect(screen.getByText("$12")).toBeTruthy();
    expect(screen.getByText("$38")).toBeTruthy();
    expect(screen.getAllByText("$100")).toHaveLength(2);
    expect(screen.getByText("5%")).toBeTruthy();
    expect(screen.getByText("15%")).toBeTruthy();
    expect(screen.getAllByText("40%")).toHaveLength(2);
    expect(window.localStorage.getItem("lp-venture-test:budget-earned")).toBe("250");
  });

  it("keeps the field visible when empty, shows the 100 placeholder, and still splits 100", () => {
    render(<BudgetSplit percents={[5, 15, 40, 40]} />);
    fireEvent.change(field(), { target: { value: "" } });
    const earned = field();
    expect(earned.value).toBe("");
    expect(earned.placeholder).toBe("100");
    expect(screen.getByText("$5")).toBeTruthy();
    expect(screen.getByText("$15")).toBeTruthy();
    expect(screen.getAllByText("$40")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Edit money I earned" })).toBeTruthy();
  });

  it("keeps only digits and restores a saved total", () => {
    window.localStorage.setItem("lp-venture-test:budget-earned", "250");
    render(<BudgetSplit percents={[5, 15, 40, 40]} />);
    const earned = field();
    expect(earned.value).toBe("250");
    expect(screen.getAllByText("$100")).toHaveLength(2);
    fireEvent.change(earned, { target: { value: "12a" } });
    expect(earned.value).toBe("12");
    expect(window.localStorage.getItem("lp-venture-test:budget-earned")).toBe("12");
  });

  it("leaves the bronze percents alone when the typed total changes", () => {
    writeBudgetSplit([10, 20, 30, 40]);
    render(<BudgetSplit />);
    expect(screen.getByText("10%")).toBeTruthy();
    expect(screen.getByText("20%")).toBeTruthy();
    expect(screen.getByText("30%")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    fireEvent.change(field(), { target: { value: "200" } });
    expect(screen.getByText("10%")).toBeTruthy();
    expect(screen.getByText("20%")).toBeTruthy();
    expect(screen.getByText("30%")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.getByText("$20")).toBeTruthy();
    expect(screen.getByText("$40")).toBeTruthy();
    expect(screen.getByText("$60")).toBeTruthy();
    expect(screen.getByText("$80")).toBeTruthy();
  });
});
