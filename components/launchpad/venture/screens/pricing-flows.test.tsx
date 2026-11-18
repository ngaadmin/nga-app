// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { selectionAnswer, type CostsAnswer, type PriceAnswer } from "@/lib/launchpad/content/answers";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { NO_CHARITY_SAMPLE } from "@/lib/launchpad/content/pricing/calc";
import { dogWalkingJobsCoverScreen, dogWalkingSetPriceScreen } from "@/lib/launchpad/content/pricing/screens";
import { JobsCoverFlow } from "@/components/launchpad/venture/screens/jobs-cover-flow";
import { SetPriceFlow } from "@/components/launchpad/venture/screens/set-price-flow";

const floors = launchpadTestVentureSeed("dog-walking").floors;
const sample = NO_CHARITY_SAMPLE;

const costs: CostsAnswer = {
  kind: "costs",
  version: 1,
  chosenServiceIds: ["dog-walking", "dog-training"],
  startup: { marketing: [{ id: "setup", label: "Setup", amount: sample.startup }], starterGear: [], done: true },
  ongoing: [
    { serviceId: "dog-walking", label: "Dog walking", lines: [{ id: "restock", label: "Restock", amount: sample.walk.cost }], done: true },
    { serviceId: "dog-training", label: "Dog training", lines: [{ id: "restock", label: "Restock", amount: sample.training.cost }], done: true },
  ],
};

afterEach(cleanup);

function releaseNarration() {
  act(() => {
    vi.advanceTimersByTime(2000);
  });
}

describe("Set the price", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows keep as price minus cost, with no charity line, on one row", () => {
    render(
      <SetPriceFlow
        screen={dogWalkingSetPriceScreen()}
        floors={floors}
        answers={{ "l1-offer": selectionAnswer(["dog-walking", "dog-training"]), "l2-costs": costs }}
      />,
    );
    expect(document.querySelector("[data-price-art='wallet']")).toBeTruthy();
    expect(screen.getByText("Voice created with Grok")).toBeTruthy();
    expect(screen.getByText(/Later on, the tool will also help you calculate/)).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Price for Dog walking" })).toBeNull();
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getAllByText("You keep nothing yet").length).toBeGreaterThan(0);
    expect(document.querySelector("[data-kept]")?.textContent).toBe("You keep nothing yet");
    expect(screen.getByText("Pricing")).toBeTruthy();
    expect(screen.getByText(/a 30-minute walk at \$15/)).toBeTruthy();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Price for Dog walking" }), { target: { value: "15" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Price for Dog training" }), { target: { value: "25" } });
    expect(screen.getByText("You keep $14.60")).toBeTruthy();
    expect(screen.getByText("You keep $24.45")).toBeTruthy();
    expect(screen.queryByText(/I give|charity share|donate/i)).toBeNull();
    expect(document.querySelector("[data-charity-line]")).toBeNull();
    const tile = document.querySelector("[data-service-card='dog-walking']") as HTMLElement;
    const row = tile.querySelector("[data-service-tile-layout='price']") as HTMLElement;
    expect(row.className).toContain("flex-col");
    expect(within(row).getByRole("heading", { name: "Dog walking" })).toBeTruthy();
    expect(within(row).getByRole("textbox", { name: "Price for Dog walking" })).toBeTruthy();
    expect(within(row).getByText(/Cost/)).toBeTruthy();
  });

  it("shows a payload edit of the empty keep line", () => {
    const screenSpec = dogWalkingSetPriceScreen();
    render(
      <SetPriceFlow
        screen={{ ...screenSpec, copy: { ...screenSpec.copy, keepEmpty: "still open" } }}
        floors={floors}
        answers={{ "l1-offer": selectionAnswer(["dog-walking"]), "l2-costs": costs }}
      />,
    );
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("You keep still open")).toBeTruthy();
    expect(screen.queryByText("nothing yet")).toBeNull();
    expect(document.querySelector("[data-kept]")?.textContent).toBe("You keep still open");
  });
});

describe("Jobs to cover costs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("turns 3 walks and 1 training into $68.25 a week and about 2 weeks", () => {
    const price: PriceAnswer = {
      kind: "price",
      version: 1,
      prices: [
        { serviceId: "dog-walking", price: sample.walk.price, costPerJob: sample.walk.cost, keptPerJob: sample.walk.keep },
        { serviceId: "dog-training", price: sample.training.price, costPerJob: sample.training.cost, keptPerJob: sample.training.keep },
      ],
    };
    render(
      <JobsCoverFlow screen={dogWalkingJobsCoverScreen()} floors={floors} answers={{ "l2-costs": costs, "l2-price": price }} />,
    );
    expect(document.querySelector("[data-jobs-page]")?.getAttribute("data-jobs-page")).toBe("text");
    expect(document.querySelector("[data-jobs-art='coins']")).toBeTruthy();
    expect(screen.queryByText("Voice created with Grok")).toBeNull();
    expect(screen.getByText(/Your start-up gear has to be paid for/)).toBeTruthy();
    expect(screen.getByText(/As we've just seen, each job costs a little/)).toBeTruthy();
    releaseNarration();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-jobs-page]")?.getAttribute("data-jobs-page")).toBe("week");
    expect(document.querySelector("[data-weeks-needed]")?.textContent).toBe(dogWalkingJobsCoverScreen().copy.weeksEmpty);
    expect(screen.getByText(/toward paying it off/)).toBeTruthy();
    expect(screen.queryByText(/towards/)).toBeNull();
    const walking = document.querySelector("[data-service-card='dog-walking']") as HTMLElement;
    expect(walking.getAttribute("data-service-tile-layout")).toBe("row");
    for (let i = 0; i < sample.walksPerWeek; i += 1) fireEvent.click(within(walking).getByRole("button", { name: "More Dog walking jobs" }));
    const training = document.querySelector("[data-service-card='dog-training']") as HTMLElement;
    fireEvent.click(within(training).getByRole("button", { name: "More Dog training jobs" }));
    expect(document.querySelector("[data-weekly-keep]")?.textContent).toBe("$68.25");
    expect(document.querySelector("[data-weeks-needed]")?.textContent).toBe(`${sample.weeks} weeks`);
    expect(document.querySelector("[data-startup-total]")?.textContent).toBe("$80");
    const subs = [...document.querySelectorAll("[data-subtotal]")].map((node) => node.textContent);
    expect(subs).toEqual(["$43.80", "$24.45"]);
    expect(screen.queryByText(/charity|I give|donate/i)).toBeNull();
  });
});
