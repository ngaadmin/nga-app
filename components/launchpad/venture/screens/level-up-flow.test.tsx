// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { levelUpOf, parseLevelUpAnswer, selectionAnswer, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { checkLaunchpadVenturePayload } from "@/lib/launchpad/content/check-payload";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadLevelUpScreen } from "@/lib/launchpad/content/types";
import { LevelUpFlow } from "@/components/launchpad/venture/screens/level-up-flow";

afterEach(cleanup);

function levelUpScreens(payload = launchpadTestVentureSeed()) {
  const screens = payload.floors
    .find((floor) => floor.level === 7)!
    .silvers.flatMap((silver) => silver.bronzes.flatMap((bronze) => bronze.tasks.flatMap((task) => task.screens)))
    .filter((item): item is LaunchpadLevelUpScreen => item.type === "level-up");
  return {
    reflect: screens.find((item) => item.step === "reflect")!,
    improve: screens.find((item) => item.step === "improve")!,
    grow: screens.find((item) => item.step === "grow")!,
  };
}

const { reflect, improve, grow } = levelUpScreens();

describe("Level Up screens", () => {
  it("shows one payload statement on both Reflect and Improve", () => {
    const payload = launchpadTestVentureSeed();
    const screens = levelUpScreens(payload);
    expect(screens.reflect.content).toBe(screens.improve.content);
    const statement = screens.reflect.content.statements.find((item) => item.id === "more-than-one-way");
    if (!statement) throw new Error("missing statement");
    statement.label = "Posted a second notice";
    const { unmount } = render(<LevelUpFlow screen={screens.reflect} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    expect(screen.getByText("Posted a second notice")).toBeTruthy();
    expect(screen.queryByText("Using more than one way to get my name out")).toBeNull();
    unmount();
    render(<LevelUpFlow screen={screens.improve} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    expect(screen.getByText("Posted a second notice")).toBeTruthy();
    expect(screen.queryByText("Using more than one way to get my name out")).toBeNull();
  });

  it("walks four Reflect sections and keeps a ticked outcome", () => {
    const onFinish = vi.fn();
    render(<LevelUpFlow screen={reflect} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    expect(screen.getByText("Section 1 of 4")).toBeTruthy();
    expect(screen.getByText("Using more than one way to get my name out")).toBeTruthy();
    expect(screen.getByText("Asking every customer if they'd like to book me again")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Using more than one way to get my name out" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 2 of 4")).toBeTruthy();
    expect(screen.getByText("What went well in your business?")).toBeTruthy();
    expect(screen.getByText("Nobody's appointment slipping my mind")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 3 of 4")).toBeTruthy();
    expect(screen.getByText("Always showing up on time at each job")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 4 of 4")).toBeTruthy();
    expect(screen.getByText("Remembering all customer names and their pets' names")).toBeTruthy();
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
        improvePlan: [],
        ideas: [],
      },
    };
    render(<LevelUpFlow screen={improve} answers={answers} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    expect(screen.getByText("Section 1 of 5")).toBeTruthy();
    expect(screen.getByText("Pick one thing to improve in each section. The grayed-out ones are already your wins.")).toBeTruthy();
    const won = screen.getByRole("button", { name: "Using more than one way to get my name out" }) as HTMLButtonElement;
    expect(won.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Following up with everyone who shows interest" }));
    expect(screen.queryByText("Do now")).toBeNull();
    expect(screen.queryByText("Three months")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("You nailed this one!")).toBeTruthy();
    expect(screen.getByText("Everything in Getting ready is already a win. Keep it up.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Always showing up on time at each job" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Asking every customer for feedback" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 5 of 5")).toBeTruthy();
    expect(screen.getByText("You've selected your focus areas.")).toBeTruthy();
    expect(screen.getByText("You can't give all your focus areas equal attention at once, so we suggest one focus per week. Choose the order you want to tackle them.")).toBeTruthy();
    expect(screen.getByText("Week 1")).toBeTruthy();
    expect(screen.getByText("Week 2")).toBeTruthy();
    expect(screen.getByText("Week 3")).toBeTruthy();
    expect(screen.queryByText("Week 4")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalled();
    const saved = onFinish.mock.calls[0]?.[0];
    expect(saved.improvePlan).toEqual([
      { statementId: "followed-up", week: 1 },
      { statementId: "on-time", week: 2 },
      { statementId: "feedback", week: 3 },
    ]);
    expect(saved.pace["followed-up"]).toBe("quick");
    expect(saved.picks.ready).toBeUndefined();
    expect(saved.starts).toBeUndefined();
    expect(screen.queryByText("quick")).toBeNull();
  });

  it("ignores a saved start date and skips the week order when every section was nailed", () => {
    const mapped: LaunchpadAnswers = {
      "l7-reflect": {
        kind: "level-up",
        version: 1,
        selected: ["more-than-one-way"],
        picks: {},
        pace: {},
        improvePlan: [],
        ideas: [],
      },
      "l7-improve": {
        kind: "level-up",
        version: 1,
        selected: [],
        picks: { customers: "followed-up" },
        pace: {},
        improvePlan: [],
        ideas: [],
      },
    };
    const { unmount } = render(<LevelUpFlow screen={improve} answers={mapped} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Keeping track of every job that comes in" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Always showing up on time at each job" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Asking every customer for feedback" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("You've selected your focus areas.")).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
    unmount();

    const all = reflect.content.statements.map((item) => item.id);
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
            improvePlan: [],
            ideas: [],
          },
        }}
        onExit={() => {}}
        onSave={() => {}}
        onFinish={onFinish}
      />,
    );
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalled();
    expect(screen.queryByText("You've selected your focus areas.")).toBeNull();
  });

  it("keeps an older published payload valid and skips the week order until the new copy is there", () => {
    const payload = structuredClone(launchpadTestVentureSeed());
    const improveScreen = payload.floors.find((floor) => floor.level === 7)!.silvers[0]!.bronzes[1]!.tasks[0]!.screens[0]!;
    if (improveScreen.type !== "level-up") throw new Error("missing");
    const improveCopy = improveScreen.content.improve as { planHeader?: string; weekLabels?: string[]; planContext: string };
    delete improveCopy.planHeader;
    delete improveCopy.weekLabels;
    improveCopy.planContext = "A plan with dates is a plan you'll actually do. Here's when you'll start each improvement.";
    expect(checkLaunchpadVenturePayload(payload, "dog-walking").ok).toBe(true);
    const onFinish = vi.fn();
    render(<LevelUpFlow screen={improveScreen} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: "Following up with everyone who shows interest" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Keeping track of every job that comes in" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Always showing up on time at each job" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Asking every customer for feedback" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalled();
    expect(screen.queryByText("You've selected your focus areas.")).toBeNull();
    const kept = parseLevelUpAnswer({
      kind: "level-up",
      version: 1,
      picks: { customers: "followed-up" },
      starts: { "followed-up": "in-a-month" },
    });
    expect(kept?.improvePlan).toEqual([]);
    expect(kept && "starts" in kept).toBe(false);
  });

  function openGrowMenu() {
    fireEvent.click(screen.getByRole("button", { name: /What will you try/ }));
  }

  it("sets the Grow check-in to today plus three months and copies that date", async () => {
    const write = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText: write } });
    const onFinish = vi.fn();
    render(<LevelUpFlow screen={grow} today={new Date(2026, 10, 10)} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    expect(screen.getByText("Section 1 of 2")).toBeTruthy();
    expect(screen.queryByText(/Section \d+ of 3/)).toBeNull();
    openGrowMenu();
    fireEvent.click(screen.getByRole("button", { name: "A free walk" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 2 of 2")).toBeTruthy();
    expect(screen.getByText("Your next check-in: February 10, 2027")).toBeTruthy();
    expect(screen.getByText("See you in three months.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("February 10, 2027"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalled();
    const saved = levelUpOf({ "l7-grow": onFinish.mock.calls[0]?.[0] }, "l7-grow");
    expect(saved?.ideas).toEqual(["free-walk"]);
    expect(saved && "idea" in saved).toBe(false);
    expect(saved && "option" in saved).toBe(false);
    expect(saved && "success" in saved).toBe(false);
    expect(saved && "start" in saved).toBe(false);
  });

  it("ticks one to three Grow options under the idea headings and stops at three", () => {
    render(<LevelUpFlow screen={grow} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    const cont = () => screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
    expect(cont().disabled).toBe(true);
    const guidance = screen.getByText("Pick up to three ideas to try.");
    const question = screen.getByText("What will you try?");
    const menu = document.querySelector("[data-grow-menu]");
    expect(question.compareDocumentPosition(guidance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(guidance.nextElementSibling).toBe(menu);
    expect(screen.queryByText("Grow your sales")).toBeNull();
    expect(screen.queryByText("Grow your service")).toBeNull();
    openGrowMenu();
    expect(screen.getByText("Start a referral program")).toBeTruthy();
    expect(screen.getByText("Expand your services")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "A free walk" }));
    fireEvent.click(screen.getByRole("button", { name: "A monthly pack" }));
    fireEvent.click(screen.getByRole("button", { name: "Walk and wash" }));
    expect((screen.getByRole("button", { name: "A ten-walk pack" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "A monthly pack" }));
    expect((screen.getByRole("button", { name: "A ten-walk pack" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "A free walk" }));
    fireEvent.click(screen.getByRole("button", { name: "Walk and wash" }));
    expect(cont().disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "A free walk" }));
    fireEvent.click(cont());
    expect(screen.getByText("See you in three months.")).toBeTruthy();
    expect(screen.queryByText("What will owners get for sending a friend?")).toBeNull();
    expect(screen.queryByText("What will success look like?")).toBeNull();
  });

  it("grays services the learner already offers and hides expand jobs outside the cohort", () => {
    const answers: LaunchpadAnswers = { "l1-offer": selectionAnswer(["dog-walking", "dog-training"]) };
    const { unmount } = render(<LevelUpFlow screen={grow} answers={answers} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    openGrowMenu();
    expect((screen.getByRole("button", { name: "Dog walking" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Dog Training" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Grooming" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText("Grocery delivery")).toBeNull();
    expect(screen.getByText("Lawn mowing")).toBeTruthy();
    unmount();
    render(<LevelUpFlow screen={grow} cohort="explorer" onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    openGrowMenu();
    expect(screen.queryByText("Lawn mowing")).toBeNull();
    expect(screen.getByText("Curb painting")).toBeTruthy();
  });

  it("keeps an older Grow payload valid and ignores a saved per-idea plan", () => {
    const payload = structuredClone(launchpadTestVentureSeed());
    const growScreen = payload.floors.find((floor) => floor.level === 7)!.silvers[0]!.bronzes[2]!.tasks[0]!.screens[0]!;
    if (growScreen.type !== "level-up") throw new Error("missing");
    const copy = growScreen.content.grow as unknown as {
      context?: string;
      salesLabel?: string;
      serviceLabel?: string;
      guidance: string;
      ideas: { group?: string; context?: string; question?: string; success?: { id: string; label: string }[]; start?: string }[];
    };
    copy.context = "Every business can grow a little. Trying one new idea is a simple way to bring in more work.";
    copy.salesLabel = "Grow your sales";
    copy.serviceLabel = "Grow your service";
    copy.guidance = "Pick up to three ideas to try. Keeping it to three helps you focus on the ones you really want to do. Next, you'll plan how and when to start.";
    for (const idea of copy.ideas) {
      idea.group = "sales";
      idea.context = "A small thank-you makes owners happy to tell their friends about you.";
      idea.question = "What will owners get for sending a friend?";
      idea.success = [{ id: "new-owner", label: "A new owner books" }];
      idea.start = "this-week";
    }
    expect(checkLaunchpadVenturePayload(payload, "dog-walking").ok).toBe(true);
    const kept = parseLevelUpAnswer({
      kind: "level-up",
      version: 1,
      ideas: ["referral"],
      idea: "referral",
      option: "free-walk",
      success: "new-owner",
      start: "this-week",
    });
    expect(kept?.ideas).toEqual(["referral"]);
    expect(kept && "idea" in kept).toBe(false);
    expect(kept && "option" in kept).toBe(false);
    expect(kept && "success" in kept).toBe(false);
    expect(kept && "start" in kept).toBe(false);
    const onFinish = vi.fn();
    render(
      <LevelUpFlow
        screen={growScreen}
        answers={kept ? { "l7-grow": kept } : undefined}
        onExit={() => {}}
        onSave={() => {}}
        onFinish={onFinish}
      />,
    );
    expect(screen.getByText("Section 1 of 2")).toBeTruthy();
    expect(screen.queryByText(copy.context)).toBeNull();
    expect(screen.queryByText("Grow your sales")).toBeNull();
    expect(screen.getByText(copy.guidance)).toBeTruthy();
    const cont = () => screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
    expect(cont().disabled).toBe(true);
    openGrowMenu();
    fireEvent.click(screen.getByRole("button", { name: "A free walk" }));
    expect(cont().disabled).toBe(false);
    fireEvent.click(cont());
    expect(screen.queryByText("What will owners get for sending a friend?")).toBeNull();
    expect(screen.getByText("See you in three months.")).toBeTruthy();
    fireEvent.click(cont());
    expect(onFinish.mock.calls[0]?.[0].ideas).toEqual(["free-walk"]);
  });
});
