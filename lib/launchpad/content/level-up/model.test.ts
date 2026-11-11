import { describe, expect, it } from "vitest";
import { addMonths, checkInClipboard, expandJobsFor, fillToken, formatCheckInDate, weeklyFocusRows } from "@/lib/launchpad/content/level-up/model";
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

  it("keeps the Grow picker to one question and the five idea headings", () => {
    const grow = levelUpContent().grow;
    expect(grow.question).toBe("What will you try?");
    expect(grow.guidance).toBe("Pick up to three ideas to try.");
    expect("context" in grow).toBe(false);
    expect("salesLabel" in grow).toBe(false);
    expect("startOptions" in grow).toBe(false);
    expect(grow.ideas.map((idea) => idea.label)).toEqual([
      "Start a referral program",
      "Offer a prepaid pack",
      "Build a bundle",
      "Add a new dog service",
      "Expand your services",
    ]);
    expect(grow.ideas.every((idea) => !("context" in idea) && !("success" in idea) && !("start" in idea))).toBe(true);
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
