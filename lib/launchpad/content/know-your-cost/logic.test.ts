import { describe, expect, it } from "vitest";
import { costsOf, selectionAnswer, type CostsAnswer } from "@/lib/launchpad/content/answers";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { dogWalkingKnowYourCostScreen } from "@/lib/launchpad/content/know-your-cost/dog-walking-fixture";
import {
  chosenServices,
  costsReady,
  ensureCosts,
  formatOngoingMoney,
  formatStartupMoney,
  parseOngoingInput,
  parseStartupInput,
  seedCosts,
  starterGearFor,
  startupTotal,
  stepAfterHub,
  workbookView,
  type ChosenService,
} from "@/lib/launchpad/content/know-your-cost/logic";
import { handbookPages } from "@/lib/launchpad/venture-test/handbook";
import { completeTask, EMPTY_VENTURE_TEST_PROGRESS, setProgressAnswer } from "@/lib/launchpad/venture-test/venture-test-progress";
import type { LaunchpadCostItem } from "@/lib/launchpad/content/types";

const screen = dogWalkingKnowYourCostScreen();
const walking: ChosenService = { id: "dog-walking", label: "Dog walking" };
const training: ChosenService = { id: "dog-training", label: "Dog training" };
const grooming: ChosenService = { id: "grooming", label: "Grooming" };

function gearIds(ids: readonly string[]): string[] {
  return starterGearFor(screen.starterGear, ids).map((item) => item.id);
}

describe("starter gear follows the services chosen in Gold 1", () => {
  it("unions the lookup rows and lists a shared item name once", () => {
    const gear = starterGearFor(screen.starterGear, ["dog-walking", "dog-training"]);
    const names = gear.map((item) => item.label);
    expect(names.filter((name) => name === "Treat pouch")).toHaveLength(1);
    expect(names.filter((name) => name === "Treats (starter pack)")).toHaveLength(1);
    expect(names).toContain("Water bottle and fold-up bowl");
    expect(names).toContain("Poop bags (big pack)");
    expect(names).toContain("Reflective band or clip-on light");
    expect(names).toContain("Clicker");
    expect(names).toContain("Training lead");
    expect(names).not.toContain("Dog shampoo");
    // Walking's row comes first, so its id is the one that stays.
    expect(gear.find((item) => item.label === "Treat pouch")?.id).toBe("walk-treat-pouch");
    expect(gear.find((item) => item.label === "Treat pouch")?.amount).toBe(10);
  });

  it("drops a later row with the same item name even when the id differs", () => {
    const shared: LaunchpadCostItem = { id: "extra-bowl", label: "Water bottle and fold-up bowl", amount: 99, serviceIds: ["dog-training"] };
    const gear = starterGearFor([...screen.starterGear, shared], ["dog-walking", "dog-training"]);
    expect(gear.filter((item) => item.label === "Water bottle and fold-up bowl")).toEqual([
      expect.objectContaining({ id: "walk-bowl", amount: 12 }),
    ]);
  });

  it("dog sitting and manage bookings add no starter gear", () => {
    expect(starterGearFor(screen.starterGear, ["dog-sitting"])).toEqual([]);
    expect(starterGearFor(screen.starterGear, ["manage-bookings-for-others"])).toEqual([]);
    const sitting = seedCosts(screen, [{ id: "dog-sitting", label: "Dog sitting" }]);
    expect(sitting.startup.starterGear).toEqual([]);
    expect(sitting.ongoing[0]?.lines.map((line) => [line.label, line.amount])).toEqual([
      ["Treats", 0.3],
      ["Poop bags", 0.1],
    ]);
    const bookings = seedCosts(screen, [{ id: "manage-bookings-for-others", label: "Manage bookings for others" }]);
    expect(bookings.startup.starterGear).toEqual([]);
    expect(bookings.ongoing[0]?.lines).toEqual([]);
  });

  it("grooming keeps its own gear and leaves the walking pack off", () => {
    const ids = gearIds(["grooming"]);
    expect(ids).toEqual(["groom-shampoo", "groom-towels", "groom-brush", "groom-clippers"]);
    expect(ids).not.toContain("walk-poop-pack");
  });
});

describe("Continue stays off until start-up and every service are done", () => {
  const both = seedCosts(screen, [walking, training]);

  it("is off at the start, after start-up alone, and on only when every service has a cost", () => {
    expect(costsReady(both)).toBe(false);
    const startupDone: CostsAnswer = { ...both, startup: { ...both.startup, done: true } };
    expect(costsReady(startupDone)).toBe(false);
    const one: CostsAnswer = {
      ...startupDone,
      ongoing: startupDone.ongoing.map((service) => (service.serviceId === "dog-walking" ? { ...service, done: true } : service)),
    };
    expect(costsReady(one)).toBe(false);
    const all: CostsAnswer = { ...one, ongoing: one.ongoing.map((service) => ({ ...service, done: true })) };
    expect(costsReady(all)).toBe(true);
  });

  it("with no chosen services, ongoing is done only after the learner confirms it", () => {
    const none = seedCosts(screen, []);
    expect(costsReady({ ...none, startup: { ...none.startup, done: true } })).toBe(false);
    expect(costsReady({ ...none, startup: { ...none.startup, done: true }, ongoingAcknowledged: true })).toBe(true);
  });

  it("skips the totals screen when that step is turned off", () => {
    expect(stepAfterHub(true)).toBe("totals");
    expect(stepAfterHub(false)).toBe("workbook");
  });
});

