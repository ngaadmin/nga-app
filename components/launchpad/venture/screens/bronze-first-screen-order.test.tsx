// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CostsAnswer } from "@/lib/launchpad/content/answers";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadChoiceCaptureScreen, LaunchpadFundingScreen, LaunchpadGettingReadyScreen, LaunchpadLevelUpScreen, LaunchpadRankOrderScreen, LaunchpadSalesScreen, LaunchpadTaskScreen } from "@/lib/launchpad/content/types";
import { ChoiceCaptureScreen } from "@/components/launchpad/venture/screens/choice-capture-screen";
import { RankOrderScreen } from "@/components/launchpad/venture/screens/rank-order-screen";
import { FundingFlow } from "@/components/launchpad/venture/screens/funding-flow";
import { GettingReadyFlow } from "@/components/launchpad/venture/screens/getting-ready-flow";
import { LevelUpFlow } from "@/components/launchpad/venture/screens/level-up-flow";
import { SalesFlow } from "@/components/launchpad/venture/screens/sales-flow";

afterEach(cleanup);

const costs: CostsAnswer = {
  kind: "costs",
  version: 1,
  chosenServiceIds: ["dog-walking"],
  startup: { marketing: [{ id: "setup", label: "Setup", amount: 80 }], starterGear: [], done: true },
  ongoing: [],
};

function firstScreen(title: string): LaunchpadTaskScreen {
  const floors = launchpadTestVentureSeed().floors;
  for (const floor of floors) {
    for (const silver of floor.silvers) {
      for (const bronze of silver.bronzes) {
        if (bronze.title !== title) continue;
        const screen = bronze.tasks[0]?.screens[0];
        if (!screen) throw new Error(`no screen for ${title}`);
        return screen;
      }
    }
  }
  throw new Error(`missing bronze ${title}`);
}

function follows(earlier: Node, later: Node) {
  return (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

function assertContextFirst(context: string, guidance: string, question: string, interaction: Element) {
  const c = screen.getByText(context);
  const g = screen.getByText(guidance);
  const q = screen.getByText(question);
  expect(follows(c, g)).toBe(true);
  expect(follows(g, q)).toBe(true);
  expect(q.nextElementSibling).toBe(interaction);
  expect(c.className).toContain("mt-3");
  expect(c.className).toContain("text-[18px]");
  expect(c.className).toContain("text-[#19347D]");
  expect(g.className).toContain("mt-1.5");
  expect(g.className).toContain("text-[#4A5568]");
  expect(q.className).toContain("mt-1");
  expect(q.className).toContain("text-[#0CC1E0]");
}

function assertLead(question: string, context?: string, guidance?: string) {
  const q = screen.getByText(question);
  expect(q.className).toContain("mt-1");
  expect(q.className).toContain("text-[#0CC1E0]");
  let previous: Node = q;
  if (context) {
    const c = screen.getByText(context);
    expect(follows(previous, c)).toBe(true);
    expect(c.className).toContain("mt-3");
    expect(c.className).toContain("text-[18px]");
    expect(c.className).toContain("text-[#19347D]");
    previous = c;
  }
  if (guidance) {
    const g = screen.getByText(guidance);
    expect(follows(previous, g)).toBe(true);
    expect(g.className).toContain("mt-1.5");
    expect(g.className).toContain("text-[#4A5568]");
  }
}

describe("bronze first screens: question, then context, then guidance", () => {
  it("Pick what kind of business", () => {
    const spec = firstScreen("Pick what kind of business you'll run") as LaunchpadChoiceCaptureScreen;
    render(<ChoiceCaptureScreen screen={spec} />);
    assertLead(spec.prompt, spec.context, spec.guidance);
  });

  it("Find the why leads with context, then guidance, then the question", () => {
    const spec = firstScreen("Find the why") as LaunchpadRankOrderScreen;
    render(<RankOrderScreen screen={spec} />);
    assertContextFirst(spec.context!, spec.guidance!, spec.prompt, document.querySelector("ol[aria-label='Your ranking']")!);
  });

  it("Know your impact leads with context, then guidance, then the question", () => {
    const spec = firstScreen("Know your impact") as LaunchpadChoiceCaptureScreen;
    render(<ChoiceCaptureScreen screen={spec} />);
    assertContextFirst(spec.context!, spec.guidance!, spec.prompt, screen.getByRole("group"));
  });

  it("Get the money you need to start", () => {
    const spec = firstScreen("Get the money you need to start") as LaunchpadFundingScreen;
    render(<FundingFlow screen={spec} answers={{ "l2-costs": costs }} />);
    assertLead(spec.copy.prompt, spec.copy.context, spec.copy.guidance);
    expect(follows(screen.getByText(spec.copy.guidance), screen.getByText("$80"))).toBe(true);
  });

  it("Reflect", () => {
    const spec = firstScreen("Reflect") as LaunchpadLevelUpScreen;
    render(<LevelUpFlow screen={spec} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    assertLead(spec.content.reflect.question, spec.content.reflect.context, spec.content.reflect.guidance);
  });

  it("Improve", () => {
    const spec = firstScreen("Improve") as LaunchpadLevelUpScreen;
    render(<LevelUpFlow screen={spec} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    assertLead(spec.content.improve.question, spec.content.improve.context, spec.content.improve.guidance);
  });

  it("Grow", () => {
    const spec = firstScreen("Grow") as LaunchpadLevelUpScreen;
    render(<LevelUpFlow screen={spec} onExit={() => {}} onSave={() => {}} onFinish={() => {}} />);
    assertLead(spec.content.grow.question, spec.content.grow.context, spec.content.grow.guidance);
  });

  it.each([
    "Attract the customer",
    "How to deliver the job",
    "Wrap-up",
    "Do the practice run",
    "Polish your service",
  ])("L3 %s stays question, then guidance", (title) => {
    const spec = firstScreen(title) as LaunchpadGettingReadyScreen;
    render(<GettingReadyFlow screen={spec} floors={[]} businessName="Paws" onExit={() => {}} onFinish={() => {}} />);
    assertLead(spec.question!, undefined, spec.hint);
  });

  it("L3 Agree the job stays question, then the note", () => {
    const spec = firstScreen("Agree the job") as LaunchpadGettingReadyScreen;
    render(<GettingReadyFlow screen={spec} floors={[]} businessName="Paws" onExit={() => {}} onFinish={() => {}} />);
    const question = screen.getByText(spec.question!);
    const note = screen.getByText(/When a booking comes in/);
    expect(follows(question, note)).toBe(true);
    expect(question.className).toContain("mt-1");
    expect(question.className).toContain("text-[#0CC1E0]");
  });

  it.each([
    "Pick the sales channel(s)",
    "Develop your marketing materials",
    "Tell people about it",
  ])("L4 %s stays question, then context, then guidance", (title) => {
    const spec = firstScreen(title) as LaunchpadSalesScreen;
    render(<SalesFlow screen={spec} floors={[]} onExit={() => {}} onFinish={() => {}} />);
    assertLead(spec.question!, spec.context, spec.hint);
  });
});
