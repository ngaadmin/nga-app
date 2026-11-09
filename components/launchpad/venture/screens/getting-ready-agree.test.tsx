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
  it("starts on section 1 unticked, and Continue is never gated", () => {
    renderAgree();
    expect(screen.getByRole("heading", { name: "Agree the job" })).toBeTruthy();
    expect(screen.getByText("Section 1 of 5")).toBeTruthy();
    expect(screen.getByRole("heading", { name: AGREE_PROMPT })).toBeTruthy();
    expect(screen.getByRole("heading", { name: AGREE_ITEMS[0]!.title })).toBeTruthy();
    expect(screen.getByText("name,")).toBeTruthy();
    expect(screen.getByText(/Taking a customer order/)).toBeTruthy();
    const tick = screen.getByRole("button", { name: `I understand ${AGREE_ITEMS[0]!.title}` }) as HTMLButtonElement;
    expect(tick.getAttribute("aria-pressed")).toBe("false");
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
    expect(document.body.textContent).not.toMatch(/\b(silver|bronze|gold|NGA)\b/);
  });

  it("advances through all five sections and saves only the ticked booleans", () => {
    const { onFinish } = renderAgree();
    fireEvent.click(screen.getByRole("button", { name: `I understand ${AGREE_ITEMS[0]!.title}` }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 2 of 5")).toBeTruthy();
    expect(screen.getByText("Suggested additional questions:")).toBeTruthy();
    expect(screen.getByText("Is there anything the dog isn't allowed to do?")).toBeTruthy();
    expect((screen.getByRole("button", { name: `I understand ${AGREE_ITEMS[1]!.title}` }) as HTMLButtonElement).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 3 of 5")).toBeTruthy();
    expect(screen.getByText("and where the job will happen.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 4 of 5")).toBeTruthy();
    expect(screen.getByText("or an app.")).toBeTruthy();
    expect(screen.queryByText(/Venmo|PayPal|Cash App/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 5 of 5")).toBeTruthy();
    expect(screen.getByText("or you need to cut the walk short.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const saved = onFinish.mock.calls[0]?.[0] as AgreeJobAnswer;
    expect(saved).toEqual({
      kind: "agree-job",
      version: 1,
      understood: { collect_info: true, confirm_dog: false, when_where: false, cost_payment: false, plans_change: false },
    });
  });

  it("lets a learner leave section 1 with the ticks saved and the bronze still open", () => {
    const { onExit, onSave, onFinish } = renderAgree();
    fireEvent.click(screen.getByRole("button", { name: `I understand ${AGREE_ITEMS[0]!.title}` }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onFinish).not.toHaveBeenCalled();
    expect(onExit).toHaveBeenCalledOnce();
    expect((onSave.mock.calls[0]?.[0] as AgreeJobAnswer).understood.collect_info).toBe(true);
  });

  it("goes back a section without leaving the lesson", () => {
    const { onExit } = renderAgree();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Section 1 of 5")).toBeTruthy();
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
    expect(screen.getByRole("button", { name: "How you will confirm" })).toBeTruthy();
    expect(document.querySelector("[data-workbook-frame]")).toBeNull();
    cleanup();
    open("wrap-job", "wrap_up");
    expect(screen.getByRole("heading", { name: "Wrap-up", level: 1 })).toBeTruthy();
    expect(screen.getByRole("button", { name: "How you will collect payment" })).toBeTruthy();
    expect(document.querySelector("[data-workbook-frame]")).toBeNull();
  });
});
