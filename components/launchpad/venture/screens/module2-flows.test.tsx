// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { selectionAnswer } from "@/lib/launchpad/content/answers";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { offerLoopScreen } from "@/lib/launchpad/content/planning/screens";
import { OfferLoopFlow } from "@/components/launchpad/venture/screens/module2-flows";
import { availabilityPhrase, packageServiceId } from "@/lib/launchpad/content/planning/catalog";

afterEach(cleanup);

describe("Decide what to sell chips", () => {
  it("loops one page per service and does not invent a new service", () => {
    const floors = launchpadTestVentureSeed("dog-walking").floors;
    render(
      <OfferLoopFlow
        screen={offerLoopScreen()}
        floors={floors}
        answers={{ "l1-offer": selectionAnswer(["dog-walking", "dog-training"]) }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Dog walking" })).toBeTruthy();
    expect(screen.queryByText(/bronze|gold|silver/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "30-minute walk" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Dog Training" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add another service" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add another service" }));
    expect(screen.getByRole("heading", { name: "Dog Training" })).toBeTruthy();
    expect(packageServiceId("overnight-stay")).toBe("dog-sitting");
    expect(packageServiceId("30-minute-walk")).toBe("dog-walking");
  });

  it("asks when once, as eight checkboxes, and summarizes the ticks", () => {
    const floors = launchpadTestVentureSeed("dog-walking").floors;
    render(
      <OfferLoopFlow
        screen={offerLoopScreen()}
        floors={floors}
        answers={{ "l1-offer": selectionAnswer(["dog-walking"]) }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "30-minute walk" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "When can you work?" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Before school" })).toBeNull();
    expect(screen.queryByRole("button", { name: "After school" })).toBeNull();
    expect(screen.getByText("I am available ….")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Morning, Weekdays" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Afternoon, Weekdays" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Morning, Weekend days" }));
    expect(screen.getByText("I am available weekday mornings and afternoons, and weekend mornings.")).toBeTruthy();
    expect(availabilityPhrase(["weekday_morning", "weekday_afternoon", "weekend_morning"])).toBe("weekday mornings and afternoons, and weekend mornings");
    expect(screen.getByRole("columnheader", { name: "Weekdays" }).tagName).toBe("TH");
    expect(screen.queryByRole("checkbox", { name: "Weekdays" })).toBeNull();
  });
});
