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
import { iconSetFor, identityChoices } from "@/lib/launchpad/content/identity-content";
import { isTaskAnswered } from "@/lib/launchpad/content/task-pages";
import { BusinessLogo, IconChip } from "@/components/launchpad/venture/identity/business-logo";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";
import { IdentityWrapUp } from "@/components/launchpad/venture/identity/identity-wrap-up";
import { LogoBuilder, NameForm, identityTaskKind } from "@/components/launchpad/venture/identity/picker-screens";
import type { LaunchpadNamePickerScreen } from "@/lib/launchpad/content/types";

afterEach(cleanup);

const SEED = launchpadTestVentureSeed("dog-walking");
// D26/D27: The Brand is l1-s3 (name then logo).
const IDENTITY: LaunchpadSilver = SEED.floors[0]!.silvers.find((s) => s.wrapUp?.type === "identity-wrap-up")!;
const SCREENS = IDENTITY.bronzes.flatMap((b) => b.tasks.flatMap((t) => t.screens));
const SWATCHES = ["#1D3F9A", "#3FB7DA", "#FFA503", "#BAC593"];
const NAME_SCREENS = SCREENS.slice(0, 3) as LaunchpadNamePickerScreen[];
const LOGO_SCREENS = SCREENS.slice(3) as LaunchpadLogoPickerScreen[];

