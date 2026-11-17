// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";
import { recordUsageEvent } from "@/lib/usage/record-usage-event";

vi.mock("@/lib/usage/record-usage-event", () => ({ recordUsageEvent: vi.fn() }));
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadSurfaceCopy } from "@/lib/launchpad/content/surface-copy";
import type { LaunchpadVenturePayload } from "@/lib/launchpad/content/types";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  vi.mocked(recordUsageEvent).mockClear();
});

function view(payload: LaunchpadVenturePayload): LaunchpadVentureView {
  return { ok: true, payload, versionId: "version-1", contentHash: "hash-1", source: "current" };
}

const titles = { "dog-walking": "Dog walking" };

describe("signed-in Launchpad route", () => {
  it("renders the shop-front carousel with only Dog walking open", async () => {
    render(
      <VentureFlow
        live
        initialVentureId="dog-walking"
        ventureTitles={titles}
        ventures={{ "dog-walking": view(launchpadTestVentureSeed("dog-walking")) }}
        reset
        shortcut={{ kind: "all", land: "rooftop" }}
      />,
    );
    const open = await screen.findAllByRole("button", { name: /\. Open$/ });
    expect(open.map((button) => button.getAttribute("aria-label"))).toEqual(["Dog walking. Open"]);
    expect(screen.getAllByRole("button", { name: /\. Locked$/ }).length).toBeGreaterThan(1);
    expect(screen.queryByRole("button", { name: "Lawn mowing. Open" })).toBeNull();
    expect(screen.queryByText("You've built your business!")).toBeNull();
    expect(screen.queryByText("120")).toBeNull();
    expect(document.querySelector("[data-launchpad-route='live']")).toBeTruthy();
    expect(recordUsageEvent).toHaveBeenCalledTimes(1);
    expect(recordUsageEvent).toHaveBeenCalledWith("launchpad_visit");
  });

  it("opens Dog walking in the test route shell, with the dashboard column only on the home", async () => {
    render(
      <VentureFlow
        live
        initialVentureId={null}
        ventureTitles={titles}
        ventures={{ "dog-walking": view(launchpadTestVentureSeed("dog-walking")) }}
        reset={false}
      />,
    );
    expect(await screen.findByRole("button", { name: "Dog walking. Open" })).toBeTruthy();
    expect(document.querySelector("[data-launchpad-route='live']")).toBeTruthy();
    expect(document.querySelector("[data-launchpad-focus]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dog walking. Open" }));
    expect(document.querySelector("[data-launchpad-frame]")).toBeTruthy();
    expect(document.querySelector("[data-launchpad-focus]")).toBeNull();
    expect(document.querySelector("[data-focus-mode]")).toBeNull();
    expect(screen.queryByLabelText("3 day streak")).toBeNull();
    expect(screen.queryByRole("link", { name: "Subscription" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Start building" }));
    expect(screen.getByRole("button", { name: "Go to Level 1" })).toBeTruthy();
    expect(document.querySelector("[data-launchpad-frame]")?.className).toContain("overflow-hidden");
  });

  it("does not record a visit on the test route", async () => {
    render(
      <VentureFlow
        initialVentureId={null}
        ventureTitles={titles}
        ventures={{ "dog-walking": view(launchpadTestVentureSeed("dog-walking")) }}
        reset={false}
      />,
    );
    expect(await screen.findByRole("button", { name: "Dog walking. Open" })).toBeTruthy();
    expect(recordUsageEvent).not.toHaveBeenCalled();
  });

  it("ignores rooftop, level, and complete shortcuts", async () => {
    const payload = launchpadTestVentureSeed("dog-walking");
    const { unmount } = render(
      <VentureFlow
        live
        initialVentureId="dog-walking"
        ventureTitles={titles}
        ventures={{ "dog-walking": view(payload) }}
        reset={false}
        shortcut={{ kind: "level", level: 4 }}
        openBronze="l1-s1-b1"
      />,
    );
    expect(await screen.findByRole("button", { name: "Dog walking. Open" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: payload.floors[3]!.name })).toBeNull();
    unmount();
    render(
      <VentureFlow
        live
        initialVentureId="dog-walking"
        ventureTitles={titles}
        ventures={{ "dog-walking": view(payload) }}
        reset
        shortcut={{ kind: "all", land: "building" }}
      />,
    );
    expect(await screen.findByRole("button", { name: "Dog walking. Open" })).toBeTruthy();
    expect(screen.queryByText("Go to the rooftop")).toBeNull();
  });

  it("shows the not-available screen when dog walking content is missing", async () => {
    render(
      <VentureFlow
        live
        initialVentureId={null}
        ventureTitles={titles}
        ventures={{ "dog-walking": { ok: false } }}
        reset={false}
      />,
    );
    expect(await screen.findByText("This business kit isn't available right now")).toBeTruthy();
    expect(screen.getByText("Please try again in a few minutes.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Dog walking. Open" })).toBeNull();
  });

  it("shows a payload edit on the home", async () => {
    const payload = structuredClone(launchpadTestVentureSeed("dog-walking")) as LaunchpadVenturePayload;
    const surface = payload.surface!;
    payload.surface = {
      ...surface,
      home: { ...surface.home, businessIdeas: "Shops from the payload" },
    } as unknown as LaunchpadSurfaceCopy;
    render(
      <VentureFlow
        live
        initialVentureId={null}
        ventureTitles={titles}
        ventures={{ "dog-walking": view(payload) }}
        reset={false}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Shops from the payload" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Shops from the payload" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Business Ideas" })).toBeNull();
  });
});
