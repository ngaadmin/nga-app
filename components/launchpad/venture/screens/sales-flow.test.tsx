// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SalesFlow } from "@/components/launchpad/venture/screens/sales-flow";
import { PROOF_FLYER_PAIRS, pairedIds } from "@/lib/launchpad/content/sales/copy";
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

  it("pairs a proof with its near-identical flyer extra and leaves the others open", () => {
    expect(pairedIds(PROOF_FLYER_PAIRS, "proof", "same-person")).toEqual(["same-visit"]);
    expect(pairedIds(PROOF_FLYER_PAIRS, "flyer-extra", "clear-price")).toEqual(["clear-price"]);
    expect(pairedIds(PROOF_FLYER_PAIRS, "proof", "photo-walk")).toEqual([]);
    const screenSpec = salesDoors()[1]!.tasks[0]!.screens[0]!;
    if (screenSpec.type !== "sales") throw new Error("expected sales screen");
    const answers = {
      sales_channels: { kind: "sales-channels" as const, version: 1 as const, selected: ["flyers"], where: { flyers: ["school"] } },
      marketing_materials: {
        kind: "marketing-materials" as const,
        version: 1 as const,
        mainService: "dog-walking",
        hook: "too-busy",
        proof: "same-person",
        pieces: {},
      },
    };
    const { unmount } = render(<SalesFlow screen={screenSpec} answers={answers} floors={[]} onExit={() => {}} onFinish={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const extra = screen.getByRole("combobox", { name: "Flyer: extra line (optional)" });
    expect((within(extra).getByRole("option", { name: "Same person, every visit" }) as HTMLOptionElement).disabled).toBe(true);
    expect((within(extra).getByRole("option", { name: "Friendly and reliable" }) as HTMLOptionElement).disabled).toBe(false);
    unmount();
    render(
      <SalesFlow
        screen={screenSpec}
        answers={{
          ...answers,
          marketing_materials: { ...answers.marketing_materials, proof: "", pieces: { "flyer-extra": "clear-price" } },
        }}
        floors={[]}
        onExit={() => {}}
        onFinish={() => {}}
      />,
    );
    const proof = screen.getByRole("combobox", { name: "What's your proof?" });
    expect((within(proof).getByRole("option", { name: "Clear price before I start, so no surprises" }) as HTMLOptionElement).disabled).toBe(true);
    expect((within(proof).getByRole("option", { name: "I send a photo after every walk" }) as HTMLOptionElement).disabled).toBe(false);
  });
});
