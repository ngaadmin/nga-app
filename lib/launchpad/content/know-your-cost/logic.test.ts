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
const training: ChosenService = { id: "dog-training", label: "Dog Training" };
const grooming: ChosenService = { id: "grooming", label: "Grooming" };

function gearIds(ids: readonly string[]): string[] {
  return starterGearFor(screen.starterGear, ids).map((item) => item.id);
}

describe("starter gear follows the services chosen in Gold 1", () => {
  it("keeps items for the chosen services and lists a shared item once", () => {
    const gear = starterGearFor(screen.starterGear, ["dog-walking", "dog-training"]);
    const ids = gear.map((item) => item.id);
    expect(ids).toEqual(gearIds(["dog-walking", "dog-training"]));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("water-bowl");
    expect(ids).toContain("treat-pouch");
    expect(ids).toContain("poop-bag-pack");
    expect(ids).not.toContain("dog-shampoo");
    expect(gear.filter((item) => item.id === "water-bowl")).toHaveLength(1);
    expect(gear.filter((item) => item.id === "treat-pouch")).toHaveLength(1);
  });

  it("drops a duplicate catalog row that serves a second chosen service", () => {
    const shared: LaunchpadCostItem = { id: "water-bowl", label: "Water bottle and fold-up bowl", amount: 12, serviceIds: ["dog-training"] };
    const gear = starterGearFor([...screen.starterGear, shared], ["dog-walking", "dog-training"]);
    expect(gear.filter((item) => item.id === "water-bowl")).toHaveLength(1);
  });

  it("dog sitting adds no starter gear", () => {
    expect(starterGearFor(screen.starterGear, ["dog-sitting"])).toEqual([]);
  });

  it("grooming keeps shampoo and leaves the walking pack off", () => {
    const ids = gearIds(["grooming"]);
    expect(ids).toContain("dog-shampoo");
    expect(ids).toContain("hand-sanitizer");
    expect(ids).not.toContain("poop-bag-pack");
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
    expect(answer.startup.starterGear.find((line) => line.id === "treat-pouch")?.amount).toBe(0);
    const done: CostsAnswer = {
      ...answer,
      startup: { ...answer.startup, done: true },
      ongoing: answer.ongoing.map((service) => ({ ...service, done: true })),
    };
    const view = workbookView(done);
    expect(view.starterGear.find((line) => line.id === "treat-pouch")?.amount).toBe(0);
    expect(view.startupTotal).toBe(startupTotal(done));
    expect(view.grandTotal).toBe(view.startupTotal);
    const walkingJob = view.ongoing.find((service) => service.serviceId === "dog-walking");
    expect(walkingJob?.perJob).toBe(0.4);
    expect(view.ongoing.find((service) => service.serviceId === "dog-training")?.perJob).toBe(0.55);
    expect(view.grandTotal).not.toBe(view.grandTotal + (walkingJob?.perJob ?? 0));
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
        starterGear: answer.startup.starterGear.filter((line) => line.id !== "flashlight"),
        done: true,
      },
      ongoing: answer.ongoing.map((service) => ({ ...service, done: true })),
    };
    const view = workbookView(saved);
    expect(view.marketing.map((line) => [line.label, line.amount])).toEqual(
      saved.startup.marketing.map((line) => [line.label, line.amount]),
    );
    expect(view.starterGear.map((line) => line.id)).toEqual(saved.startup.starterGear.map((line) => line.id));
    expect(view.starterGear.map((line) => line.id)).not.toContain("flashlight");
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
    expect(next.startup.starterGear.map((line) => line.id)).toContain("dog-shampoo");
    expect(next.startup.starterGear.filter((line) => line.id === "water-bowl")).toHaveLength(1);
    const finished = ensureCosts({ ...first, startup: { ...first.startup, done: true } }, screen, [grooming]);
    expect(finished.startup.starterGear.map((line) => line.id)).not.toContain("dog-shampoo");
  });
});
