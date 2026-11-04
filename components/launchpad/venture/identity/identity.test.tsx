// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { checkLaunchpadVenturePayload } from "@/lib/launchpad/content/check-payload";
import { IDENTITY_ANSWER_KEY, launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadIdentityWrapUp, LaunchpadLogoPickerScreen, LaunchpadSilver } from "@/lib/launchpad/content/types";
import {
  BUSINESS_NAME_MAX,
  EMPTY_IDENTITY,
  NAME_INK_HEX,
  clampBusinessName,
  contrastRatio,
  parseBusinessIdentityAnswer,
  resolveNameColor,
  setIdentityField,
  type BusinessIdentityAnswer,
  type LaunchpadAnswers,
} from "@/lib/launchpad/content/identity";
import { iconSetFor, identityChoices, isTaskAnswered } from "@/lib/launchpad/content/identity-content";
import { BusinessLogo, IconChip } from "@/components/launchpad/venture/identity/business-logo";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";
import { IdentityWrapUp } from "@/components/launchpad/venture/identity/identity-wrap-up";
import { TaskScreen } from "@/components/launchpad/venture/task-screen-renderer";

afterEach(cleanup);

const SEED = launchpadTestVentureSeed("dog-walking");
const IDENTITY: LaunchpadSilver = SEED.floors[1]!.silvers[1]!;
const SCREENS = IDENTITY.bronzes.flatMap((b) => b.tasks.flatMap((t) => t.screens));
const SWATCHES = ["#031F82", "#0A8FA8", "#E5484D", "#2E9E5B", "#7B4FD6"];