describe("amounts: $0 is allowed, start-up is whole dollars, ongoing keeps cents", () => {
  it("parses 0 and rejects decimals on start-up", () => {
    expect(parseStartupInput("0")).toBe(0);
    expect(parseStartupInput("15")).toBe(15);
    expect(parseStartupInput("15.5")).toBeNull();
    expect(parseStartupInput("")).toBeNull();
    expect(parseStartupInput("0.00")).toBeNull();
  });

  it("parses cents on ongoing, including 0", () => {
    expect(parseOngoingInput("0")).toBe(0);
    expect(parseOngoingInput("0.05")).toBe(0.05);
    expect(parseOngoingInput("0.40")).toBe(0.4);
    expect(parseOngoingInput("0.10")).toBe(0.1);
    expect(parseOngoingInput("0.005")).toBeNull();
    expect(parseOngoingInput("1.2.3")).toBeNull();
  });

  it("keeps a $0 starter row in the total and does not roll ongoing cents into the grand total", () => {
    const answer = seedCosts(screen, [walking, training]);
    const pouch = answer.startup.starterGear.find((line) => line.label === "Treat pouch");
    expect(pouch?.amount).toBe(10);
    const withZero: CostsAnswer = {
      ...answer,
      startup: {
        ...answer.startup,
        starterGear: answer.startup.starterGear.map((line) => (line.id === pouch?.id ? { ...line, amount: 0 } : line)),
        done: true,
      },
      ongoing: answer.ongoing.map((service) => ({ ...service, done: true })),
    };
    const view = workbookView(withZero);
    expect(view.starterGear.find((line) => line.label === "Treat pouch")?.amount).toBe(0);
    expect(view.startupTotal).toBe(startupTotal(withZero));
    expect(view.grandTotal).toBe(view.startupTotal);
    const walkingJob = view.ongoing.find((service) => service.serviceId === "dog-walking");
    expect(walkingJob?.perJob).toBe(0.3);
    expect(view.ongoing.find((service) => service.serviceId === "dog-training")?.perJob).toBe(0.4);
    expect(formatStartupMoney(0, "USD")).toBe("$0");
    expect(formatStartupMoney(view.startupTotal, "USD")).toMatch(/^\$\d+$/);
    expect(formatOngoingMoney(0.4, "USD")).toBe("$0.40");
    expect(formatOngoingMoney(0, "USD")).toBe("$0.00");
  });
});

describe("workbook My costs mirrors the saved answer", () => {
  it("lists the same marketing, starter gear, and per-job totals", () => {
    const answer = seedCosts(screen, [walking, grooming]);
    const saved: CostsAnswer = {
      ...answer,
      startup: {
        marketing: answer.startup.marketing.map((line) => (line.id === "flyers" ? { ...line, amount: 0 } : line)),
        starterGear: answer.startup.starterGear.filter((line) => line.id !== "walk-reflective"),
        done: true,
      },
      ongoing: answer.ongoing.map((service) => ({ ...service, done: true })),
    };
    const view = workbookView(saved);
    expect(view.marketing.map((line) => [line.label, line.amount])).toEqual(
      saved.startup.marketing.map((line) => [line.label, line.amount]),
    );
    expect(view.starterGear.map((line) => line.id)).toEqual(saved.startup.starterGear.map((line) => line.id));
    expect(view.starterGear.map((line) => line.id)).not.toContain("walk-reflective");
    expect(view.ongoing.map((service) => service.label)).toEqual(["Dog walking", "Grooming"]);
    expect(view.marketing.find((line) => line.id === "flyers")?.amount).toBe(0);
  });

  it("shows on the handbook once the task is saved, and not before", () => {
    const floors = launchpadTestVentureSeed("dog-walking").floors;
    const chosen = chosenServices(floors, { "l1-offer": selectionAnswer(["dog-walking", "dog-training"]) }, "l1-offer");
    expect(chosen.map((service) => service.id)).toEqual(["dog-walking", "dog-training"]);
    const answer = seedCosts(screen, chosen);
    const saved = setProgressAnswer(completeTask(EMPTY_VENTURE_TEST_PROGRESS, "l2-s2-b1-t1"), "l2-costs", {
      ...answer,
      startup: { ...answer.startup, done: true },
      ongoing: answer.ongoing.map((service) => ({ ...service, done: true })),
    });
    expect(costsOf(saved.answers, "l2-costs")?.startup.done).toBe(true);
    expect(handbookPages(EMPTY_VENTURE_TEST_PROGRESS, floors).some((page) => page.kind === "costs")).toBe(false);
    const pages = handbookPages(saved, floors);
    expect(pages.some((page) => page.kind === "costs")).toBe(false);
    const withSilver = setProgressAnswer(
      {
        ...saved,
        completedTaskIds: [
          "l2-s2-b1-t1",
          ...floors[0]!.silvers[0]!.bronzes.flatMap((b) => b.tasks.map((t) => t.id)),
        ],
      },
      "l2-costs",
      saved.answers!["l2-costs"]!,
    );
    expect(handbookPages(withSilver, floors).some((page) => page.kind === "costs")).toBe(true);
  });

  it("refreshes starter gear when the chosen services change and the list is not finished", () => {
    const first = seedCosts(screen, [walking]);
    const next = ensureCosts(first, screen, [walking, grooming]);
    expect(next.startup.starterGear.map((line) => line.id)).toContain("groom-shampoo");
    expect(next.startup.starterGear.filter((line) => line.label === "Treat pouch")).toHaveLength(1);
    const finished = ensureCosts({ ...first, startup: { ...first.startup, done: true } }, screen, [grooming]);
    expect(finished.startup.starterGear.map((line) => line.id)).not.toContain("groom-shampoo");
  });
});
