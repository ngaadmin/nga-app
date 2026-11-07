// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LaunchpadAnswer, LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadShortTextScreen } from "@/lib/launchpad/content/types";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";
import { ShortTextScreen } from "@/components/launchpad/venture/screens/short-text-screen";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";

afterEach(cleanup);

const PAYLOAD = launchpadTestVentureSeed("dog-walking");
const loop = PAYLOAD.floors[0]!.silvers[1]!.bronzes[0]!.tasks[0]!.screens[0]!;
if (loop.type !== "goal-loop") throw new Error("expected the goal loop");
const goalScreens = loop.goals.map((g) => g.screen).filter((s): s is LaunchpadShortTextScreen => s.type === "short-text");

/** Every text node in the sentence, in order. */
function textNodes(root: Element): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if ((n.textContent ?? "").trim()) out.push(n as Text);
  return out;
}

function renderGoal(s: LaunchpadShortTextScreen) {
  const answers: Record<string, LaunchpadAnswer> = {};
  const setAnswer = (k: string, a: LaunchpadAnswer) => {
    answers[k] = a;
  };
  return render(
    <LaunchpadAnswersProvider value={{ iconVentureId: "dog-walking", answers: answers as LaunchpadAnswers, setAnswer, floors: PAYLOAD.floors }}>
      <ShortTextScreen screen={s} />
    </LaunchpadAnswersProvider>,
  );
}

describe("goal sentences: no line starts with a full stop", () => {
  it("covers every goal screen", () => {
    expect(goalScreens.length).toBeGreaterThanOrEqual(5);
  });

  for (const s of goalScreens) {
    it(`${s.answerKey}: punctuation after a control is bound to it in a nowrap span`, () => {
      const { container } = renderGoal(s);
      const sentence = container.querySelector("[data-sentence]")!;
      // Pick the first option of any empty dropdown, so prefilled text (Skills) renders too.
      for (const sel of sentence.querySelectorAll("select")) if (!sel.value && sel.options[1]) fireEvent.change(sel, { target: { value: sel.options[1].value } });
      for (const t of textNodes(sentence)) {
        if (!/^\s*[.,!?;:]/.test(t.textContent ?? "")) continue;
        // A leading full stop is only allowed inside a glued span, right after its control.
        const glue = t.parentElement?.closest("[data-glued-punct]");
        expect(glue, `"${t.textContent}" starts a text run outside a glued span`).toBeTruthy();
        expect(glue!.className).toMatch(/whitespace-nowrap|flex w-full/);
      }
      // No plain text span (outside a glue) begins with punctuation.
      for (const span of sentence.querySelectorAll(":scope > span:not([data-glued-punct])")) {
        expect(span.textContent ?? "").not.toMatch(/^\s*[.,!?;:]/);
      }
    });
  }

  it("Skills: the full stop sits with the skill dropdown; the next text starts with I'll", () => {
    const skills = goalScreens.find((s) => s.answerKey === "l1-goal-learn-new-skills")!;
    const { container } = renderGoal(skills);
    const select = container.querySelector("[data-sentence] select[data-field='skill']")!;
    const glue = select.closest("[data-glued-punct]")!;
    expect(glue.textContent?.trim().endsWith(".")).toBe(true);
    const nextText = glue.nextElementSibling?.textContent ?? "";
    expect(nextText.trimStart()).toMatch(/^I'll know I've done it when I can/);
  });

  it("Help others (row 7): ... in [number] [weeks|months], weeks preset", () => {
    const help = goalScreens.find((s) => s.answerKey === "l1-goal-help-others")!;
    const { container } = renderGoal(help);
    const sentence = container.querySelector("[data-sentence]")!;
    expect(sentence.querySelector("[data-field='benefit']")).toBeTruthy();
    expect(sentence.textContent).toMatch(/ in /);
    expect((sentence.querySelector("select[aria-label='Weeks or months']") as HTMLSelectElement).value).toBe("weeks");
    expect(sentence.querySelector("input[aria-label='Number']")).toBeTruthy();
  });
});
