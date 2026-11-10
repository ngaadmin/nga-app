// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { levelUpOf, selectionAnswer, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadLevelUpScreen } from "@/lib/launchpad/content/types";
import { LevelUpFlow } from "@/components/launchpad/venture/screens/level-up-flow";

afterEach(cleanup);

const reflect: LaunchpadLevelUpScreen = { id: "reflect", type: "level-up", step: "reflect", title: "Reflect", answerKey: "l7-reflect" };
const improve: LaunchpadLevelUpScreen = { id: "improve", type: "level-up", step: "improve", title: "Improve", answerKey: "l7-improve" };
const grow: LaunchpadLevelUpScreen = { id: "grow", type: "level-up", step: "grow", title: "Grow", answerKey: "l7-grow" };

describe("Level Up screens", () => {
  it("walks Reflect and keeps the opening copy", () => {
    const onFinish = vi.fn();
    render(<LevelUpFlow screen={reflect} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    expect(screen.getByText("What went well in your business?")).toBeTruthy();
    expect(screen.getByText("1 of 3", { exact: false }) || document.body.textContent).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Told my neighbors about my business/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Getting ready")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalled();
    expect(onFinish.mock.calls[0]?.[0].selected).toEqual(["neighbors"]);
  });

  it("shows a nailed section when every Reflect win covers it", () => {
    const answers: LaunchpadAnswers = {
      "l7-reflect": { kind: "level-up", version: 1, selected: ["gear", "packed", "confirmed", "between"], picks: {}, starts: {}, idea: "", option: "", success: "", start: "" },
    };
    render(<LevelUpFlow screen={improve} answers={answers} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Put up flyers nearby/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("You nailed this one!")).toBeTruthy();
    expect(screen.getByText("Everything in Getting ready is already a win. Keep it up.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Get any gear I'm missing/ })).toBeNull();
  });

  it("sets the Grow check-in to today plus three months and copies that date", async () => {
    const write = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText: write } });
    const onFinish = vi.fn();
    render(<LevelUpFlow screen={grow} today={new Date(2026, 10, 10)} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: /Start a referral program/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "A free walk" }));
    fireEvent.click(screen.getByRole("button", { name: "A new owner books" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Your next check-in: February 10, 2027")).toBeTruthy();
    expect(screen.getByText("See you in three months.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("February 10, 2027"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalled();
    expect(levelUpOf({ "l7-grow": onFinish.mock.calls[0]?.[0] }, "l7-grow")?.idea).toBe("referral");
  });

  it("grays services the learner already offers", () => {
    const answers: LaunchpadAnswers = { "l1-offer": selectionAnswer(["dog-walking", "dog-training"]) };
    render(<LevelUpFlow screen={grow} answers={answers} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Add a new dog service/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect((screen.getByRole("button", { name: "Dog walking" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Grooming" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
