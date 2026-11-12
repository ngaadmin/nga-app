// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
        improvePlan: [],
        ideas: [],
        growPlans: [],
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
    expect(saved.pace).toBeUndefined();
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
        improvePlan: [],
        ideas: [],
        growPlans: [],
      },
      "l7-improve": {
        kind: "level-up",
        version: 1,
        selected: [],
        picks: { customers: "followed-up" },
        improvePlan: [],
        ideas: [],
        growPlans: [],
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
            improvePlan: [],
            ideas: [],
        growPlans: [],
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

  function fillIdea() {
    const page = document.querySelector("[data-grow-layout='stacked']") as HTMLElement;
    fireEvent.change(within(page).getByRole("combobox", { name: "I'll start a referral program, offering" }), { target: { value: "free-walk" } });
    fireEvent.change(within(page).getByRole("combobox", { name: "starting" }), { target: { value: "this-week" } });
    fireEvent.change(within(page).getByRole("textbox", { name: "My experiment works if" }), { target: { value: "4" } });
    fireEvent.change(within(page).getByRole("combobox", { name: "I'll check in on how it's going in" }), { target: { value: "one-month" } });
  }

  function openBundles() {
    fireEvent.click(screen.getByRole("button", { name: "Build service bundles" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  }

  it("stacks the bundles statement and keeps the tick list off that screen", () => {
    render(<LevelUpFlow screen={grow} today={new Date(2026, 10, 11)} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    openBundles();
    const page = document.querySelector("[data-grow-layout='stacked']") as HTMLElement;
    expect(page).toBeTruthy();
    expect(within(page).getByText("I'll start offering")).toBeTruthy();
    expect(within(page).getByText("starting")).toBeTruthy();
    expect(within(page).getByText("My experiment works if")).toBeTruthy();
    expect(within(page).getByText("I'll check in on how it's going in")).toBeTruthy();
    expect(within(page).getAllByText("choose").length).toBeGreaterThanOrEqual(3);
    expect(within(page).getByText("customers book a bundle")).toBeTruthy();
    expect(page.querySelector("[data-grow-options]")).toBeNull();
    expect(within(page).queryByRole("button", { name: "Walk and wash" })).toBeNull();
    expect(within(page).queryByText("That's December 11, 2026.")).toBeNull();
    fireEvent.change(within(page).getByRole("combobox", { name: "I'll start offering" }), { target: { value: "walk-wash" } });
    fireEvent.change(within(page).getByRole("combobox", { name: "I'll start offering" }), { target: { value: "walk-manners" } });
    fireEvent.change(within(page).getByRole("combobox", { name: "starting" }), { target: { value: "this-week" } });
    fireEvent.change(within(page).getByRole("textbox", { name: "My experiment works if" }), { target: { value: "3" } });
    fireEvent.change(within(page).getByRole("combobox", { name: "I'll check in on how it's going in" }), { target: { value: "one-month" } });
    const answer = within(page).getByText("a walk and basic manners session and a walk-and-wash bundle");
    expect(answer.className).toContain("text-left");
    expect(answer.className).toContain("text-[#0CC1E0]");
    expect(within(page).getAllByText("this week").length).toBeGreaterThan(0);
    expect(within(page).getAllByText("one month").length).toBeGreaterThan(0);
    expect(within(page).getByText("That's December 11, 2026.")).toBeTruthy();
    expect(page.querySelector("[data-grow-options]")).toBeNull();
  });

  it("stacks every Grow idea from its own payload and leaves the tick list off", () => {
    for (const idea of grow.content.grow.ideas) {
      const { unmount } = render(<LevelUpFlow screen={grow} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
      fireEvent.click(screen.getByRole("button", { name: idea.label }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      const page = document.querySelector("[data-grow-layout='stacked']") as HTMLElement;
      expect(page.getAttribute("data-grow-statement")).toBe(idea.id);
      expect(within(page).getByText(idea.stacked!.offerLead)).toBeTruthy();
      expect(within(page).getByText(idea.stacked!.countAfter)).toBeTruthy();
      expect(page.querySelector("[data-grow-options]")).toBeNull();
      unmount();
    }
  });

  it("shows a payload edit of the closer heading and the shortest of mixed picks", () => {
    const edited = structuredClone(grow);
    edited.content.grow.closerHeadline = "Come back in {period}.";
    const answer = {
      kind: "level-up" as const,
      version: 1 as const,
      selected: [],
      picks: {},
      improvePlan: [],
      ideas: ["referral", "prepaid"],
      growPlans: [
        { idea: "referral", options: ["free-walk"], when: "two-weeks", successCount: 2, checkIn: "three-months", checkInDate: "February 11, 2027" },
        { idea: "prepaid", options: ["subscription"], when: "in-a-month", successCount: 2, checkIn: "two-months", checkInDate: "January 11, 2027" },
      ],
    };
    render(<LevelUpFlow screen={edited} answers={{ "l7-grow": answer }} today={new Date(2026, 10, 11)} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Come back in two weeks.")).toBeTruthy();
    expect(screen.queryByText("See you in two weeks.")).toBeNull();
    expect(screen.getByText("Your next check-in: November 25, 2026")).toBeTruthy();
  });

  it("shows a payload edit of a bundles lead-in", () => {
    const edited = structuredClone(grow);
    const bundles = edited.content.grow.ideas.find((idea) => idea.id === "bundle");
    if (!bundles?.stacked) throw new Error("bundles layout missing");
    bundles.stacked = { ...bundles.stacked, offerLead: "The offer I will start" };
    render(<LevelUpFlow screen={edited} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    openBundles();
    expect(screen.getByText("The offer I will start")).toBeTruthy();
    expect(screen.queryByText("I'll start offering")).toBeNull();
  });

  it("puts the aqua question before the context and the gray guidance", () => {
    render(<LevelUpFlow screen={grow} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    const question = document.getElementById("grow-question");
    const context = screen.getByText(grow.content.grow.context!);
    const guidance = screen.getByText(grow.content.grow.guidance);
    expect(question).toBeTruthy();
    const follows = (earlier: Node, later: Node) => (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    expect(follows(question!, context)).toBe(true);
    expect(follows(context, guidance)).toBe(true);
    expect(question!.className).toContain("mt-1");
    expect(question!.className).toContain("text-[#0CC1E0]");
    expect(context.className).toContain("mt-3");
    expect(guidance.className).toContain("mt-1.5");
    expect(guidance.className).toContain("text-[#4A5568]");
  });

  it("keeps Holiday care on Grow and off the Level 1 offer list", () => {
    const floors = launchpadTestVentureSeed().floors;
    const levelOne = floors.flatMap((floor) => floor.silvers.flatMap((silver) => silver.bronzes.flatMap((bronze) => bronze.tasks.flatMap((task) => task.screens)))).find((item) => item.type === "choice-capture" && item.answerKey === "l1-offer");
    if (!levelOne || levelOne.type !== "choice-capture") throw new Error("offer list missing");
    expect(levelOne.options.map((option) => option.label)).not.toContain("Holiday care");
    render(<LevelUpFlow screen={grow} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a new service" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const offer = screen.getByRole("combobox", { name: "I'll start offering" });
    const holiday = within(offer).getByRole("option", { name: "Holiday care" }) as HTMLOptionElement;
    expect(holiday.disabled).toBe(false);
    expect(within(offer).getByRole("option", { name: "Dog training" })).toBeTruthy();
    expect(within(offer).queryByRole("option", { name: "Dog walking" })).toBeNull();
  });

  it("shows a payload edit to the Grow question", () => {
    const edited = structuredClone(grow);
    edited.content.grow.question = "Which experiment will you run?";
    render(<LevelUpFlow screen={edited} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    expect(screen.getByText("Which experiment will you run?")).toBeTruthy();
    expect(screen.queryByText("What will you try, to grow your business?")).toBeNull();
    expect(document.querySelector("[data-scribble='bulb']")).toBeTruthy();
  });

  it("shows a payload edit inside the statement and joins offers without a serial comma", () => {
    const edited = structuredClone(grow);
    const referral = edited.content.grow.ideas[0]!;
    referral.context = "Payload context line.";
    referral.statement = "Offer {offer} {start} for {count} in {checkIn}.";
    referral.options[0]!.sentence = "a payload walk";
    edited.content.grow.dateLine = "Due {date}.";
    render(<LevelUpFlow screen={edited} today={new Date(2026, 10, 11)} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Start a referral program" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Payload context line.")).toBeTruthy();
    expect(screen.queryByText("Reward customers who send a new customer your way, so your best customers help find the next ones.")).toBeNull();
    const offer = screen.getByRole("combobox", { name: "I'll start a referral program, offering" });
    fireEvent.change(offer, { target: { value: "free-walk" } });
    expect(screen.getByText("a payload walk")).toBeTruthy();
    fireEvent.change(offer, { target: { value: "add-on" } });
    fireEvent.change(offer, { target: { value: "priority" } });
    expect(screen.getByText("a payload walk, a free add-on of their choice on their next visit and a priority booking for their preferred time slot")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "I'll check in on how it's going in" }), { target: { value: "two-months" } });
    expect(screen.getByText("Due January 11, 2027.")).toBeTruthy();
    expect(document.querySelector("[data-grow-options]")).toBeNull();
  });

  it("keeps the closer date and writes each idea check-in once", async () => {
    const write = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText: write } });
    const onFinish = vi.fn();
    render(<LevelUpFlow screen={grow} today={new Date(2026, 10, 10)} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    expect(screen.getByText("Section 1 of 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start a referral program" }));
    expect(screen.getByText("Section 1 of 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 2 of 3")).toBeTruthy();
    expect(screen.getAllByText("choose").length).toBeGreaterThanOrEqual(3);
    expect(document.querySelector("[data-grow-options]")).toBeNull();
    expect(screen.getByText("Reward customers who send a new customer your way, so your best customers help find the next ones.")).toBeTruthy();
    expect(document.querySelector("[data-scribble-large='growth']")).toBeTruthy();
    fillIdea();
    expect(screen.getByText("That's December 10, 2026.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Section 3 of 3")).toBeTruthy();
    expect(screen.getByText("See you in this week.")).toBeTruthy();
    expect(screen.getByText("Your next check-in: November 17, 2026")).toBeTruthy();
    expect(document.querySelector("[data-scribble-large='calendar']")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("November 17, 2026"));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Copied");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const saved = levelUpOf({ "l7-grow": onFinish.mock.calls[0]?.[0] }, "l7-grow");
    expect(saved?.ideas).toEqual(["referral"]);
    expect(saved?.growPlans).toEqual([
      { idea: "referral", options: ["free-walk"], when: "this-week", successCount: 4, checkIn: "one-month", checkInDate: "December 10, 2026" },
    ]);
  });

  function reachCloser(target = grow) {
    render(<LevelUpFlow screen={target} today={new Date(2026, 10, 10)} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Start a referral program" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fillIdea();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  }

  it("shows a payload edit of the copied label", async () => {
    const edited = structuredClone(grow);
    edited.content.grow.copiedLabel = "Saved for the calendar";
    Object.assign(navigator, { clipboard: { writeText: vi.fn(() => Promise.resolve()) } });
    reachCloser(edited);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("button", { name: "Saved for the calendar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  });

  it("copies with the textarea fallback when the clipboard rejects", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn(() => Promise.reject(new Error("denied"))) } });
    const exec = vi.fn(() => true);
    document.execCommand = exec;
    reachCloser();
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeTruthy();
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("shows the failure hint and leaves the check-in selectable when copy fails", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn(() => Promise.reject(new Error("denied"))) } });
    document.execCommand = vi.fn(() => false);
    reachCloser();
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Select the check-in text and copy it by hand."));
    expect(document.querySelector("[data-copy-failed]")?.textContent).toBe("Select the check-in text and copy it by hand.");
    expect(document.querySelector("[data-check-in-date]")?.className).toContain("select-text");
    expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  });

  it("caps the menu at three ideas and repeats screen 2 in menu order", () => {
    render(<LevelUpFlow screen={grow} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    const cont = () => screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
    expect(cont().disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Expand beyond your main business" }));
    fireEvent.click(screen.getByRole("button", { name: "Start a referral program" }));
    fireEvent.click(screen.getByRole("button", { name: "Build service bundles" }));
    expect((screen.getByRole("button", { name: "Add a new service" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Build service bundles" }));
    expect((screen.getByRole("button", { name: "Add a new service" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(cont());
    expect(screen.getByText("Section 2 of 4")).toBeTruthy();
    expect(screen.getByText("Start a referral program")).toBeTruthy();
    fillIdea();
    fireEvent.click(cont());
    expect(screen.getByText("Expand beyond your main business")).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Grocery delivery" })).toBeNull();
    expect(screen.getByRole("option", { name: "Lawn mowing" })).toBeTruthy();
    expect(document.querySelector("[data-grow-options]")).toBeNull();
  });

  it("grays services already chosen and hides expand jobs outside the cohort", () => {
    const answers: LaunchpadAnswers = { "l1-offer": selectionAnswer(["dog-sitting", "grooming"]) };
    const { unmount } = render(<LevelUpFlow screen={grow} answers={answers} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a new service" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const offer = screen.getByRole("combobox", { name: "I'll start offering" });
    expect((within(offer).getByRole("option", { name: "Dog sitting" }) as HTMLOptionElement).disabled).toBe(true);
    expect((within(offer).getByRole("option", { name: "Grooming" }) as HTMLOptionElement).disabled).toBe(true);
    expect((within(offer).getByRole("option", { name: "Dog training" }) as HTMLOptionElement).disabled).toBe(false);
    expect((within(offer).getByRole("option", { name: "Manage bookings for others" }) as HTMLOptionElement).disabled).toBe(false);
    expect(document.querySelector("[data-grow-options]")).toBeNull();
    unmount();
    render(<LevelUpFlow screen={grow} cohort="explorer" onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Expand beyond your main business" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const jobs = screen.getByRole("combobox", { name: "I'll start offering" });
    expect(within(jobs).queryByRole("option", { name: "Lawn mowing" })).toBeNull();
    expect(within(jobs).getByRole("option", { name: "Curb painting" })).toBeTruthy();
  });

  it("keeps an older Grow payload valid and ignores an old option id save", () => {
    const payload = structuredClone(launchpadTestVentureSeed());
    const growScreen = payload.floors.find((floor) => floor.level === 7)!.silvers[0]!.bronzes[2]!.tasks[0]!.screens[0]!;
    if (growScreen.type !== "level-up") throw new Error("missing");
    const copy = growScreen.content.grow as unknown as { startOptions?: unknown; checkInOptions?: unknown; ideas: { successLine?: string }[] };
    delete copy.startOptions;
    delete copy.checkInOptions;
    for (const idea of copy.ideas) delete idea.successLine;
    expect(checkLaunchpadVenturePayload(payload, "dog-walking").ok).toBe(true);
    const kept = parseLevelUpAnswer({
      kind: "level-up",
      version: 1,
      ideas: ["free-walk"],
      idea: "referral",
      option: "free-walk",
      success: "new-owner",
      start: "this-week",
    });
    expect(kept?.ideas).toEqual(["free-walk"]);
    expect(kept?.growPlans).toEqual([]);
    const onFinish = vi.fn();
    render(<LevelUpFlow screen={growScreen} answers={kept ? { "l7-grow": kept } : undefined} onExit={() => {}} onSave={() => {}} onFinish={onFinish} />);
    expect(screen.getByText("Section 1 of 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start a referral program" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Checking in every three months shows you how your business is going. Set a reminder so you don't forget.")).toBeTruthy();
    expect(screen.queryByText("Select at least one.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish.mock.calls[0]?.[0].ideas).toEqual(["referral"]);
  });
});
