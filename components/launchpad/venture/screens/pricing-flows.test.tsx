// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
    { serviceId: "dog-training", label: "Dog Training", lines: [{ id: "restock", label: "Restock", amount: sample.training.cost }], done: true },
  ],
};

afterEach(cleanup);

describe("Set the price", () => {
  it("shows keep as price minus cost, with no charity line, on one row", () => {
    render(
      <SetPriceFlow
        screen={dogWalkingSetPriceScreen()}
        floors={floors}
        answers={{ "l1-offer": selectionAnswer(["dog-walking", "dog-training"]), "l2-costs": costs }}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Price for Dog walking" }), { target: { value: "15" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Price for Dog Training" }), { target: { value: "25" } });
    expect(screen.getByText("You keep $14.60")).toBeTruthy();
    expect(screen.getByText("You keep $24.45")).toBeTruthy();
    expect(screen.queryByText(/I give|charity share|donate/i)).toBeNull();
    expect(document.querySelector("[data-charity-line]")).toBeNull();
    const tile = document.querySelector("[data-service-card='dog-walking']") as HTMLElement;
    const row = tile.querySelector("[data-service-tile-layout='row']") as HTMLElement;
    expect(row.className).toContain("flex-row");
    expect(within(row).getByRole("heading", { name: "Dog walking" })).toBeTruthy();
    expect(within(row).getByRole("textbox", { name: "Price for Dog walking" })).toBeTruthy();
  });
});

describe("Jobs to cover costs", () => {
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
    const walking = document.querySelector("[data-service-card='dog-walking']") as HTMLElement;
    expect(walking.getAttribute("data-service-tile-layout")).toBe("row");
    for (let i = 0; i < sample.walksPerWeek; i += 1) fireEvent.click(within(walking).getByRole("button", { name: "More Dog walking jobs" }));
    const training = document.querySelector("[data-service-card='dog-training']") as HTMLElement;
    fireEvent.click(within(training).getByRole("button", { name: "More Dog Training jobs" }));
    expect(document.querySelector("[data-weekly-keep]")?.textContent).toBe("$68.25");
    expect(document.querySelector("[data-weeks-needed]")?.textContent).toBe(String(sample.weeks));
    expect(screen.queryByText(/charity|I give|donate/i)).toBeNull();
  });
});
