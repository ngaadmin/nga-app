// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AGREE_ITEMS, AGREE_PROMPT } from "@/lib/launchpad/content/getting-ready/copy";
import { gettingReadyScreen } from "@/lib/launchpad/content/getting-ready/screens";
import type { LaunchpadGettingReadyScreen } from "@/lib/launchpad/content/types";
import { GettingReadyFlow } from "@/components/launchpad/venture/screens/getting-ready-flow";
import type { AgreeJobAnswer } from "@/lib/launchpad/content/answers";

const screenSpec: LaunchpadGettingReadyScreen = gettingReadyScreen("agree", "agree_the_job");

afterEach(cleanup);

function renderAgree(onFinish = vi.fn(), onSave = vi.fn(), onExit = vi.fn()) {
  render(<GettingReadyFlow screen={screenSpec} floors={[]} businessName="Dog walking" onExit={onExit} onSave={onSave} onFinish={onFinish} />);
  return { onFinish, onSave, onExit };
}

describe("Agree the job", () => {
  it("starts on section 1 unticked, and Continue stays off until I've read this", () => {
    renderAgree();
    expect(screen.getByRole("heading", { name: "Agree the job" })).toBeTruthy();
    expect(screen.getByText("1 of 4")).toBeTruthy();
    expect(screen.getByText(AGREE_PROMPT)).toBeTruthy();
    expect(screen.getByRole("heading", { name: AGREE_ITEMS[0]!.title })).toBeTruthy();
    expect(screen.getByText("name,")).toBeTruthy();
    expect(screen.getByText(/Taking a customer order/)).toBeTruthy();
    const tick = screen.getByRole("button", { name: "I've read this" }) as HTMLButtonElement;
    const continueButton = screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
    expect(tick.getAttribute("aria-pressed")).toBe("false");
    expect(continueButton.disabled).toBe(true);
    fireEvent.click(continueButton);
    expect(screen.getByText("1 of 4")).toBeTruthy();
    fireEvent.click(tick);
    expect(continueButton.disabled).toBe(false);
    expect(document.body.textContent).not.toMatch(/\b(silver|bronze|gold|NGA)\b/);
  });

  it("advances through four screens and saves only the ticked booleans", () => {
    const { onFinish } = renderAgree();
    fireEvent.click(screen.getByRole("button", { name: "I've read this" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("2 of 4")).toBeTruthy();
    expect(screen.getByText("Suggested additional questions:")).toBeTruthy();
    expect(screen.getByText("Is there anything the dog isn't allowed to do?")).toBeTruthy();
    expect((screen.getByRole("button", { name: "I've read this" }) as HTMLButtonElement).getAttribute("aria-pressed")).toBe("false");
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "I've read this" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("3 of 4")).toBeTruthy();
    expect(screen.getByText("and where the job will happen.")).toBeTruthy();
    expect(screen.getByText("or an app.")).toBeTruthy();
    expect(screen.queryByText(/Venmo|PayPal|Cash App/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "I've read this" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("4 of 4")).toBeTruthy();
    expect(screen.getByText("or you need to cut the walk short.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "I've read this" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const saved = onFinish.mock.calls[0]?.[0] as AgreeJobAnswer;
    expect(saved).toEqual({
      kind: "agree-job",
      version: 1,
      understood: { collect_info: true, confirm_dog: true, when_where: true, cost_payment: true, plans_change: true },
    });
  });

  it("lets a learner leave section 1 with the ticks saved and the bronze still open", () => {
    const { onExit, onSave, onFinish } = renderAgree();
    fireEvent.click(screen.getByRole("button", { name: "I've read this" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onFinish).not.toHaveBeenCalled();
    expect(onExit).toHaveBeenCalledOnce();
    expect((onSave.mock.calls[0]?.[0] as AgreeJobAnswer).understood.collect_info).toBe(true);
  });

  it("goes back a section without leaving the lesson", () => {
    const { onExit } = renderAgree();
    fireEvent.click(screen.getByRole("button", { name: "I've read this" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("1 of 4")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
    expect(onExit).not.toHaveBeenCalled();
  });
});

describe("Getting Ready bronze task surfaces", () => {
  function open(step: LaunchpadGettingReadyScreen["step"], answerKey: string) {
    const spec: LaunchpadGettingReadyScreen = gettingReadyScreen(step, answerKey);
    render(<GettingReadyFlow screen={spec} floors={[]} businessName="Dog walking" onExit={() => {}} onFinish={() => {}} />);
  }

  it("opens Attract, Deliver, and Wrap-up as white lessons, not the spiral workbook", () => {
    open("find", "find_customers");
    expect(screen.getByRole("heading", { name: "Attract the customer", level: 1 })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Flyers or posters" })).toBeTruthy();
    expect(document.querySelector("[data-lesson-surface]")).toBeTruthy();
    expect(document.querySelector("[data-workbook-frame], [data-spiral-binding]")).toBeNull();
    cleanup();
    open("deliver", "deliver_the_job");
    expect(screen.getByRole("heading", { name: "Deliver the job", level: 1 })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "One day before the job" })).toBeTruthy();
    expect(document.querySelector("[data-workbook-frame]")).toBeNull();
    cleanup();
    open("wrap-job", "wrap_up");
    expect(screen.getByRole("heading", { name: "Wrap-up", level: 1 })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cash on the day" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "In person" })).toBeTruthy();
    expect(document.querySelector("[data-workbook-frame]")).toBeNull();
  });
});