const FULL: BusinessIdentityAnswer = {
  kind: "business-identity",
  version: 2,
  shape: "shield",
  color: "#3FB7DA",
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
const identityScreens = (p: any) => p.floors[0].silvers.find((s: any) => s.wrapUp?.type === "identity-wrap-up").bronzes.flatMap((b: any) => b.tasks.flatMap((t: any) => t.screens));

describe("The Brand seed (D26/D27)", () => {
  it("has two picker bronzes of one page each, six steps, all saving to one answer, plus the wrap-up", () => {
    expect(IDENTITY.bronzes.map((b) => b.title)).toEqual(["Name your business", "Design your logo"]);
    const tasks = IDENTITY.bronzes.flatMap((b) => b.tasks);
    expect(tasks.map((t) => t.ctaLabel)).toEqual(["Save to my workbook", "Continue"]);
    expect(tasks.map((t) => identityTaskKind(t.screens))).toEqual(["name", "logo"]);
    expect(SCREENS.map((s) => `${s.type}:${"step" in s ? s.step : ""}`)).toEqual([
      "name-picker:name",
      "name-picker:font",
      "name-picker:nameColor",
      "logo-picker:shape",
      "logo-picker:color",
      "logo-picker:icon",
    ]);
    expect(SCREENS.every((s) => "answerKey" in s && s.answerKey === IDENTITY_ANSWER_KEY)).toBe(true);
    expect(IDENTITY.wrapUp).toMatchObject({ type: "identity-wrap-up", answerKey: IDENTITY_ANSWER_KEY, placeholder: true });
  });

  it("offers the four palette swatches and three shapes; dark ink is #111C3A", () => {
    const choices = identityChoices(IDENTITY, IDENTITY_ANSWER_KEY, "dog-walking");
    expect(choices.colors.map((c) => c.hex)).toEqual(SWATCHES);
    expect(choices.colors.map((c) => c.label)).toEqual(["Navy", "Light blue", "Orange", "Pale olive"]);
    expect(choices.shapes.map((c) => c.label)).toEqual(["Circle", "Shield", "Hexagon"]);
    expect(NAME_INK_HEX).toBe("#111C3A");
    // Light blue, orange and pale olive are approved below 3:1 on white; navy and ink are strong.
    for (const hex of ["#1D3F9A", NAME_INK_HEX]) expect(contrastRatio(hex, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(choices.fonts.map((f) => f.id)).toEqual(["poppins-bold", "fredoka-semibold", "pacifico"]);
    expect(choices.nameColors.map((c) => c.id)).toEqual(["logo", "ink"]);
    expect(choices.nameMaxLength).toBe(24);
  });

  it("picks the icon set by venture, falling back to dog walking", () => {
    const icon = SCREENS[5] as Extract<LaunchpadLogoPickerScreen, { step: "icon" }>;
    expect(iconSetFor(icon, "dog-walking").map((o) => o.id)).toEqual(["paw", "bone", "dog-face"]);
    expect(iconSetFor(icon, "friendship-bracelets").map((o) => o.id)).toEqual(["bead-strand", "knot", "heart-loop"]);
    expect(iconSetFor(icon, "lemonade-stand").map((o) => o.id)).toEqual(["paw", "bone", "dog-face"]);
  });
});

describe("picker payload validation", () => {
  it("accepts the seed", () => {
    expect(checkLaunchpadVenturePayload(SEED, "dog-walking").ok).toBe(true);
  });

  it("rejects a bad swatch hex, unknown shape, icon, font or name color", () => {
    let p = mutable();
    identityScreens(p)[4].options[0].hex = "navy";
    expect(reason(p)).toMatch(/hex/);
    p = mutable();
    identityScreens(p)[3].options[0].id = "triangle";
    expect(reason(p)).toMatch(/unknown id triangle/);
    p = mutable();
    identityScreens(p)[5].iconSets["dog-walking"][0].id = "rocket";
    expect(reason(p)).toMatch(/unknown id rocket/);
    p = mutable();
    identityScreens(p)[1].options[0].id = "comic-sans";
    expect(reason(p)).toMatch(/unknown id comic-sans/);
    p = mutable();
    identityScreens(p)[2].options[1].id = "gold";
    expect(reason(p)).toMatch(/unknown id gold/);
  });

  it("rejects a missing fallback icon set, an unknown step and a name cap over 24", () => {
    let p = mutable();
    identityScreens(p)[5].fallbackVentureId = "car-wash";
    expect(reason(p)).toMatch(/fallbackVentureId/);
    p = mutable();
    identityScreens(p)[3].step = "border";
    expect(reason(p)).toMatch(/unknown logo step/);
    p = mutable();
    identityScreens(p)[0].maxLength = 40;
    expect(reason(p)).toMatch(/maxLength/);
  });

  it("rejects a wrap-up whose answer key has no pickers, or misses a step", () => {
    let p = mutable();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests break the payload on purpose
    const idSilver = (payload: any) => payload.floors[0].silvers.find((s: any) => s.wrapUp?.type === "identity-wrap-up");
    idSilver(p).wrapUp.answerKey = "someone-else";
    expect(reason(p)).toMatch(/missing shape/);
    p = mutable();
    idSilver(p).bronzes[0].tasks[0].screens.pop();
    expect(reason(p)).toMatch(/missing nameColor/);
    p = mutable();
    idSilver(p).wrapUp.type = "certificate";
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
    expect(resolveNameColor({ ...FULL, nameColor: "logo" })).toBe("#3FB7DA");
    expect(resolveNameColor({ ...FULL, nameColor: "logo", color: "#FFA503" })).toBe("#FFA503");
    expect(resolveNameColor({ ...FULL, nameColor: "ink" })).toBe(NAME_INK_HEX);
    expect(resolveNameColor({ ...EMPTY_IDENTITY })).toBe(NAME_INK_HEX);
  });

  it("every step, the name color included, needs a pick before the page can be saved", () => {
    const [nameTask, logoTask] = IDENTITY.bronzes.flatMap((b) => b.tasks);
    const none: LaunchpadAnswers = {};
    const a = (x: Partial<BusinessIdentityAnswer>) => ({ [IDENTITY_ANSWER_KEY]: { ...EMPTY_IDENTITY, ...x } });
    expect(isTaskAnswered(logoTask!, none)).toBe(false);
    expect(isTaskAnswered(logoTask!, a({ shape: "circle", color: "#1D3F9A" }))).toBe(false);
    expect(isTaskAnswered(logoTask!, a({ shape: "circle", color: "#1D3F9A", icon: "paw" }))).toBe(true);
    expect(isTaskAnswered(nameTask!, a({ name: "  ", font: "pacifico", nameColor: "ink" }))).toBe(false);
    expect(isTaskAnswered(nameTask!, a({ name: "Pup Co", font: "pacifico", color: "#FFA503" }))).toBe(false);
    expect(isTaskAnswered(nameTask!, a({ name: "Pup Co", font: "pacifico", nameColor: "ink" }))).toBe(true);
    // nameColor stays optional in the saved answer until picked.
    expect(parseBusinessIdentityAnswer({ ...FULL, nameColor: undefined })?.nameColor).toBeUndefined();
  });
});

describe("BusinessLogo renders from the payload", () => {
  it("draws the split shape (base and layer tone), the white icon and the name in the chosen font and color", () => {
    const { container } = render(<BusinessLogo answer={FULL} />);
    const svg = container.querySelector("svg[data-logo-shape]")!;
    expect(svg.getAttribute("data-logo-shape")).toBe("shield");
    expect(svg.getAttribute("data-logo-color")).toBe("#3FB7DA");
    expect(svg.querySelector("path[fill='#3FB7DA']")).not.toBeNull();
    expect(svg.querySelector("[data-logo-layer]")!.getAttribute("fill")).toBe("#39A5C4");
    expect(svg.querySelector("[data-logo-icon='paw']")).not.toBeNull();
    expect(screen.getByRole("img", { name: "Logo: shield, paw icon" })).toBeTruthy();
    const name = screen.getByText("Happy Paws");
    expect(name.getAttribute("data-name-font")).toBe("fredoka-semibold");
    expect(name.style.color).toBe("rgb(63, 183, 218)");
    expect(parseInt(name.style.fontSize, 10)).toBeGreaterThanOrEqual(19);
    expect(name.style.overflowWrap).toBe("anywhere");
  });

  it("each palette color has its own layer tone", () => {
    const tones: Record<string, string> = { "#1D3F9A": "#19347D", "#3FB7DA": "#39A5C4", "#FFA503": "#E89400", "#BAC593": "#A4B07A" };
    for (const [base, layer] of Object.entries(tones)) {
      const { container } = render(<BusinessLogo answer={{ ...FULL, shape: "hexagon", color: base }} showName={false} />);
      expect(container.querySelector("[data-logo-layer]")!.getAttribute("fill")).toBe(layer);
      cleanup();
    }
  });

  it("uses dark ink for an ink name and keeps Pacifico at 24px or more", () => {
    render(<BusinessLogo answer={{ ...FULL, nameColor: "ink", font: "pacifico", name: "Z".repeat(24) }} />);
    const name = screen.getByText("Z".repeat(24));
    expect(name.style.color).toBe("rgb(17, 28, 58)");
    expect(parseInt(name.style.fontSize, 10)).toBeGreaterThanOrEqual(24);
  });

  it("shows a dashed outline before a shape is picked, and IconChip is a white icon on a circle", () => {
    const { container } = render(
      <>
        <BusinessLogo answer={EMPTY_IDENTITY} showName={false} />
        <IconChip icon="heart-loop" color="#FFA503" label="Heart loop" />
      </>,
    );
    expect(container.querySelector("svg[data-logo-shape='none'] circle[stroke-dasharray]")).not.toBeNull();
    const chip = screen.getByRole("img", { name: "Heart loop" });
    expect(chip.getAttribute("data-logo-shape")).toBe("circle");
    expect(chip.querySelector("path[fill='#FFA503']")).not.toBeNull();
    expect(chip.querySelector("[data-logo-icon='heart-loop']")).not.toBeNull();
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
  it("the logo builder: Shape, Color, Icon tabs; each pick saves and moves to the next unset tab", () => {
    const { container } = render(
      <WithAnswers initial={{}}>
        <LogoBuilder screens={LOGO_SCREENS} />
      </WithAnswers>,
    );
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Shape", "Color", "Icon"]);
    expect(screen.queryByText(/solid|inset/i)).toBeNull();
    expect(screen.getByRole("tab", { name: "Shape" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "Hexagon" }));
    expect(screen.getByRole("tab", { name: "Color" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Pick a color that fits your business.")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Orange" }));
    expect(container.querySelector("[data-color-name]")).toBeNull(); // moved on to Icon
    // The icon step offers this business's set (friendship bracelets here).
    expect(screen.queryByRole("radio", { name: "Paw" })).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Knot" }));
    expect(saved()).toEqual({ kind: "business-identity", version: 2, shape: "hexagon", color: "#FFA503", icon: "knot" });
    fireEvent.click(screen.getByRole("tab", { name: "Color" }));
    expect(screen.getByRole("radio", { name: "Orange" }).getAttribute("aria-checked")).toBe("true");
    expect(container.querySelector("[data-color-name]")!.textContent).toBe("Orange");
    const hero = container.querySelector("[data-logo-hero] svg")!;
    expect(hero.getAttribute("data-logo-shape")).toBe("hexagon");
    expect(hero.querySelector("[data-logo-layer]")!.getAttribute("fill")).toBe("#E89400");
  });

  it("the name screen: 24-letter field, fonts in their own face, two equal colors (neither checked) with a dark ink preview", () => {
    render(
      <WithAnswers initial={{ [IDENTITY_ANSWER_KEY]: { ...EMPTY_IDENTITY, color: "#BAC593" } }}>
        <NameForm screens={NAME_SCREENS} />
      </WithAnswers>,
    );
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual(["Enter your business name", "Choose a font", "Choose a font color"]);
    const input = screen.getByLabelText("Business name") as HTMLInputElement;
    expect(input.maxLength).toBe(24);
    fireEvent.change(input, { target: { value: "The Very Best Bracelet Shop Ever" } });
    expect(saved().name).toBe("The Very Best Bracelet S");
    expect(screen.getByText("24 of 24 letters")).toBeTruthy();
    expect(screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(0);
    expect(screen.getByRole("radio", { name: "Rounded" }).querySelector("span:last-child")!.className).toContain("font-fredoka");
    fireEvent.click(screen.getByRole("radio", { name: "Rounded" }));
    expect(saved().font).toBe("fredoka-semibold");
    expect(saved().nameColor).toBeUndefined();
    const dots = () => [...document.querySelectorAll<HTMLElement>("[data-option] span.rounded-full")].map((d) => d.style.background);
    expect(dots()).toEqual(["rgb(186, 197, 147)", "rgb(17, 28, 58)"]);
    fireEvent.click(screen.getByRole("radio", { name: "Logo color" }));
    expect(saved().nameColor).toBe("logo");
    fireEvent.click(screen.getByRole("radio", { name: "Dark ink" }));
    expect(saved().nameColor).toBe("ink");
  });
});

describe("identity wrap-up", () => {
  it("is a summary only (no pick editor): logo and name in the chosen font; Continue marks it done", () => {
    let finalized = 0;
    render(
      <WithAnswers initial={{ [IDENTITY_ANSWER_KEY]: FULL }}>
        <IdentityWrapUp
          level={2}
          silverTitle="The Brand"
          wrapUp={IDENTITY.wrapUp as LaunchpadIdentityWrapUp}
          choices={identityChoices(IDENTITY, IDENTITY_ANSWER_KEY, "dog-walking")}
          onBuilding={() => {}}
          onCorridor={() => {}}
          onFinalize={() => (finalized += 1)}
        />
      </WithAnswers>,
    );
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByText(FULL.name!).getAttribute("data-name-font")).toBe(FULL.font);
    expect(document.querySelector("[data-identity-binder] [data-identity-lockup]")).toBeTruthy();
    // Drawn on the binder page: spiral binding, no placeholder frame.
    expect(screen.queryByText("Frame art TBC")).toBeNull();
    expect(document.querySelector("[data-identity-binder] [data-spiral-binding]")).toBeTruthy();
    expect(finalized).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(finalized).toBe(1);
    expect(saved().finalized).toBe(true);
  });
});
