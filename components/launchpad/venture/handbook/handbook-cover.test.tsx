// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IDENTITY_ANSWER_KEY, launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { fieldsAnswer, rankingAnswer, selectionAnswer, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadIdentityWrapUp } from "@/lib/launchpad/content/types";
import { handbookPages } from "@/lib/launchpad/venture-test/handbook";
import { applyVentureTestShortcut, EMPTY_VENTURE_TEST_PROGRESS } from "@/lib/launchpad/venture-test/venture-test-progress";
import { HandbookPage } from "@/components/launchpad/venture/handbook/handbook-page";
import { IdentityWrapUp } from "@/components/launchpad/venture/identity/identity-wrap-up";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";

afterEach(cleanup);

const FLOORS = launchpadTestVentureSeed("dog-walking").floors;
const progress = applyVentureTestShortcut({ kind: "through-silver", silverId: "l1-s1" }, FLOORS, EMPTY_VENTURE_TEST_PROGRESS)!.progress;
const cover = handbookPages(progress, FLOORS)[0]!;
const wrapUp = FLOORS.flatMap((f) => f.silvers).find((s) => s.wrapUp?.type === "identity-wrap-up")!.wrapUp as LaunchpadIdentityWrapUp;

const L1: LaunchpadAnswers = {
  "l1-offer": selectionAnswer(["dog-walking", "grooming"]),
  "l1-why": rankingAnswer(["make-money", "help-others", "learn-new-skills", "be-my-own-boss"], ["learn-new-skills", "be-my-own-boss"]),
  "l1-cause": selectionAnswer(["animals"]),
  "l1-goal-make-money": fieldsAnswer({ amount: 200, currency: "USD", timeframeNumber: 3, timeframeUnit: "months", savingFor: "a new bike" }, false),
  "l1-goal-help-others": fieldsAnswer({ customerCount: 10, benefit: "have-a-washed-and-groomed-dog", timeframeNumber: 6, timeframeUnit: "months" }, false),
  "l1-goal-support-a-cause": fieldsAnswer({ donatePercent: 10 }, false),
};
const ID = { kind: "business-identity", version: 2, shape: "shield", color: "#1D3F9A", icon: "paw", name: "Happy Paws", font: "fredoka-semibold", nameColor: "logo" };

function renderCover(answers: LaunchpadAnswers) {
  return render(
    <LaunchpadAnswersProvider value={{ iconVentureId: "dog-walking", answers, setAnswer: () => {}, floors: FLOORS }}>
      <HandbookPage page={cover} editable={true} iconVentureId="dog-walking" />
    </LaunchpadAnswersProvider>,
  );
}
const q = (s: string) => document.querySelector(s);

describe("workbook page 1, the cover", () => {
  it("is page 1 once the workbook has a page", () => {
    expect(cover).toMatchObject({ kind: "cover", number: 1 });
    expect(handbookPages(EMPTY_VENTURE_TEST_PROGRESS, FLOORS)).toEqual([]);
  });

  it("empty: dashed logo slot with the rocket, grey name and the vision placeholder (no quote mark), no pencils", () => {
    renderCover({});
    expect(q("[data-cover-logo='empty']")?.textContent).toContain("Your logo goes here");
    expect(q("[data-doodle='rocket']")).toBeTruthy();
    expect(q("[data-cover-name='empty']")?.textContent).toBe("Your business name");
    expect(q("[data-vision-placeholder]")?.textContent).toBe("Your vision appears here when you finish Level 1.");
    expect(q("[data-vision-quote]")).toBeNull();
    expect(q("[data-vision]")?.textContent).toContain("Our vision");
    expect(document.querySelectorAll("[data-edit-identity], [data-pencil]")).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/\b(NGA|silver|bronze|gold)\b/i);
  });

  it("filled: the logo is 80px, centered at the top, above a smaller name (17px, or the font's floor)", () => {
    renderCover({ [IDENTITY_ANSWER_KEY]: ID as never });
    expect(q("[data-cover-logo='filled'] svg")?.getAttribute("width")).toBe("48");
    expect(q("[data-cover]")!.className).toContain("items-center");
    const name = q("[data-cover-name='filled'] [data-business-name]") as HTMLElement;
    expect(parseFloat(name.style.fontSize)).toBe(21);
  });

  it("each slot fills on its own", () => {
    renderCover({ [IDENTITY_ANSWER_KEY]: { ...ID, name: undefined } as never });
    expect(q("[data-cover-logo='filled']")).toBeTruthy();
    expect(q("[data-cover-name='empty']")).toBeTruthy();
    expect(q("[data-vision-state='empty']")).toBeTruthy();
    cleanup();
    renderCover(L1);
    expect(q("[data-cover-logo='empty']")).toBeTruthy();
    expect(q("[data-vision-state='filled']")).toBeTruthy();
  });

  it("filled: logo, name, and the full compiled sentence, with no quote mark", () => {
    renderCover({ ...L1, [IDENTITY_ANSWER_KEY]: ID as never });
    expect(q("[data-cover-name='filled']")?.textContent).toBe("Happy Paws");
    expect(q("[data-vision-quote]")).toBeNull();
    const s = q("[data-vision-sentence]")!;
    expect(s.textContent).toMatch(/^I am starting a dog walking business\. I will offer dog walk.* and grooming.*\. I'm doing it to make money and help others\. As I grow, I'll give 10% of every sale to support animals\. My goals: I want to earn 200 .* in 3 months\. I'm saving for a new bike\. I want 10 customers to have a washed and groomed dog in 6 months\.$/);
    // Starts at 17/26 and steps down only when the cover would overflow its card.
    expect((s as HTMLElement).style.fontSize).toBe("16px");
    expect((s as HTMLElement).style.lineHeight).toBe("24px");
    expect(q("[data-cover]")!.getAttribute("data-cover-fit-step")).toBe("0");
    expect(s.className).toContain("text-[#19347D]");
    expect(s.className).not.toMatch(/truncate|line-clamp/);
  });

  it("cause skipped: the cause clause drops out", () => {
    const { "l1-cause": _omitCause, "l1-goal-support-a-cause": _omitGoal, ...rest } = L1;
    void _omitCause; void _omitGoal;
    renderCover(rest);
    expect(q("[data-vision-sentence]")!.textContent).toContain("make money and help others. My goals: ");
    expect(q("[data-vision-sentence]")!.textContent).not.toContain("As I grow");
  });
});

describe("identity wrap-up (screen three)", () => {
  it("shows the same compiled vision block in place of the old Vision line", () => {
    render(
      <LaunchpadAnswersProvider value={{ iconVentureId: "dog-walking", answers: { ...L1, [IDENTITY_ANSWER_KEY]: ID as never }, setAnswer: () => {}, floors: FLOORS }}>
        <IdentityWrapUp level={2} silverTitle="The Brand" wrapUp={wrapUp} onBuilding={() => {}} onCorridor={() => {}} onFinalize={() => {}} />
      </LaunchpadAnswersProvider>,
    );
    expect(q("[data-identity-vision] [data-vision-sentence]")!.textContent).toMatch(/^I am starting a dog walking business\./);
    expect(q("[data-vision-line]")).toBeNull();
  });
});
