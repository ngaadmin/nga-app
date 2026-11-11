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
  it("walks four Reflect sections and keeps a ticked outcome", () => {
    const onFinish = vi.fn();
    render(<LevelUpFlow screen={reflect} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    expect(screen.getByText("Section 1 of 4")).toBeTruthy();
    expect(screen.getByText("I used more than one way to get my name out")).toBeTruthy();
    expect(screen.getByText("I asked every customer if they'd like to book me again")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "I used more than one way to get my name out" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 2 of 4")).toBeTruthy();
    expect(screen.getByText("Nobody's appointment slipped my mind")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 3 of 4")).toBeTruthy();
    expect(screen.getByText("I always showed up on time at each job")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 4 of 4")).toBeTruthy();
    expect(screen.getByText("I remembered all my customer names and their pets' names")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalled();
    expect(onFinish.mock.calls[0]?.[0].selected).toEqual(["more-than-one-way"]);
  });

  it("offers only unticked statements, nails a finished section, and skips the timing screens", () => {
    const answers: LaunchpadAnswers = {
      "l7-reflect": {
        kind: "level-up",
        version: 1,
        selected: ["kept-track", "confirmed", "slipped", "more-than-one-way"],
        picks: {},
        starts: {},
        idea: "",
        option: "",
        success: "",
        start: "",
      },
    };
    render(<LevelUpFlow screen={improve} answers={answers} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    expect(screen.getByText("Section 1 of 5")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "I used more than one way to get my name out" })).toBeNull();
    expect(screen.getByRole("button", { name: "I followed up with everyone who showed interest" })).toBeTruthy();
    expect(screen.queryByText("Do now")).toBeNull();
    expect(screen.queryByText("Three months")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "I followed up with everyone who showed interest" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("You nailed this one!")).toBeTruthy();
    expect(screen.getByText("Everything in Getting ready is already a win. Keep it up.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "I always showed up on time at each job" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "I asked every customer for feedback" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByText("Pick one to start now and one to start in three months.")).toBeNull();
    expect(screen.queryByText("Your picks are all quick fixes, so you can start them all now.")).toBeNull();
    expect(screen.queryByText("These all take a bit longer. Pick one to start in three months.")).toBeNull();
    expect(screen.getByText("Section 5 of 5")).toBeTruthy();
    expect(screen.getByText(/I followed up with everyone who showed interest, starting/)).toBeTruthy();
    expect(screen.getByText(/I always showed up on time at each job, starting/)).toBeTruthy();
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
