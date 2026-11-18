// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PricingPlaybackPage, TypicalWeekPage } from "@/components/launchpad/venture/handbook/planning-sheets";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";
import { SurfaceCopyProvider } from "@/components/launchpad/venture/surface-copy";
import { selectionAnswer, type CompetitorAnswer, type JobsAnswer, type LaunchpadAnswers, type PriceAnswer } from "@/lib/launchpad/content/answers";
import { LAUNCHPAD_SURFACE_COPY } from "@/lib/launchpad/content/surface-copy";
import { JOBS_COVER_ANSWER_KEY, SET_PRICE_ANSWER_KEY } from "@/lib/launchpad/content/pricing/screens";
import { COMPETITOR_ANSWER_KEY } from "@/lib/launchpad/content/planning/screens";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";

afterEach(cleanup);

const floors = launchpadTestVentureSeed("dog-walking").floors;

function renderPages(answers: LaunchpadAnswers, copy = LAUNCHPAD_SURFACE_COPY) {
  return render(
    <SurfaceCopyProvider value={copy}>
      <LaunchpadAnswersProvider value={{ iconVentureId: "dog-walking", answers, setAnswer: () => {}, floors }}>
        <TypicalWeekPage />
        <PricingPlaybackPage />
      </LaunchpadAnswersProvider>
    </SurfaceCopyProvider>,
  );
}

const competitor = (addons: string[]): CompetitorAnswer => ({
  kind: "competitor",
  version: 1,
  walkersChecked: 3,
  priceLow: 10,
  priceHigh: 20,
  addons,
  doDifferently: "solo-walk-one-dog-only",
});

const price = (compared: PriceAnswer["prices"][number]["comparedToOthers"]): PriceAnswer => ({
  kind: "price",
  version: 1,
  prices: [{ serviceId: "dog-walking", price: 15, costPerJob: 0.4, keptPerJob: 14.6, comparedToOthers: compared }],
});

describe("Typical week playback", () => {
  it("plays back one service and the keep from that learner's answers", () => {
    const jobs: JobsAnswer = {
      kind: "jobs",
      version: 1,
      mode: "single",
      startupTotal: 80,
      weeksNeeded: 2,
      jobsNeeded: 6,
      jobsPerWeek: 3,
      keptPerJob: 14.6,
      weeklyKeep: 0,
    };
    renderPages({
      "l1-offer": selectionAnswer(["dog-walking"]),
      [JOBS_COVER_ANSWER_KEY]: jobs,
    });
    const text = document.body.textContent ?? "";
    expect(text).toContain("In a typical week, I'll do 3 Dog walking jobs.");
    expect(text).toContain("I keep $43.80 a week.");
    expect(text).toContain("That's about 2 weeks to cover my $80 start-up costs.");
    expect(text).not.toContain("Keep $0");
  });

  it("plays back several services and adds their keep", () => {
    const jobs: JobsAnswer = {
      kind: "jobs",
      version: 1,
      mode: "multi",
      startupTotal: 80,
      weeksNeeded: 2,
      weeklyKeep: 0,
      typicalWeek: [
        { serviceId: "dog-walking", jobsPerWeek: 3, keptPerJob: 14.6, subtotal: 0 },
        { serviceId: "dog-training", jobsPerWeek: 1, keptPerJob: 24.45, subtotal: 0 },
      ],
    };
    renderPages({
      "l1-offer": selectionAnswer(["dog-walking", "dog-training"]),
      [JOBS_COVER_ANSWER_KEY]: jobs,
    });
    const text = document.body.textContent ?? "";
    expect(text).toContain("In a typical week, I'll do 3 Dog walking jobs and 1 Dog training job.");
    expect(text).toContain("I keep $68.25 a week.");
    expect(text).not.toContain("Keep $0");
  });
});

