// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadSalesScreen } from "@/lib/launchpad/content/types";
import type { OrderSystemAnswer } from "@/lib/launchpad/content/answers";
import { OrderSystemFlow } from "@/components/launchpad/venture/screens/order-system-flow";

afterEach(cleanup);

function orderScreen(): LaunchpadSalesScreen {
  const screenSpec = launchpadTestVentureSeed().floors
    .find((floor) => floor.level === 4)!
    .silvers.find((silver) => silver.id === "l4-s2")!
    .bronzes[0]!.tasks[0]!.screens[0]!;
  if (screenSpec.type !== "sales" || !screenSpec.order) throw new Error("order screen missing");
  return screenSpec;
}

const follows = (earlier: Node, later: Node) => (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

describe("Set up your order system", () => {
  it("puts the question, context, and guidance in that order, and a payload edit shows on screen", () => {
    const spec = orderScreen();
    const edited = structuredClone(spec);
    edited.order = { ...edited.order!, question: "Where will the orders live?", trackerLead: "Orders stay in" };
    render(<OrderSystemFlow screen={edited} onExit={() => {}} onFinish={() => {}} />);
    expect(screen.getByText("Where will the orders live?")).toBeTruthy();
    expect(screen.queryByText(spec.order!.question)).toBeNull();
    expect(screen.getByText("Orders stay in")).toBeTruthy();
    expect(screen.queryByText(spec.order!.trackerLead)).toBeNull();
    const question = screen.getByText("Where will the orders live?");
    const context = screen.getByText(edited.order!.context);
    const guidance = screen.getByText(edited.order!.guidance);
    expect(follows(question, context)).toBe(true);
    expect(follows(context, guidance)).toBe(true);
    expect(screen.queryByText(/Flyers or posters|You'll be telling people/)).toBeNull();
    expect(screen.getByRole("combobox", { name: "Orders stay in" })).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect("extraLabel" in edited.order! || "extraMax" in edited.order!).toBe(false);
    expect(screen.getAllByText(edited.order!.emptyLabel).length).toBeGreaterThan(0);
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("saves the tracker and the default reminder", () => {
    const spec = orderScreen();
    const copy = spec.order!;
    const onFinish = vi.fn();
    render(<OrderSystemFlow screen={spec} onExit={() => {}} onFinish={onFinish} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("combobox", { name: copy.trackerLead }), { target: { value: "notebook" } });
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(copy.playbackTitle)).toBeTruthy();
    expect(screen.getByText(copy.templateStrong).className).toContain("font-semibold");
    expect(screen.getByText(copy.repeatLine)).toBeTruthy();
    expect(screen.getByText(copy.checkLine)).toBeTruthy();
    expect(screen.getAllByText("the night before").length).toBeGreaterThan(0);
    expect(document.querySelector("[data-scribble-large='star']")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const saved = onFinish.mock.calls[0]?.[0] as OrderSystemAnswer;
    expect(saved).toEqual({ kind: "order-system", version: 1, tracker: "notebook", reminder: "night-before" });
    expect(saved).not.toHaveProperty("trackerExtra");
  });
});
