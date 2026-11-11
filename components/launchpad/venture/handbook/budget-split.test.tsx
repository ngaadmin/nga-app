// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BudgetSplit } from "@/components/launchpad/venture/handbook/budget-split";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("My budget split field", () => {
  it("hides the earned line until a saved amount is on this device", () => {
    render(<BudgetSplit percents={[5, 15, 40, 40]} />);
    expect(screen.queryByText("Money I earned")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("5%")).toBeTruthy();
    expect(screen.getAllByText("40%")).toHaveLength(2);
  });

  it("plays a saved amount back as text and splits it across the jars", () => {
    window.localStorage.setItem("lp-venture-test:budget-earned", "250");
    render(<BudgetSplit percents={[5, 15, 40, 40]} />);
    expect(screen.getByText("Money I earned")).toBeTruthy();
    expect(screen.getByText("$250")).toBeTruthy();
    expect(screen.getByText("$12")).toBeTruthy();
    expect(screen.getByText("$38")).toBeTruthy();
    expect(screen.getAllByText("$100")).toHaveLength(2);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.querySelector("input, textarea, button")).toBeNull();
  });
});