describe("What others offer playback", () => {
  it("finishes the comparison from the payload and hides an empty add-on line", () => {
    renderPages({
      "l1-offer": selectionAnswer(["dog-walking"]),
      [SET_PRICE_ANSWER_KEY]: price("lower than"),
      [COMPETITOR_ANSWER_KEY]: competitor([]),
    });
    const text = document.body.textContent ?? "";
    expect(document.querySelector("[data-price-compared]")?.textContent).toBe("Mine is lower than others.");
    expect(text).not.toContain("Mine is lower than others others");
    expect(text).not.toContain("They often include");
  });

  it("keeps the add-on line when the list has items", () => {
    renderPages({
      "l1-offer": selectionAnswer(["dog-walking"]),
      [SET_PRICE_ANSWER_KEY]: price("about the same as"),
      [COMPETITOR_ANSWER_KEY]: competitor(["solo-walk-one-dog-only"]),
    });
    const text = document.body.textContent ?? "";
    expect(document.querySelector("[data-price-compared]")?.textContent).toBe("Mine is about the same as others.");
    expect(text).toContain("They often include");
    expect(text).toContain("walk one dog only");
    expect(text).not.toContain("They often include .");
  });

  it("shows a payload edit of the comparison word", () => {
    const copy = {
      ...LAUNCHPAD_SURFACE_COPY,
      price: { ...LAUNCHPAD_SURFACE_COPY.price, lower: "cheaper than the rest" },
    } as unknown as typeof LAUNCHPAD_SURFACE_COPY;
    renderPages(
      {
        "l1-offer": selectionAnswer(["dog-walking"]),
        [SET_PRICE_ANSWER_KEY]: price("lower than"),
        [COMPETITOR_ANSWER_KEY]: competitor([]),
      },
      copy,
    );
    expect(screen.getByText("cheaper than the rest")).toBeTruthy();
    expect(document.body.textContent).not.toContain("lower than others");
  });
});

describe("What others offer count sentence", () => {
  it("uses I checked only when averages are saved, and the range line otherwise", () => {
    renderPages({
      "l1-offer": selectionAnswer(["dog-walking"]),
      [SET_PRICE_ANSWER_KEY]: price("lower than"),
      [COMPETITOR_ANSWER_KEY]: competitor(["solo-walk-one-dog-only"]),
    });
    const range = (document.body.textContent ?? "").replace(/\s+/g, " ");
    expect(range).toContain("3 other dog walkers charge $10 to $20. They often include");
    expect(range).not.toContain("I checked");
    cleanup();
    const withOffers = {
      ...competitor(["solo-walk-one-dog-only"]),
      servicePrices: [{ serviceId: "dog-walking", offers: ["15-minute-walk"], averages: { "15-minute-walk": 12 } }],
    } as unknown as CompetitorAnswer;
    renderPages({
      "l1-offer": selectionAnswer(["dog-walking"]),
      [SET_PRICE_ANSWER_KEY]: price("lower than"),
      [COMPETITOR_ANSWER_KEY]: withOffers,
    });
    const averages = (document.body.textContent ?? "").replace(/\s+/g, " ");
    expect(averages).toContain("I checked 3 other dog walkers.");
    expect(averages).not.toContain("other dog walkers charge");
  });
});

describe("What others offer punctuation", () => {
  it("has no doubled period after the per-offer prices and no leading period before Mine is", () => {
    const withOffers = {
      ...competitor(["solo-walk-one-dog-only"]),
      servicePrices: [{ serviceId: "dog-walking", offers: ["15-minute-walk"], averages: { "15-minute-walk": 12 } }],
    } as unknown as CompetitorAnswer;
    renderPages({
      "l1-offer": selectionAnswer(["dog-walking"]),
      [SET_PRICE_ANSWER_KEY]: price("lower than"),
      [COMPETITOR_ANSWER_KEY]: withOffers,
    });
    const text = (document.body.textContent ?? "").replace(/\s+/g, " ");
    expect(text).not.toMatch(/\.\s*\./);
    expect(text).toContain("$12. They often include");
    expect(document.querySelector("[data-price-compared]")?.textContent).toBe("Mine is lower than others.");
  });

  it("shows a payload edit of the Mine is lead", () => {
    const copy = {
      ...LAUNCHPAD_SURFACE_COPY,
      price: { ...LAUNCHPAD_SURFACE_COPY.price, mineIsStart: "My price is" },
    } as unknown as typeof LAUNCHPAD_SURFACE_COPY;
    renderPages({ "l1-offer": selectionAnswer(["dog-walking"]), [SET_PRICE_ANSWER_KEY]: price("lower than"), [COMPETITOR_ANSWER_KEY]: competitor([]) }, copy);
    expect(document.querySelector("[data-price-compared]")?.textContent).toBe("My price is lower than others.");
  });
});
