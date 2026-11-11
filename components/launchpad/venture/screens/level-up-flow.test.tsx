// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { levelUpOf, selectionAnswer, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { LEVEL_STATEMENTS } from "@/lib/launchpad/content/level-up/model";
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
    expect(screen.getByText("What went well in your business?")).toBeTruthy();
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

  it("grays Reflect wins, nails a finished section, and finishes after four sections", () => {
    const onFinish = vi.fn();
    const answers: LaunchpadAnswers = {
      "l7-reflect": {
        kind: "level-up",
        version: 1,
        selected: ["kept-track", "confirmed", "slipped", "more-than-one-way"],
        picks: {},
        pace: {},
        starts: {},
        ideas: [],
        idea: "",
        option: "",
        success: "",
        start: "",
      },
    };
    render(<LevelUpFlow screen={improve} answers={answers} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    expect(screen.getByText("Section 1 of 5")).toBeTruthy();
    expect(screen.getByText("Pick one thing to improve in each section. The grayed-out ones are already your wins.")).toBeTruthy();
    const won = screen.getByRole("button", { name: "I used more than one way to get my name out" }) as HTMLButtonElement;
    expect(won.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "I followed up with everyone who showed interest" }));
    expect(screen.queryByText("Do now")).toBeNull();
    expect(screen.queryByText("Three months")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("You nailed this one!")).toBeTruthy();
    expect(screen.getByText("Everything in Getting ready is already a win. Keep it up.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "I always showed up on time at each job" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "I asked every customer for feedback" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 5 of 5")).toBeTruthy();
    expect(screen.getByText("A plan with dates is a plan you'll actually do. Here's when you'll start each improvement.")).toBeTruthy();
    expect(screen.getByText("Check your plan. Tap a start date if you want to change it.")).toBeTruthy();
    expect(screen.queryByText("Pick one to start now and one to start in three months.")).toBeNull();
    expect(screen.queryByText("Getting ready")).toBeNull();
    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options.filter((label) => label === "this week")).toHaveLength(3);
    expect(options).toContain("this month");
    expect(options).toContain("in the next three months");
    expect(options).not.toContain("by my next job");
    expect(options).not.toContain("by next quarter");
    expect(options).not.toContain("in a month");
    expect(options).not.toContain("in three months");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalled();
    const saved = onFinish.mock.calls[0]?.[0];
    expect(saved.starts["followed-up"]).toBe("this-week");
    expect(saved.starts["on-time"]).toBe("this-week");
    expect(saved.pace["followed-up"]).toBe("quick");
    expect(saved.picks.ready).toBeUndefined();
    expect(screen.queryByText("quick")).toBeNull();
  });

  it("maps a saved in-a-month start to this month and skips the timeline when every section was nailed", () => {
    const mapped: LaunchpadAnswers = {
      "l7-reflect": {
        kind: "level-up",
        version: 1,
        selected: ["more-than-one-way"],
        picks: {},
        pace: {},
        starts: {},
        ideas: [],
        idea: "",
        option: "",
        success: "",
        start: "",
      },
      "l7-improve": {
        kind: "level-up",
        version: 1,
        selected: [],
        picks: { customers: "followed-up" },
        pace: {},
        starts: { "followed-up": "in-a-month" },
        ideas: [],
        idea: "",
        option: "",
        success: "",
        start: "",
      },
    };
    const { unmount } = render(<LevelUpFlow screen={improve} answers={mapped} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "I kept track of every job that came in" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "I always showed up on time at each job" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "I asked every customer for feedback" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe("this-month");
    unmount();

    const all = LEVEL_STATEMENTS.map((item) => item.id);
    const onFinish = vi.fn();
    render(
      <LevelUpFlow
        screen={improve}
        answers={{
          "l7-reflect": {
            kind: "level-up",
            version: 1,
            selected: all,
            picks: {},
            pace: {},
            starts: {},
            ideas: [],
            idea: "",
            option: "",
            success: "",
            start: "",
          },
        }}
        onExit={() => {}}
        onSave={() => {}}
        onFinish={onFinish}
      />,
    );
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalled();
    expect(screen.queryByText("A plan with dates is a plan you'll actually do. Here's when you'll start each improvement.")).toBeNull();
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
    const saved = levelUpOf({ "l7-grow": onFinish.mock.calls[0]?.[0] }, "l7-grow");
    expect(saved?.ideas).toEqual(["referral"]);
    expect(saved?.idea).toBe("referral");
  });

  it("ticks one to three Grow ideas and opens the first one shown", () => {
    render(<LevelUpFlow screen={grow} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    const cont = () => screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
    expect(cont().disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Expand your services/ }));
    fireEvent.click(screen.getByRole("button", { name: /Start a referral program/ }));
    fireEvent.click(screen.getByRole("button", { name: /Offer a prepaid pack/ }));
    expect((screen.getByRole("button", { name: /Build a bundle/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Offer a prepaid pack/ }));
    expect((screen.getByRole("button", { name: /Build a bundle/ }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Expand your services/ }));
    fireEvent.click(screen.getByRole("button", { name: /Start a referral program/ }));
    expect(cont().disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Expand your services/ }));
    fireEvent.click(screen.getByRole("button", { name: /Start a referral program/ }));
    fireEvent.click(cont());
    expect(screen.getByText("What will owners get for sending a friend?")).toBeTruthy();
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
