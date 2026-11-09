// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { selectionAnswer } from "@/lib/launchpad/content/answers";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { customerScreen, offerLoopScreen } from "@/lib/launchpad/content/planning/screens";
import { CustomerCheckFlow, OfferLoopFlow } from "@/components/launchpad/venture/screens/module2-flows";
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

describe("Know who your customers are", () => {
  it("keeps the offer chips, then asks for times on the next screen", () => {
    const onFinish = vi.fn();
    render(
      <CustomerCheckFlow
        screen={customerScreen()}
        answers={{
          "l2-offer": {
            kind: "offer",
            version: 1,
            offerings: [{ serviceId: "dog-walking", packages: ["30-minute-walk"], addons: ["photo-updates"] }],
            availability: [],
          },
        }}
        onFinish={onFinish}
      />,
    );
    expect(screen.getByRole("heading", { name: "Know who your customers are" })).toBeTruthy();
    expect(screen.getByText("From what you offer")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Weekdays" })).toBeNull();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "30-minute walk" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("When did your customers want walks?")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: "Morning, Weekdays" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish.mock.calls[0]?.[0].times).toEqual(["weekday_morning"]);
  });
});
