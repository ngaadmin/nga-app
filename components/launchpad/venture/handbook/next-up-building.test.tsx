// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NextUpBuilding } from "@/components/launchpad/venture/handbook/next-up-building";

afterEach(cleanup);

describe("NextUpBuilding", () => {
  it("greys the finished Level 1 and outlines Level 2 in orange, about 80px tall, no labels", () => {
    const { container } = render(<NextUpBuilding nextLevel={2} />);
    const svg = container.querySelector("[data-next-up-building]")!;
    expect(svg.getAttribute("height")).toBe("80");
    expect([...svg.querySelectorAll("[data-floor-done]")].map((r) => r.getAttribute("data-floor-done"))).toEqual(["1"]);
    expect(svg.querySelector("[data-floor-done='1']")?.getAttribute("fill")).toBe("#C4C9D1");
    expect(svg.querySelector("[data-floor-next='2']")?.getAttribute("stroke")).toBe("#FFA503");
    expect(svg.querySelector("text")).toBeNull();
  });
  it("greys every floor when the building is finished", () => {
    const { container } = render(<NextUpBuilding nextLevel={null} />);
    expect(container.querySelectorAll("[data-floor-done]").length).toBe(6);
    expect(container.querySelector("[data-floor-next]")).toBeNull();
  });
});