const FULL: BusinessIdentityAnswer = {
  kind: "business-identity",
  version: 1,
  shape: "rounded-square",
  color: "#0A8FA8",
  icon: "paw",
  name: "Happy Paws",
  font: "fredoka-semibold",
  nameColor: "logo",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests break the payload on purpose
function mutable(): any {
  return JSON.parse(JSON.stringify(SEED));
}
function reason(value: unknown): string {
  const r = checkLaunchpadVenturePayload(value, "dog-walking");
  if (r.ok) throw new Error("expected a rejection");
  return r.reason;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const identityScreens = (p: any) => p.floors[1].silvers[1].bronzes.flatMap((b: any) => b.tasks.flatMap((t: any) => t.screens));

describe("Build your identity seed", () => {
  it("has two picker bronzes, six steps, all saving to one answer, plus the wrap-up", () => {
    expect(IDENTITY.bronzes.map((b) => b.title)).toEqual(["Design your logo", "Name your business"]);
    expect(SCREENS.map((s) => `${s.type}:${"step" in s ? s.step : ""}`)).toEqual([
      "logo-picker:shape",
      "logo-picker:color",
      "logo-picker:icon",
      "name-picker:name",
      "name-picker:font",
      "name-picker:nameColor",
    ]);
    expect(SCREENS.every((s) => "answerKey" in s && s.answerKey === IDENTITY_ANSWER_KEY)).toBe(true);
    expect(IDENTITY.wrapUp).toMatchObject({ type: "identity-wrap-up", answerKey: IDENTITY_ANSWER_KEY, placeholder: true });
  });

  it("offers the five swatches, each at least 3:1 on white (and the charcoal name color too)", () => {
    const choices = identityChoices(IDENTITY, IDENTITY_ANSWER_KEY, "dog-walking");
    expect(choices.colors.map((c) => c.hex)).toEqual(SWATCHES);
    for (const hex of [...SWATCHES, NAME_INK_HEX]) expect(contrastRatio(hex, "#FFFFFF")).toBeGreaterThanOrEqual(3);
    expect(choices.fonts.map((f) => f.id)).toEqual(["poppins-bold", "fredoka-semibold", "pacifico"]);
    expect(choices.nameColors.map((c) => c.id)).toEqual(["logo", "ink"]);
    expect(choices.nameMaxLength).toBe(24);
  });

  it("picks the icon set by venture, falling back to dog walking", () => {
    const icon = SCREENS[2] as Extract<LaunchpadLogoPickerScreen, { step: "icon" }>;
    expect(iconSetFor(icon, "dog-walking").map((o) => o.id)).toEqual(["paw", "leash", "bone"]);
    expect(iconSetFor(icon, "friendship-bracelets").map((o) => o.id)).toEqual(["bead", "heart", "braid"]);
    expect(iconSetFor(icon, "lemonade-stand").map((o) => o.id)).toEqual(["paw", "leash", "bone"]);
  });
});

describe("picker payload validation", () => {
  it("accepts the seed", () => {
    expect(checkLaunchpadVenturePayload(SEED, "dog-walking").ok).toBe(true);
  });

  it("rejects a bad swatch hex, unknown shape, icon, font or name color", () => {
    let p = mutable();
    identityScreens(p)[1].options[0].hex = "navy";
    expect(reason(p)).toMatch(/hex/);
    p = mutable();
    identityScreens(p)[0].options[0].id = "triangle";
    expect(reason(p)).toMatch(/unknown id triangle/);
    p = mutable();
    identityScreens(p)[2].iconSets["dog-walking"][0].id = "rocket";
    expect(reason(p)).toMatch(/unknown id rocket/);
    p = mutable();
    identityScreens(p)[4].options[0].id = "comic-sans";
    expect(reason(p)).toMatch(/unknown id comic-sans/);
    p = mutable();
    identityScreens(p)[5].options[1].id = "gold";
    expect(reason(p)).toMatch(/unknown id gold/);
  });

  it("rejects a missing fallback icon set, an unknown step and a name cap over 24", () => {
    let p = mutable();
    identityScreens(p)[2].fallbackVentureId = "car-wash";
    expect(reason(p)).toMatch(/fallbackVentureId/);
    p = mutable();
    identityScreens(p)[0].step = "border";
    expect(reason(p)).toMatch(/unknown logo step/);
    p = mutable();
    identityScreens(p)[3].maxLength = 40;
    expect(reason(p)).toMatch(/maxLength/);
  });

  it("rejects a wrap-up whose answer key has no pickers, or misses a step", () => {
    let p = mutable();
    p.floors[1].silvers[1].wrapUp.answerKey = "someone-else";
    expect(reason(p)).toMatch(/missing shape/);
    p = mutable();
    p.floors[1].silvers[1].bronzes[1].tasks[2].screens = [{ id: "x-1", type: "text", body: "Hi" }];
    expect(reason(p)).toMatch(/missing nameColor/);
    p = mutable();
    p.floors[1].silvers[1].wrapUp.type = "certificate";
    expect(reason(p)).toMatch(/unknown type certificate/);
  });
});

describe("business name", () => {
  it(`caps at ${BUSINESS_NAME_MAX} characters, folds line breaks and runs of spaces`, () => {
    expect(clampBusinessName("A".repeat(40))).toHaveLength(24);
    expect(clampBusinessName("  Happy\n\nPaws   Club")).toBe("Happy Paws Club");
    expect(Array.from(clampBusinessName("🐶".repeat(30)))).toHaveLength(24);
    expect(setIdentityField(EMPTY_IDENTITY, "name", "x".repeat(30)).name).toHaveLength(24);
    expect(setIdentityField({ ...EMPTY_IDENTITY, name: "Old" }, "name", "   ").name).toBeUndefined();
  });

  it("the parser trims and caps a stored name", () => {
    expect(parseBusinessIdentityAnswer({ ...FULL, name: `  ${"B".repeat(30)}  ` })?.name).toHaveLength(24);
  });
});

describe("name color", () => {
  it("unpicked renders charcoal; logo follows the logo color; ink is charcoal", () => {
    expect(resolveNameColor({ ...FULL, nameColor: undefined })).toBe(NAME_INK_HEX);
    expect(resolveNameColor({ ...FULL, nameColor: "logo" })).toBe("#0A8FA8");
    expect(resolveNameColor({ ...FULL, nameColor: "logo", color: "#E5484D" })).toBe("#E5484D");
    expect(resolveNameColor({ ...FULL, nameColor: "ink" })).toBe(NAME_INK_HEX);
    expect(resolveNameColor({ ...EMPTY_IDENTITY })).toBe(NAME_INK_HEX);
  });

  it("every step, the name color included, needs a pick before Next", () => {
    const [shape, , , nameTask, , colorTask] = IDENTITY.bronzes.flatMap((b) => b.tasks);
    const none: LaunchpadAnswers = {};
    expect(isTaskAnswered(shape!, none)).toBe(false);
    expect(isTaskAnswered(shape!, { [IDENTITY_ANSWER_KEY]: { ...EMPTY_IDENTITY, shape: "round" } })).toBe(true);
    expect(isTaskAnswered(nameTask!, { [IDENTITY_ANSWER_KEY]: { ...EMPTY_IDENTITY, name: "  " } })).toBe(false);
    expect(isTaskAnswered(colorTask!, none)).toBe(false);
    expect(isTaskAnswered(colorTask!, { [IDENTITY_ANSWER_KEY]: { ...EMPTY_IDENTITY, color: "#E5484D" } })).toBe(false);
    expect(isTaskAnswered(colorTask!, { [IDENTITY_ANSWER_KEY]: { ...EMPTY_IDENTITY, nameColor: "ink" } })).toBe(true);
    // nameColor stays optional in the saved answer until picked.
    expect(parseBusinessIdentityAnswer({ ...FULL, nameColor: undefined })?.nameColor).toBeUndefined();
  });
});

describe("BusinessLogo renders from the payload", () => {
  it("draws the shape, color, white icon and name in the chosen font and color", () => {
    const { container } = render(<BusinessLogo answer={FULL} />);
    const svg = container.querySelector("svg[data-logo-shape]")!;
    expect(svg.getAttribute("data-logo-shape")).toBe("rounded-square");
    expect(svg.getAttribute("data-logo-color")).toBe("#0A8FA8");
    expect(svg.querySelector("rect[fill='#0A8FA8']")).not.toBeNull();
    const icon = svg.querySelector("[data-logo-icon='paw']")!;
    expect(icon.querySelector("g")!.getAttribute("fill")).toBe("#fff");
    expect(screen.getByRole("img", { name: "Logo: rounded square sticker, paw icon" })).toBeTruthy();
    const name = screen.getByText("Happy Paws");
    expect(name.getAttribute("data-name-font")).toBe("fredoka-semibold");
    expect(name.style.color).toBe("rgb(10, 143, 168)");
    expect(parseInt(name.style.fontSize, 10)).toBeGreaterThanOrEqual(19);
    expect(name.style.overflowWrap).toBe("anywhere");
  });

  it("uses charcoal for an ink name and keeps Pacifico at 24px or more", () => {
    render(<BusinessLogo answer={{ ...FULL, nameColor: "ink", font: "pacifico", name: "Z".repeat(24) }} />);
    const name = screen.getByText("Z".repeat(24));
    expect(name.style.color).toBe("rgb(31, 41, 55)");
    expect(parseInt(name.style.fontSize, 10)).toBeGreaterThanOrEqual(24);
  });

  it("shows a dashed outline before a shape is picked, and IconChip is a white icon on the color", () => {
    const { container } = render(
      <>
        <BusinessLogo answer={EMPTY_IDENTITY} showName={false} />
        <IconChip icon="heart" color="#7B4FD6" label="Heart" />
      </>,
    );
    expect(container.querySelector("svg[data-logo-shape='none'] circle[stroke-dasharray]")).not.toBeNull();
    const chip = screen.getByRole("img", { name: "Heart" });
    expect(chip.querySelector("circle")!.getAttribute("fill")).toBe("#7B4FD6");
    expect(chip.querySelector("path")!.getAttribute("fill")).toBe("#fff");
  });
});

/** Answers in state, as the flow provides them. */
function WithAnswers({ initial, children }: { initial: LaunchpadAnswers; children: React.ReactNode }) {
  const [answers, setAnswers] = useState<LaunchpadAnswers>(initial);
  return (
    <LaunchpadAnswersProvider
      value={{
        iconVentureId: "friendship-bracelets",
        answers,
        setAnswer: (k, a) => setAnswers((prev) => ({ ...prev, [k]: a })),
      }}
    >
      {children}
      <output data-testid="saved">{JSON.stringify(answers)}</output>
    </LaunchpadAnswersProvider>
  );
}
const saved = () => JSON.parse(screen.getByTestId("saved").textContent!)[IDENTITY_ANSWER_KEY];

describe("picker screens", () => {
  it("each pick saves into the answer and the preview updates", () => {
    render(
      <WithAnswers initial={{}}>
        {SCREENS.slice(0, 3).map((s) => (
          <TaskScreen key={s.id} screen={s} />
        ))}
      </WithAnswers>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Round sticker" }));
    fireEvent.click(screen.getByRole("radio", { name: "Coral red" }));
    // The icon step offers this business's set (friendship bracelets here).
    expect(screen.queryByRole("radio", { name: "Paw" })).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Braided loop" }));
    expect(saved()).toEqual({ kind: "business-identity", version: 1, shape: "round", color: "#E5484D", icon: "braid" });
    expect(screen.getByRole("radio", { name: "Coral red" }).getAttribute("aria-checked")).toBe("true");
  });

  it("the name box caps at 24; the two name colors start equal (neither checked) with a charcoal preview", () => {
    render(
      <WithAnswers initial={{ [IDENTITY_ANSWER_KEY]: { ...EMPTY_IDENTITY, color: "#2E9E5B" } }}>
        <TaskScreen screen={SCREENS[3]!} />
        <TaskScreen screen={SCREENS[5]!} />
      </WithAnswers>,
    );
    const input = screen.getByLabelText("Business name") as HTMLInputElement;
    expect(input.maxLength).toBe(24);
    fireEvent.change(input, { target: { value: "The Very Best Bracelet Shop Ever" } });
    expect(saved().name).toBe("The Very Best Bracelet S");
    expect(screen.getByRole("radio", { name: "Logo color" }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("radio", { name: "Dark ink" }).getAttribute("aria-checked")).toBe("false");
    expect(saved().nameColor).toBeUndefined();
    for (const el of screen.getAllByText("The Very Best Bracelet S")) expect((el as HTMLElement).style.color).toBe("rgb(31, 41, 55)");
    fireEvent.click(screen.getByRole("radio", { name: "Logo color" }));
    expect(saved().nameColor).toBe("logo");
    for (const el of screen.getAllByText("The Very Best Bracelet S")) expect((el as HTMLElement).style.color).toBe("rgb(46, 158, 91)");
    fireEvent.click(screen.getByRole("radio", { name: "Dark ink" }));
    expect(saved().nameColor).toBe("ink");
  });
});

describe("identity wrap-up", () => {
  it("edits write back to the same answer and the learner stays on the screen; Finalize marks it done", () => {
    let finalized = 0;
    render(
      <WithAnswers initial={{ [IDENTITY_ANSWER_KEY]: FULL }}>
        <IdentityWrapUp
          level={2}
          silverTitle="Build your identity"
          wrapUp={IDENTITY.wrapUp as LaunchpadIdentityWrapUp}
          choices={identityChoices(IDENTITY, IDENTITY_ANSWER_KEY, "dog-walking")}
          onBuilding={() => {}}
          onCorridor={() => {}}
          onFinalize={() => (finalized += 1)}
        />
      </WithAnswers>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Round sticker" }));
    fireEvent.click(screen.getByRole("tab", { name: "Font" }));
    fireEvent.click(screen.getByRole("radio", { name: "Script" }));
    fireEvent.click(screen.getByRole("tab", { name: "Name" }));
    fireEvent.change(screen.getByLabelText("Business name"), { target: { value: "Paw Patrol Walks" } });
    fireEvent.click(screen.getByRole("tab", { name: "Name color" }));
    fireEvent.click(screen.getByRole("radio", { name: "Dark ink" }));
    expect(saved()).toEqual({ ...FULL, shape: "round", font: "pacifico", name: "Paw Patrol Walks", nameColor: "ink" });
    expect(screen.getByText("Paw Patrol Walks").getAttribute("data-name-font")).toBe("pacifico");
    expect(screen.getByText("Frame art TBC")).toBeTruthy();
    expect(finalized).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Finalize" }));
    expect(finalized).toBe(1);
    expect(saved().finalized).toBe(true);
  });
});
