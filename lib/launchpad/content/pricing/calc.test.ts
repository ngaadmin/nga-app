import { describe, expect, it } from "vitest";
import { parseJobsAnswer, parsePriceAnswer } from "@/lib/launchpad/content/answers";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import {
  EMPTY_VENTURE_TEST_PROGRESS,
  completeTask,
  pricingBronzeStates,
} from "@/lib/launchpad/venture-test/venture-test-progress";
import {
  NO_CHARITY_SAMPLE,
  jobsNeeded,
  keptPerJob,
  weeklyKeep,
  weeksFromJobs,
  weeksFromWeeklyKeep,
} from "@/lib/launchpad/content/pricing/calc";

describe("kept per job has no charity share", () => {
  it("is price minus cost", () => {
    const { walk, training } = NO_CHARITY_SAMPLE;
    expect(keptPerJob(walk.price, walk.cost)).toBe(walk.keep);
    expect(keptPerJob(training.price, training.cost)).toBe(training.keep);
    expect(keptPerJob(15, 0.4)).toBe(14.6);
    expect(jobsNeeded(NO_CHARITY_SAMPLE.startup, walk.keep)).toBe(NO_CHARITY_SAMPLE.singleJobs);
    expect(weeksFromJobs(NO_CHARITY_SAMPLE.singleJobs, 4)).toBe(2);
  });

  it("drops charity fields and recomputes keep from price and cost", () => {
    const parsed = parsePriceAnswer({
      kind: "price",
      version: 1,
      charity_percent: 10,
      charity_share: 1.5,
      cause: "animals",
      prices: [
        { serviceId: "dog-walking", price: 15, costPerJob: 0.4, keptPerJob: 1, charity_share: 1.5 },
        { serviceId: "dog-training", price: 25, costPerJob: 0.55, keptPerJob: 0, charity_percent: 10 },
      ],
    });
    expect(parsed).toEqual({
      kind: "price",
      version: 1,
      prices: [
        { serviceId: "dog-walking", price: 15, costPerJob: 0.4, keptPerJob: 14.6 },
        { serviceId: "dog-training", price: 25, costPerJob: 0.55, keptPerJob: 24.45 },
      ],
    });
    expect(JSON.stringify(parsed)).not.toMatch(/charity|cause/i);
  });
});

describe("weekly keep and weeks for more than one service", () => {
  it("sums a typical week and rounds weeks up", () => {
    const sample = NO_CHARITY_SAMPLE;
    const weekly = weeklyKeep([
      { jobsPerWeek: sample.walksPerWeek, keptPerJob: sample.walk.keep },
      { jobsPerWeek: sample.trainingsPerWeek, keptPerJob: sample.training.keep },
    ]);
    expect(weekly).toBe(sample.weeklyKeep);
    expect(weeksFromWeeklyKeep(sample.startup, weekly)).toBe(sample.weeks);
    const parsed = parseJobsAnswer({
      kind: "jobs",
      version: 1,
      mode: "multi",
      startupTotal: sample.startup,
      charity_share: 4,
      typicalWeek: [
        { serviceId: "dog-walking", jobsPerWeek: 3, keptPerJob: 14.6, subtotal: 1 },
        { serviceId: "dog-training", jobsPerWeek: 1, keptPerJob: 24.45, subtotal: 1 },
      ],
    });
    expect(parsed?.weeklyKeep).toBe(68.25);
    expect(parsed?.weeksNeeded).toBe(2);
    expect(parsed?.typicalWeek?.map((row) => row.subtotal)).toEqual([43.8, 24.45]);
    expect(JSON.stringify(parsed)).not.toMatch(/charity/);
  });
});

describe("Pricing doors", () => {
  const pricing = launchpadTestVentureSeed("dog-walking").floors.find((floor) => floor.level === 2)?.silvers.find((silver) => silver.id === "l2-s2");
  if (!pricing) throw new Error("Pricing silver is missing.");

  it("opens Set the price after Know your cost and leaves competitor research locked", () => {
    expect(pricingBronzeStates(EMPTY_VENTURE_TEST_PROGRESS, pricing, true)).toEqual(["current", "locked", "locked", "locked"]);
    const afterCosts = completeTask(EMPTY_VENTURE_TEST_PROGRESS, "l2-s2-b1-t1");
    expect(pricingBronzeStates(afterCosts, pricing, true)).toEqual(["done", "current", "locked", "locked"]);
    const afterCompetitors = completeTask(afterCosts, "l2-s2-b2-t1");
    expect(pricingBronzeStates(afterCompetitors, pricing, true)).toEqual(["done", "done", "current", "locked"]);
    const afterPrice = completeTask(afterCompetitors, "l2-s2-b3-t1");
    expect(pricingBronzeStates(afterPrice, pricing, true)).toEqual(["done", "done", "done", "current"]);
  });
});
