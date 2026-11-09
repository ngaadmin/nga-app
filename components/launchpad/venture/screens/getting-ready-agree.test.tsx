// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AGREE_ITEMS, AGREE_PROMPT } from "@/lib/launchpad/content/getting-ready/copy";
import { gettingReadyScreen } from "@/lib/launchpad/content/getting-ready/screens";
import type { LaunchpadGettingReadyScreen } from "@/lib/launchpad/content/types";
import { GettingReadyFlow } from "@/components/launchpad/venture/screens/getting-ready-flow";
import { ScriptedSheetPage } from "@/components/launchpad/venture/handbook/scripted-sheet";
import { TemplateBlanks } from "@/components/launchpad/venture/handbook/template-blanks";
import { WORKBOOK_ANSWER } from "@/components/launchpad/venture/handbook/paper-art";
import { gettingReadyWorkbookSheets } from "@/lib/launchpad/content/getting-ready/workbook-sheets";
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
    const subheading = screen.getByText("Suggested additional questions:");
    expect(subheading.className).toContain("mt-4");
    expect(subheading.className).toContain("text-[16px]");
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
    expect(screen.getByRole("button", { name: "Talking to friends and family" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Posting on a school or community board" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Friends and family" })).toBeNull();
    expect(screen.queryByRole("button", { name: "School or community noticeboard" })).toBeNull();
    expect(document.querySelector("[data-lesson-surface]")).toBeTruthy();
    expect(document.querySelector("[data-workbook-frame], [data-spiral-binding]")).toBeNull();
    cleanup();
    open("deliver", "deliver_the_job");
    expect(screen.getByRole("heading", { name: "How to deliver the job", level: 1 })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "One day before the job" })).toBeTruthy();
    expect(document.querySelector("[data-workbook-frame]")).toBeNull();
    cleanup();
    open("wrap-job", "wrap_up");
    expect(screen.getByRole("heading", { name: "Wrap-up", level: 1 })).toBeTruthy();
    expect(screen.getByText("Thinking about wrap-up now means you're ready when the job ends. Select all the ways you'll wrap up a job.")).toBeTruthy();
    expect(screen.getByText("Taking payment, select all that apply")).toBeTruthy();
    expect(screen.queryByText("I will collect payment by:")).toBeNull();
    expect(screen.getByRole("button", { name: "Cash on the day" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "In person" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cash on the day" }));
    fireEvent.click(screen.getByRole("button", { name: "Text" }));
    fireEvent.click(screen.getByRole("button", { name: "Email" }));
    expect(screen.queryByText(/I will collect payment by/)).toBeNull();
    expect(screen.queryByText(/ask for feedback/)).toBeNull();
    expect(screen.getByRole("button", { name: "Cash on the day" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Text" })).toBeTruthy();
    expect(document.querySelector("[data-workbook-frame]")).toBeNull();
  });

  it("opens practice and polish as white lessons and gates Continue", () => {
    const onFinish = vi.fn();
    const onExit = vi.fn();
    render(
      <GettingReadyFlow
        screen={gettingReadyScreen("practice", "practice_run")}
        floors={[]}
        businessName="Dog walking"
        onExit={onExit}
        onFinish={onFinish}
      />,
    );
    expect(screen.getByRole("heading", { name: "Do the practice run", level: 1 })).toBeTruthy();
    expect(screen.getByText("How will you practice before your first paid job?")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector("[data-workbook-frame]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Who you will practice with" }));
    const menu = document.querySelector("[data-open-menu]");
    expect(menu?.className).toContain("w-full");
    expect(menu?.className).not.toContain("absolute");
    fireEvent.click(screen.getByRole("button", { name: "a family member" }));
    fireEvent.click(screen.getByRole("button", { name: "Which service" }));
    fireEvent.click(screen.getByRole("button", { name: "Dog walking" }));
    fireEvent.click(screen.getByRole("button", { name: "When you will practice" }));
    fireEvent.click(screen.getByRole("button", { name: "tomorrow" }));
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish.mock.calls[0]?.[0]).toMatchObject({ kind: "practice-run", who: "family", service: "dog-walking", when: "tomorrow" });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onExit).toHaveBeenCalledOnce();
    cleanup();

    const finishPolish = vi.fn();
    render(
      <GettingReadyFlow
        screen={gettingReadyScreen("polish", "polish_service")}
        floors={[]}
        businessName="Dog walking"
        onExit={() => {}}
        onFinish={finishPolish}
      />,
    );
    expect(screen.getByRole("heading", { name: "Polish your service", level: 1 })).toBeTruthy();
    expect(screen.getByText("Was the service explained clearly?")).toBeTruthy();
    expect(screen.getByText("Did the proof of completion show the work well?")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector("[data-workbook-frame]")).toBeNull();
    const questions = [
      "Was the service explained clearly?",
      "Was the cost reasonable?",
      "Did the available times work for you?",
      "Was communication clear and helpful?",
      "Was the service delivered well?",
      "Was there a good range of payment options?",
      "Did the proof of completion show the work well?",
    ];
    for (const question of questions) {
      fireEvent.click(screen.getByRole("button", { name: question }));
      fireEvent.click(screen.getByRole("button", { name: "was good, nothing to change" }));
    }
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Was the cost reasonable?" }));
    fireEvent.click(screen.getByRole("button", { name: "customer had suggestions" }));
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("what was the customer's suggestion or feedback?"), { target: { value: "Charge a little less." } });
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(finishPolish.mock.calls[0]?.[0].kind).toBe("polish-service");
    expect(finishPolish.mock.calls[0]?.[0].rows.cost).toEqual({ result: "suggestions", suggestion: "Charge a little less." });
  });
});

describe("Getting Ready workbook wrap-up", () => {
  it("fills the existing wrap-up lines in bold navy with no underline", () => {
    const sheet = gettingReadyWorkbookSheets(
      { wrap_up: { kind: "wrap-job", version: 1, paymentHow: ["cash"], feedbackHow: ["text", "email"] } },
      "Dog walking",
      false,
    ).find((page) => page.id === "ready-b")!;
    render(<ScriptedSheetPage sheet={sheet} />);
    const payment = screen.getByText("cash on the day");
    const feedback = screen.getByText("text or email");
    expect(payment.className).toBe(WORKBOOK_ANSWER);
    expect(feedback.className).toBe(WORKBOOK_ANSWER);
    expect(payment.className).not.toMatch(/underline|border-b/);
    expect(document.body.textContent).toContain("I will collect payment by cash on the day.");
    expect(document.body.textContent).toContain("I will ask the owner for feedback or a short review by text or email.");
    cleanup();
    const blank = gettingReadyWorkbookSheets(undefined, "Dog walking", true).find((page) => page.id === "ready-b")!;
    render(
      <TemplateBlanks on>
        <ScriptedSheetPage sheet={blank} />
      </TemplateBlanks>,
    );
    expect(document.querySelectorAll("[data-blank-slot]").length).toBeGreaterThan(0);
    expect(screen.queryByText("Not answered yet")).toBeNull();
  });
});
