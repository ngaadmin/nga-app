// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BudgetSplit } from "@/components/launchpad/venture/handbook/budget-split";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("My budget split field", () => {
  it("starts at 100 and recalculates 250 on the keystroke", () => {
    render(<BudgetSplit percents={[5, 15, 40, 40]} />);
    const input = screen.getByLabelText("Money I earned") as HTMLInputElement;
    expect(input.value).toBe("100");
    expect(screen.getByText("$5")).toBeTruthy();
    expect(screen.getByText("$15")).toBeTruthy();
    fireEvent.change(input, { target: { value: "250" } });
    expect(input.value).toBe("250");
    expect(screen.getByText("$12")).toBeTruthy();
    expect(screen.getByText("$38")).toBeTruthy();
    expect(screen.getAllByText("$100")).toHaveLength(2);
  });

  it("lets the field be cleared and still calculates from 100", () => {
    render(<BudgetSplit percents={[5, 15, 40, 40]} />);
    const input = screen.getByLabelText("Money I earned") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("100");
    expect(screen.getByText("$5")).toBeTruthy();
    expect(screen.getAllByText("$40")).toHaveLength(2);
  });
});
