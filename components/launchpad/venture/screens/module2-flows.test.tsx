// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { selectionAnswer } from "@/lib/launchpad/content/answers";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { customerScreen, competitorScreen, offerLoopScreen } from "@/lib/launchpad/content/planning/screens";
import { CustomerCheckFlow, CompetitorFlow, OfferLoopFlow } from "@/components/launchpad/venture/screens/module2-flows";
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
    expect(screen.getByText("Services").className).toContain("text-[#0CC1E0]");
    expect(screen.getByText("Pick at least 1").className).toContain("text-[#4A5568]");
    expect(screen.getByText("Extras").className).toContain("text-[18px]");
    expect(screen.getByText("Optional").className).toContain("text-[16px]");
    expect(screen.getByRole("button", { name: "Add another service" })).toBeTruthy();
    const extra = screen.getByRole("button", { name: "Add another extra" });
    const offerScroll = document.querySelector("[data-offer-scroll]");
    expect(offerScroll?.contains(extra)).toBe(true);
    expect(offerScroll?.className).toContain("pb-6");
    expect(screen.getByRole("button", { name: "Walk one dog only" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Extra play time" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Solo walk (one dog only)" })).toBeNull();
    expect(screen.queryByText(/bronze|gold|silver/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "30-minute walk" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Dog training" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add another service" })).toBeTruthy();
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

  it("shows a payload edit of the walk-one-dog extra on the offer page", () => {
    const floors = launchpadTestVentureSeed("dog-walking").floors;
    const edited = structuredClone(offerLoopScreen());
    const extra = edited.catalogs[0]?.extras.find((item) => item.id === "solo-walk-one-dog");
    if (!extra) throw new Error("missing extra");
    extra.label = "A payload walk label";
    render(
      <OfferLoopFlow
        screen={edited}
        floors={floors}
        answers={{ "l1-offer": selectionAnswer(["dog-walking"]) }}
      />,
    );
    expect(screen.getByRole("button", { name: "A payload walk label" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Walk one dog only" })).toBeNull();
    expect(screen.getByRole("button", { name: "Extra play time" })).toBeTruthy();
  });
});

describe("Research what competitors offer", () => {
  it("shows the plain-language extra and leaves Walk one dog at a time", () => {
    render(
      <CompetitorFlow
        screen={competitorScreen()}
        answers={{
          "l2-offer": {
            kind: "offer",
            version: 1,
            offerings: [{ serviceId: "dog-walking", packages: ["30-minute-walk"], addons: ["solo-walk-one-dog"] }],
            availability: [],
          },
        }}
      />,
    );
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox", { name: "Average price 30-minute walk" }), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("option", { name: "Walk one dog only" })).toBeTruthy();
    expect((document.querySelector("[data-scribble-large='paw']") as HTMLElement).style.width).toBe("128px");
    expect(screen.queryByRole("option", { name: "Solo walk (one dog only)" })).toBeNull();
    expect(screen.getByRole("button", { name: "Walk one dog at a time" })).toBeTruthy();
    const edited = structuredClone(competitorScreen());
    const addon = edited.addons.find((item) => item.id === "solo-walk-one-dog-only");
    if (!addon) throw new Error("missing addon");
    addon.label = "A payload addon label";
    cleanup();
    render(<CompetitorFlow screen={edited} answers={{
      "l2-offer": {
        kind: "offer",
        version: 1,
        offerings: [{ serviceId: "dog-walking", packages: ["30-minute-walk"], addons: [] }],
        availability: [],
      },
    }} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Average price 30-minute walk" }), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("option", { name: "A payload addon label" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Walk one dog only" })).toBeNull();
  });

  it("asks for an average on each offered service and keeps the count on the first one", () => {
    const onFinish = vi.fn();
    render(
      <CompetitorFlow
        screen={competitorScreen()}
        answers={{
          "l2-offer": {
            kind: "offer",
            version: 1,
            offerings: [
              { serviceId: "dog-walking", packages: ["30-minute-walk", "60-minute-walk"], addons: [] },
              { serviceId: "grooming", packages: ["bath"], addons: [] },
            ],
            availability: [],
          },
        }}
        onFinish={onFinish}
      />,
    );
    expect(screen.getByLabelText("Walkers checked")).toBeTruthy();
    const walks = screen.getByRole("combobox", { name: "My competitors all offer" });
    expect(within(walks).getByRole("option", { name: "15-minute walk" })).toBeTruthy();
    expect(within(walks).getByRole("option", { name: "30-minute walk" })).toBeTruthy();
    expect(within(walks).getByRole("option", { name: "45-minute walk" })).toBeTruthy();
    expect(within(walks).getByRole("option", { name: "60-minute walk" })).toBeTruthy();
    fireEvent.change(walks, { target: { value: "60-minute-walk" } });
    expect(screen.queryByRole("textbox", { name: "Average price 60-minute walk" })).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Average price 30-minute walk" }), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByLabelText("Walkers checked")).toBeNull();
    expect(screen.getByText("My competitors all offer")).toBeTruthy();
    expect(within(screen.getByRole("combobox", { name: "My competitors all offer" })).getByRole("option", { name: "Nail trim" })).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Average price Bath" }), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByText("My competitors all offer")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish.mock.calls[0]?.[0].servicePrices).toEqual([
      { serviceId: "dog-walking", offers: ["30-minute-walk"], averages: { "30-minute-walk": 15 } },
      { serviceId: "grooming", offers: ["bath"], averages: { bath: 25 } },
    ]);
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
