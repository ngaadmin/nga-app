// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LAUNCHPAD_FLOOR_TYPES, LAUNCHPAD_TASK_SCREEN_TYPES, type LaunchpadTaskScreen } from "@/lib/launchpad/content/types";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { EMPTY_VENTURE_TEST_PROGRESS, completeTask } from "@/lib/launchpad/venture-test/venture-test-progress";
import { FloorTemplate, LAUNCHPAD_FLOOR_TEMPLATES } from "@/components/launchpad/venture/floor-templates";
import { BronzeDoors } from "@/components/launchpad/venture/bronze-doors";
import {
  LAUNCHPAD_TASK_SCREEN_RENDERERS,
  REGISTERED_LAUNCHPAD_TASK_SCREEN_TYPES,
  TaskScreen,
} from "@/components/launchpad/venture/task-screen-renderer";
import { VentureBuilding } from "@/components/launchpad/venture-test/venture-building";
import { buildingFloors } from "@/components/launchpad/venture-test/venture-flow";
import { OnboardingKit, OnboardingStack } from "@/components/launchpad/venture-test/venture-onboarding-art";
import { VentureOnboarding } from "@/components/launchpad/venture-test/venture-onboarding";

afterEach(cleanup);

const noop = () => {};

function renderFloor(plaques: number) {
  const silvers = Array.from({ length: plaques }, (_, i) => ({
    id: `s${i}`,
    title: `Plaque ${i + 1}`,
    state: i === 0 ? ("current" as const) : ("locked" as const),
  }));
  return render(
    <FloorTemplate
      floorType="corridor"
      level={1}
      floorName="Vision and Goals"
      goal="Know what type of business to start."
      entering={false}
      silvers={silvers}
      onBack={noop}
      onOpenSilver={noop}
    />,
  );
}

describe("floor template", () => {
  it("has a template for every floor type", () => {
    expect(Object.keys(LAUNCHPAD_FLOOR_TEMPLATES).sort()).toEqual([...LAUNCHPAD_FLOOR_TYPES].sort());
  });

  it.each([1, 2, 4])("renders the gold on the wall and %i plaque(s)", (n) => {
    renderFloor(n);
    expect(screen.getByText("LEVEL 1 GOAL")).toBeTruthy();
    expect(screen.getByText("Know what type of business to start.")).toBeTruthy();
    const plaques = screen.getAllByRole("button", { name: /^Plaque \d, / });
    expect(plaques).toHaveLength(n);
    expect(plaques[0]!.getAttribute("aria-label")).toBe("Plaque 1, up next");
  });
});

describe("bronze doors", () => {
  it.each([1, 3, 5])("draws one door per bronze (%i)", (n) => {
    render(
      <BronzeDoors
        level={1}
        silverTitle="Define the business"
        bronzes={Array.from({ length: n }, (_, i) => ({ id: `b${i}`, title: `Door ${i + 1}`, state: "locked" as const }))}
        onBuilding={noop}
        onCorridor={noop}
        onOpenBronze={noop}
      />,
    );
    expect(screen.getAllByText(/^Door \d$/)).toHaveLength(n);
  });
});

describe("task screen registry", () => {
  it("covers every task screen type", () => {
    expect([...REGISTERED_LAUNCHPAD_TASK_SCREEN_TYPES].sort()).toEqual([...LAUNCHPAD_TASK_SCREEN_TYPES].sort());
    expect(Object.keys(LAUNCHPAD_TASK_SCREEN_RENDERERS)).toHaveLength(LAUNCHPAD_TASK_SCREEN_TYPES.length);
  });

  it("fills each template's text slots", () => {
    const screens: LaunchpadTaskScreen[] = [
      {
        id: "a",
        type: "placeholder",
        blocks: [
          { kind: "text", label: "Text block (placeholder)" },
          { kind: "illustration", label: "Illustration (placeholder)" },
        ],
      },
      { id: "b", type: "text", heading: "Why it matters", body: "Pick something you enjoy.", note: "Short note" },
      { id: "c", type: "checklist", intro: "Before you start:", items: ["Ask a neighbor", "Price a walk"] },
    ];
    render(
      <>
        {screens.map((s) => (
          <TaskScreen key={s.id} screen={s} />
        ))}
      </>,
    );
    expect(screen.getByText("Illustration (placeholder)")).toBeTruthy();
    expect(screen.getByText("Why it matters")).toBeTruthy();
    expect(screen.getByText("Pick something you enjoy.")).toBeTruthy();
    expect(screen.getByText("Price a walk")).toBeTruthy();
    expect(document.querySelectorAll("[data-task-screen]")).toHaveLength(3);
  });
});

describe("r4 building from data", () => {
  const floors = launchpadTestVentureSeed("dog-walking").floors;

  it("draws one window per silver on all six floors", () => {
    const { container } = render(
      <VentureBuilding floors={buildingFloors(EMPTY_VENTURE_TEST_PROGRESS, floors)} label="Dog walking building" />,
    );
    const count = (lx: string) => container.querySelectorAll(`rect.win[data-floor="${lx}"]`).length;
    expect(["L1", "L2", "L3", "L4", "L5", "L6"].map(count)).toEqual([3, 2, 3, 1, 3, 2]);
    expect(container.querySelectorAll('rect.win[data-lit="1"]')).toHaveLength(0);
    expect(container.textContent).toContain("L6 · Growing");
  });

  it("lights a window when its silver is done", () => {
    const silver = floors[0]!.silvers[0]!;
    const p = silver.bronzes.flatMap((b) => b.tasks).reduce((acc, t) => completeTask(acc, t.id), EMPTY_VENTURE_TEST_PROGRESS);
    const { container } = render(<VentureBuilding floors={buildingFloors(p, floors)} label="Dog walking building" />);
    const lit = [...container.querySelectorAll('rect.win[data-lit="1"]')].map((el) => el.getAttribute("data-silver"));
    expect(lit).toEqual([silver.id]);
  });
});

describe("six-floor intro art (r2)", () => {
  it("kit has six numbered cards and the stack has decorative windows (static intro art)", () => {
    const { container } = render(
      <svg>
        <OnboardingKit />
        <OnboardingStack />
      </svg>,
    );
    const [kit, stack] = [...container.querySelectorAll("svg > g")];
    expect([...kit!.querySelectorAll("text")].map((t) => t.textContent)).toEqual(["1", "2", "3", "4", "5", "6", "Your business kit"]);
    // Intro stack art is decorative and not wired to silver counts (data building uses [3,2,3,1,3,2]).
    const windows = [...stack!.querySelectorAll(":scope > g")].map((g) => g.querySelectorAll('rect[width="10"]').length);
    expect(windows).toEqual([2, 2, 4, 3, 2, 3]);
  });

  it("intro building keeps every window unlit, even after progress", () => {
    const floors = launchpadTestVentureSeed("dog-walking").floors;
    const p = floors[0]!.silvers[0]!.bronzes.flatMap((b) => b.tasks).reduce((acc, t) => completeTask(acc, t.id), EMPTY_VENTURE_TEST_PROGRESS);
    const { container } = render(<VentureOnboarding floors={buildingFloors(p, floors)} onStart={noop} />);
    expect(container.querySelectorAll("rect.win")).toHaveLength(14);
    expect(container.querySelectorAll('rect.win[data-lit="1"]')).toHaveLength(0);
  });
});
