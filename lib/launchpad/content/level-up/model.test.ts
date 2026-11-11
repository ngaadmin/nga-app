import { describe, expect, it } from "vitest";
import { addDays, addMonths, checkInClipboard, expandJobsFor, fillToken, formatCheckInDate, joinList, soonestGrowCheckIn, weeklyFocusRows } from "@/lib/launchpad/content/level-up/model";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadLevelUpScreen } from "@/lib/launchpad/content/types";

function levelUpContent() {
  const screen = launchpadTestVentureSeed()
    .floors.find((floor) => floor.level === 7)!
    .silvers[0]!.bronzes[0]!.tasks[0]!.screens[0]!;
  if (screen.type !== "level-up") throw new Error("Level Up screen missing");
  return screen.content;
}

describe("Level Up check-in date", () => {
  it("uses the shortest Grow pick, and three months when nothing is picked", () => {
    const today = new Date(2026, 10, 11);
    const grow = levelUpContent().grow;
    const mixed = soonestGrowCheckIn(
      [
        { idea: "referral", when: "two-weeks", checkIn: "two-months", checkInDate: "January 11, 2027" },
        { idea: "prepaid", when: "in-a-month", checkIn: "three-months", checkInDate: "February 11, 2027" },
      ],
      grow.startOptions,
      grow.checkInOptions,
      today,
    );
    expect(mixed.period).toBe("two weeks");
    expect(formatCheckInDate(mixed.date)).toBe("November 25, 2026");
    const single = soonestGrowCheckIn(
      [{ when: "", checkIn: "two-months", checkInDate: "January 11, 2027" }],
      grow.startOptions,
      grow.checkInOptions,
      today,
    );
    expect(single.period).toBe("two months");
    expect(formatCheckInDate(single.date)).toBe("January 11, 2027");
    const none = soonestGrowCheckIn([], grow.startOptions, grow.checkInOptions, today);
    expect(none.period).toBe("three months");
    expect(formatCheckInDate(none.date)).toBe(formatCheckInDate(addMonths(today, 3)));
    expect(addDays(today, 14).getDate()).toBe(25);
  });

  it("adds three calendar months to today", () => {
    const date = addMonths(new Date(2026, 10, 10), 3);
    const grow = levelUpContent().grow;
    const line = fillToken(grow.checkIn, "date", formatCheckInDate(date));
    expect(line).toBe("Your next check-in: February 10, 2027");
    expect(checkInClipboard(grow.calendarNote, line)).toContain("February 10, 2027");
    expect(checkInClipboard(grow.calendarNote, line)).toContain("NextGenAchiever$ check-in");
  });

  it("orders Improve picks by week instead of a start date", () => {
    const improve = levelUpContent().improve;
    expect(improve.planHeader).toBe("You've selected your focus areas.");
    expect(improve.planContext).toBe("You can't give all your focus areas equal attention at once, so we suggest one focus per week. Choose the order you want to tackle them.");
    expect(improve.weekLabels).toEqual(["Week 1", "Week 2", "Week 3", "Week 4"]);
    expect(levelUpContent().workbookPages).toEqual([{ id: "weekly-focus", title: "My weekly focus areas" }]);
    const rows = weeklyFocusRows(levelUpContent(), [
      { statementId: "brought-everything", week: 4 },
      { statementId: "confirmed", week: 1 },
      { statementId: "missing", week: 2 },
    ]);
    expect(rows).toEqual([
      { weekLabel: "Week 1", line: "Confirming each job with the customer beforehand" },
      { weekLabel: "Week 4", line: "Always bringing everything I need" },
    ]);
    expect("startOptions" in improve).toBe(false);
  });

  it("keeps the Grow menu to the locked question and the five idea names", () => {
    const grow = levelUpContent().grow;
    expect(grow.question).toBe("What will you try, to grow your business?");
    expect(grow.context).toBe("A growth experiment isn't about polishing what you have, it's one new thing you try to see if it pays off.");
    expect(grow.guidance).toBe("Try at least one growth experiment.");
    expect(grow.optionPrompt).toBe("Select at least one.");
    expect(grow.ideas.map((idea) => idea.label)).toEqual([
      "Start a referral program",
      "Offer subscriptions and prepays",
      "Build service bundles",
      "Add a new dog service",
      "Expand beyond dog walking",
    ]);
    expect(grow.ideas.map((idea) => idea.context)).toEqual([
      "Reward customers who send a new owner your way, so your best customers help find the next ones.",
      "You get cash upfront. In return, you offer a discount, typically ten to twenty percent of the total.",
      "Combine two or three services in one booking, with a small discount for taking the lot.",
      "A new service means new income from the same dogs and the same route.",
      "Grow past the core job into the homes on your route.",
    ]);
    expect(grow.joinWord).toBe("and");
    expect(grow.dateLine).toBe("That's {date}.");
    expect(grow.startOptions?.map((option) => option.label)).toEqual(["this week", "in two weeks", "in a month"]);
    const bundles = grow.ideas.find((idea) => idea.id === "bundle");
    expect(bundles?.options.map((option) => [option.label, option.sentence])).toEqual([
      ["Walk and wash", "a walk-and-wash bundle"],
      ["Walk and manners", "a walk-and-manners bundle"],
      ["Neighbor bundle", "a neighbor bundle"],
    ]);
    expect(grow.ideas.map((idea) => idea.successLine)).toEqual([
      "{count} new customers book through a referral",
      "{count} customers sign up and pay upfront",
      "{count} customers book a bundle",
      "{count} customers book my new service",
      "{count} customers give me more to do",
    ]);
  });

  it("joins one, two, and three offer labels with no serial comma", () => {
    expect(joinList(["dog sitting"], "and")).toBe("dog sitting");
    expect(joinList(["dog sitting", "grooming"], "and")).toBe("dog sitting and grooming");
    expect(joinList(["dog sitting", "grooming", "dog training"], "and")).toBe("dog sitting, grooming and dog training");
  });

  it("gates expand jobs by cohort", () => {
    const expand = levelUpContent().grow.ideas.find((idea) => idea.id === "expand");
    if (!expand) throw new Error("expand idea missing");
    expect(expandJobsFor(expand.options, "explorer").map((job) => job.label)).toEqual(["Curb painting"]);
    expect(expandJobsFor(expand.options, "pathfinder").map((job) => job.id)).not.toContain("grocery");
    expect(expandJobsFor(expand.options, "maverick")).toHaveLength(5);
  });

  it("keeps the locked statement labels and their pace by position", () => {
    const content = levelUpContent();
    expect(content.statements.map((item) => [item.section, item.pace, item.label])).toEqual([
      ["customers", "quick", "Using more than one way to get my name out"],
      ["customers", "quick", "Following up with everyone who shows interest"],
      ["customers", "longer", "Asking every customer if they know someone"],
      ["customers", "longer", "Asking every customer if they'd like to book me again"],
      ["ready", "quick", "Keeping track of every job that comes in"],
      ["ready", "quick", "Confirming each job with the customer beforehand"],
      ["ready", "longer", "Nobody's appointment slipping my mind"],
      ["job", "quick", "Always showing up on time at each job"],
      ["job", "quick", "Always bringing everything I need"],
      ["job", "longer", "Having enough time to deliver a good service"],
      ["happy", "quick", "Remembering all customer names and their pets' names"],
      ["happy", "quick", "Asking every customer for feedback"],
      ["happy", "longer", "Always sending the owner a photo of their pet when I'm with them"],
      ["happy", "longer", "The customer always knowing what to expect from me"],
    ]);
    const screen = launchpadTestVentureSeed().floors.find((floor) => floor.level === 7)!.silvers[0]!.bronzes[1]!.tasks[0]!.screens[0] as LaunchpadLevelUpScreen;
    expect(screen.content.statements.map((item) => item.label)).toEqual(content.statements.map((item) => item.label));
  });
});
