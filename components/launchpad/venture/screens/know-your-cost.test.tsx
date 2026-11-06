// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { selectionAnswer, type CostsAnswer, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { findKnowYourCost } from "@/lib/launchpad/content/know-your-cost/logic";
import { KnowYourCostFlow } from "@/components/launchpad/venture/screens/know-your-cost-flow";

const floors = launchpadTestVentureSeed("dog-walking").floors;
const found = findKnowYourCost(floors);
if (!found) throw new Error("Know your cost is missing from the seed.");
const costScreen = found.screen;

afterEach(cleanup);

function Harness({ onFinish }: { onFinish?: (answer: CostsAnswer) => void }) {
  const [answers, setAnswers] = useState<LaunchpadAnswers>({ "l1-offer": selectionAnswer(["dog-walking", "dog-training"]) });
  return (
    <KnowYourCostFlow
      screen={costScreen}
      floors={floors}
      answers={answers}
      setAnswer={(key, answer) => setAnswers((prev) => ({ ...prev, [key]: answer }))}
      onFinish={onFinish}
    />
  );
}

describe("Know your cost flow", () => {
  it("gates Continue, allows $0, keeps cents on a job, and mirrors that on My costs", () => {
    const finished = { current: null as CostsAnswer | null };
    render(<Harness onFinish={(answer) => (finished.current = answer)} />);

    const cont = screen.getByRole("button", { name: "Continue" });
    expect((cont as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Continue stays off until both sections are done.")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Add costs" })[0]!);
    expect(screen.getByText("Buy once to get started — you'll keep using these on jobs.")).toBeTruthy();
    expect(screen.getByText("Water bottle and fold-up bowl")).toBeTruthy();
    expect(screen.getByText("Poop bags (big pack)")).toBeTruthy();
    expect(screen.queryByText("Dog shampoo")).toBeNull();
    expect(screen.getAllByText("Treat pouch")).toHaveLength(1);
    expect(screen.getAllByText("Hand sanitizer")).toHaveLength(1);
    const pouch = screen.getByRole("textbox", { name: "Amount for Treat pouch" }) as HTMLInputElement;
    expect(pouch.value).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: "Remove Notebook for owners' notes" }));
    expect(screen.queryByText("Notebook for owners' notes")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Add costs" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Calculate the cost" })[0]!);
    expect(screen.getByRole("textbox", { name: "Amount for Poop bags" }).getAttribute("value") ?? (screen.getByRole("textbox", { name: "Amount for Poop bags" }) as HTMLInputElement).value).toBe("0.05");
    fireEvent.change(screen.getByRole("textbox", { name: "Amount for Treats" }), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Calculate the cost" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    const ready = screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
    expect(ready.disabled).toBe(false);
    fireEvent.click(ready);
    expect(screen.getByText("Grand total to start")).toBeTruthy();
    const grand = document.querySelector("[data-grand-total]")?.textContent;
    expect(grand).toMatch(/^\$\d+$/);
    expect(screen.getByText("Dog walking").parentElement?.textContent).toMatch(/\$0\.\d\d/);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    const book = document.querySelector("[data-cost-workbook]") as HTMLElement;
    expect(book).toBeTruthy();
    expect(within(book).getByRole("heading", { name: "My costs" })).toBeTruthy();
    expect(within(book).queryByText("Notebook for owners' notes")).toBeNull();
    expect(within(book).getByText("Treat pouch")).toBeTruthy();
    expect(within(book).getByText("$0")).toBeTruthy();
    expect(within(book).getByText("Dog walking")).toBeTruthy();
    expect(within(book).getByText("Dog Training")).toBeTruthy();
    expect(within(book).queryByRole("button", { name: "Edit start-up total" })).toBeNull();
    expect(within(book).getByRole("button", { name: "Edit start-up costs" })).toBeTruthy();
    expect(within(book).getByRole("button", { name: "Edit Dog walking" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(finished.current?.startup.done).toBe(true);
    expect(finished.current?.ongoing.every((service) => service.done)).toBe(true);
    expect(finished.current?.ongoing.find((service) => service.serviceId === "dog-walking")?.lines.find((line) => line.id === "treats")?.amount).toBe(0);
  });
});
