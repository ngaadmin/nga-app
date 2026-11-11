// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadDeliveryScreen, LaunchpadFloor } from "@/lib/launchpad/content/types";
import type { CostsAnswer, LaunchpadAnswer, PriceAnswer } from "@/lib/launchpad/content/answers";
import { DeliveryFlow } from "@/components/launchpad/venture/screens/delivery-flow";

afterEach(cleanup);

const floors = launchpadTestVentureSeed().floors;

function deliveryScreen(title: string): LaunchpadDeliveryScreen {
  for (const floor of floors)
    for (const silver of floor.silvers)
      for (const bronze of silver.bronzes)
        for (const task of bronze.tasks)
          for (const screen of task.screens)
            if (screen.type === "delivery" && screen.title === title) return screen;
  throw new Error(`missing ${title}`);
}

const answers: Record<string, LaunchpadAnswer> = {
  "l1-offer": { kind: "selection", version: 1, selected: ["dog-walking"] },
  deliver_the_job: { kind: "deliver-job", version: 1, beforeHow: "text", afterHow: "photo" },
  wrap_up: { kind: "wrap-job", version: 1, paymentHow: ["transfer"], feedbackHow: ["text"] },
  "l2-costs": {
    kind: "costs",
    version: 1,
    chosenServiceIds: ["dog-walking"],
    startup: {
      marketing: [],
      starterGear: [{ id: "bowl", label: "Water bottle and fold-up bowl", amount: 12 }],
      done: true,
    },
    ongoing: [{ serviceId: "dog-walking", label: "Dog walking", lines: [{ id: "bags", label: "Poop bags", amount: 0.4 }], done: true }],
  } satisfies CostsAnswer,
  "l2-price": {
    kind: "price",
    version: 1,
    prices: [{ serviceId: "dog-walking", price: 15, costPerJob: 0.4, keptPerJob: 14.6 }],
  } satisfies PriceAnswer,
};

const follows = (earlier: Node, later: Node) => (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

function renderDelivery(screenSpec: LaunchpadDeliveryScreen, onFinish = vi.fn(), floorList: readonly LaunchpadFloor[] = floors) {
  render(<DeliveryFlow screen={screenSpec} answers={answers} floors={floorList} onExit={() => {}} onFinish={onFinish} />);
  return onFinish;
}

describe("Level 5 Delivery", () => {
  it("shows a payload edit on Get ready and keeps the question, context, then guidance", () => {
    const spec = deliveryScreen("Get ready for the job");
    const edited = structuredClone(spec);
    edited.question = "What will you do before the job?";
    renderDelivery(edited);
    expect(screen.getByText("What will you do before the job?")).toBeTruthy();
    expect(screen.queryByText(spec.question)).toBeNull();
    const question = screen.getByText(edited.question);
    const context = screen.getByText(edited.context!);
    const guidance = screen.getByText(edited.guidance!);
    expect(follows(question, context)).toBe(true);
    expect(follows(context, guidance)).toBe(true);
    expect(screen.getByText("text").className).toContain("font-semibold");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("combobox", { name: edited.ready!.aboutBefore.trim() }), { target: { value: "included" } });
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("saves the four Get ready picks and shows the gear list from Know your cost", () => {
    const spec = deliveryScreen("Get ready for the job");
    const onFinish = renderDelivery(spec);
    fireEvent.change(screen.getByRole("combobox", { name: spec.ready!.aboutBefore.trim() }), { target: { value: "day-time" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByRole("combobox", { name: spec.ready!.travelBefore.trim() }), { target: { value: "walking" } });
    fireEvent.change(screen.getByRole("combobox", { name: spec.ready!.leaveBefore.trim() }), { target: { value: "min-15" } });
    fireEvent.change(screen.getByRole("combobox", { name: spec.ready!.packBefore.trim() }), { target: { value: "night-before" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(spec.ready!.packTitle)).toBeTruthy();
    expect(screen.getByText("Water bottle and fold-up bowl")).toBeTruthy();
    expect(screen.getByText(spec.ready!.note)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish.mock.calls[0]?.[0]).toEqual({
      kind: "get-ready",
      version: 1,
      remindAbout: "day-time",
      travelHow: "walking",
      leaveEarly: "min-15",
      packWhen: "night-before",
    });
  });

  it("replays the wrap-up plan and saves the three new picks", () => {
    const spec = deliveryScreen("Wrap up the job");
    const edited = structuredClone(spec);
    edited.wrap = { ...edited.wrap!, note: "Keep the payment private." };
    const onFinish = renderDelivery(edited);
    expect(screen.queryByText("Keep the payment private.")).toBeNull();
    expect(screen.getByText("a photo").className).toContain("font-semibold");
    expect(screen.getByText("bank transfer").className).toContain("font-semibold");
    expect(screen.getByText("text").className).toContain("font-semibold");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByRole("combobox", { name: edited.wrap!.askPayBefore.trim() }), { target: { value: "with-proof" } });
    fireEvent.change(screen.getByRole("combobox", { name: edited.wrap!.askBefore.trim() }), { target: { value: "how-went" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Keep the payment private.")).toBeTruthy();
    expect(screen.queryByText(spec.wrap!.note)).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: edited.wrap!.whenBefore.trim() }), { target: { value: "same-evening" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish.mock.calls[0]?.[0]).toEqual({
      kind: "wrap-up-job",
      version: 1,
      paymentWhen: "with-proof",
      feedbackQuestion: "how-went",
      trackerWhen: "same-evening",
    });
  });

  it("works out what was kept and can record another job", () => {
    const spec = deliveryScreen("Record the job and see what's left");
    const edited = structuredClone(spec);
    edited.question = "What did this job leave you?";
    const onFinish = renderDelivery(edited);
    expect(screen.getByText("What did this job leave you?")).toBeTruthy();
    expect(screen.queryByText(spec.question)).toBeNull();
    expect(screen.getByText("Dog walking").className).toContain("font-semibold");
    expect(screen.getByText("$15").className).toContain("font-semibold");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const paid = screen.getByRole("textbox", { name: edited.record!.paidBefore.trim() }) as HTMLInputElement;
    fireEvent.change(paid, { target: { value: "15" } });
    expect(screen.getByText("$0.40").className).toContain("font-semibold");
    expect(screen.getByText("$14.60").className).toContain("font-semibold");
    expect(screen.queryByText(edited.record!.lowKeep)).toBeNull();
    fireEvent.change(paid, { target: { value: "0" } });
    expect(screen.getByText(edited.record!.lowKeep)).toBeTruthy();
    fireEvent.change(paid, { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: edited.record!.addJob }));
    expect(screen.getByText("What did this job leave you?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByRole("textbox", { name: edited.record!.paidBefore.trim() }), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish.mock.calls[0]?.[0]).toEqual({
      kind: "record-job",
      version: 1,
      jobs: [
        { serviceId: "dog-walking", paid: 15 },
        { serviceId: "dog-walking", paid: 20 },
      ],
    });
  });
});
