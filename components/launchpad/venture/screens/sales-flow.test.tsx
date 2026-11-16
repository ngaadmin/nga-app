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

  it("plays the chosen channels back as bullets, then walks only those channel screens", () => {
    const screenSpec = salesDoors()[0]!.tasks[0]!.screens[0]!;
    if (screenSpec.type !== "sales") throw new Error("expected sales screen");
    const onFinish = vi.fn();
    render(<SalesFlow screen={screenSpec} floors={[]} onExit={() => {}} onFinish={onFinish} />);
    expect(screen.getByRole("heading", { name: "Pick the sales channels" })).toBeTruthy();
    expect(screen.getByText("Where will you use each of your channels?")).toBeTruthy();
    expect(document.querySelector("[data-channel-art='heart']")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Flyers or posters" })).toBeNull();
    expect(screen.getByText("Flyers or posters").closest("li")?.className).toContain("before:bg-[#0CC1E0]");
    expect(screen.queryByText(/Noticeboard/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).not.toHaveBeenCalled();
    expect(document.querySelector("[data-channel-playback]")).toBeNull();
    const heading = screen.getByText("Flyers or posters");
    expect(heading.className).toContain("text-[21px]");
    expect(heading.className).toContain("text-[#0CC1E0]");
    const prompt = screen.getByText("Where does it go up?");
    expect(prompt.className).toContain("text-[18px]");
    expect(prompt.className).toContain("text-[#19347D]");
    fireEvent.click(screen.getByRole("button", { name: "At school (with permission)" }));
    fireEvent.click(screen.getByRole("button", { name: "Next time I see them" }));
    fireEvent.click(screen.getByRole("button", { name: "In a message" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-channel-playback]")).toBeNull();
    expect(screen.getByText("An online post or online community group").className).toContain("text-[21px]");
    expect((document.querySelector("[data-scribble-large='heart']") as HTMLElement).style.width).toBe("80px");
    expect(screen.getByText("Where would you share it?").className).toContain("text-[#19347D]");
    fireEvent.click(screen.getByRole("button", { name: "On an online community page" }));
    fireEvent.click(screen.getByRole("button", { name: "At a local shop or cafe" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({
      selected: ["flyers", "friends", "online", "cards"],
      where: expect.objectContaining({ flyers: ["school"], friends: ["see", "message"], online: ["page"], cards: ["cafe"] }),
    }));
  });

  it("skips channel screens the learner did not choose earlier", () => {
    const screenSpec = salesDoors()[0]!.tasks[0]!.screens[0]!;
    if (screenSpec.type !== "sales") throw new Error("expected sales screen");
    const onFinish = vi.fn();
    render(
      <SalesFlow
        screen={screenSpec}
        floors={[]}
        answers={{ find_customers: { kind: "find-customers", version: 1, channels: ["flyers", "noticeboard"] } }}
        onExit={() => {}}
        onFinish={onFinish}
      />,
    );
    expect(screen.getByText("Flyers or posters")).toBeTruthy();
    expect(screen.queryByText("Friends and family")).toBeNull();
    expect(screen.queryByText(/Noticeboard/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "At school (with permission)" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ selected: ["flyers"] }));
    expect(screen.queryByText("Friends and family")).toBeNull();
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
    const proof = screen.getByRole("combobox", { name: "What is a strength that sets you apart from your competition?" });
    expect((within(proof).getByRole("option", { name: "Clear price before I start, so no surprises" }) as HTMLOptionElement).disabled).toBe(true);
    expect((within(proof).getByRole("option", { name: "I send a photo after every walk" }) as HTMLOptionElement).disabled).toBe(false);
  });

  it("shows one channel's result before the next channel's fields, with earlier answers kept", () => {
    const screenSpec = salesDoors()[1]!.tasks[0]!.screens[0]!;
    if (screenSpec.type !== "sales") throw new Error("expected sales screen");
    const onFinish = vi.fn();
    render(
      <SalesFlow
        screen={screenSpec}
        answers={{
          sales_channels: { kind: "sales-channels", version: 1, selected: ["flyers", "friends"], where: { flyers: ["school"], friends: ["see"] } },
          marketing_materials: {
            kind: "marketing-materials",
            version: 1,
            mainService: "dog-walking",
            hook: "too-busy",
            proof: "photo-walk",
            pieces: {},
          },
        }}
        floors={[]}
        onExit={() => {}}
        onFinish={onFinish}
      />,
    );
    const book = screen.getByRole("combobox", { name: "Flyer: how to book" }) as HTMLSelectElement;
    fireEvent.change(book, { target: { value: "message" } });
    fireEvent.change(book, { target: { value: "person" } });
    expect(book.value).toBe("person");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector("[data-material-step='show']")?.getAttribute("data-material-piece")).toBe("flyer");
    expect(screen.getByText("Too busy to walk your dog?")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "In person: how you'll finish" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const hook = screen.getByRole("combobox", { name: "What's the hook?" }) as HTMLSelectElement;
    expect(hook.value).toBe("too-busy");
    expect(document.querySelector("[data-material-piece='verbal']")?.getAttribute("data-material-step")).toBe("ask");
    const close = screen.getByRole("combobox", { name: "In person: how you'll finish" }) as HTMLSelectElement;
    fireEvent.change(close, { target: { value: "book" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/I run My business/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({
      pieces: expect.objectContaining({ "flyer-book": "person", "verbal-close": "book" }),
    }));
  });
});
