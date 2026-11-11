// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SalesFlow } from "@/components/launchpad/venture/screens/sales-flow";
import { salesDoors } from "@/lib/launchpad/content/sales/screens";

afterEach(cleanup);

describe("Level 4 sales bronzes", () => {
  it("keeps the three marketing doors and not the pitch door", () => {
    expect(salesDoors().map((door) => door.title)).toEqual([
      "Pick the sales channel(s)",
      "Develop your marketing materials",
      "Tell people about it",
    ]);
    expect(salesDoors().some((door) => /pitch/i.test(door.title))).toBe(false);
  });

  it("captures channels on a white lesson and does not play the workbook sentence back", () => {
    const screenSpec = salesDoors()[0]!.tasks[0]!.screens[0]!;
    if (screenSpec.type !== "sales") throw new Error("expected sales screen");
    const onFinish = vi.fn();
    render(<SalesFlow screen={screenSpec} floors={[]} onExit={() => {}} onFinish={onFinish} />);
    expect(screen.getByRole("heading", { name: "Pick the sales channels" })).toBeTruthy();
    expect(screen.getByText("Where will you use each of your channels?")).toBeTruthy();
    expect(screen.getByText(/You've already chosen how people will hear about you/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Flyers or posters" }));
    expect(screen.queryByText(/at school \(with permission\)/)).toBeNull();
    expect(document.querySelector("[data-lesson-surface]")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
