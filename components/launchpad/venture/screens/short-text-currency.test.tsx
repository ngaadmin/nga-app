// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fieldsOf, type LaunchpadAnswer, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadShortTextScreen, LaunchpadTextField } from "@/lib/launchpad/content/types";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";
import { ShortTextScreen, withCurrency } from "@/components/launchpad/venture/screens/short-text-screen";

afterEach(cleanup);

const currency: LaunchpadTextField = { name: "currency", input: "currency", label: "Currency" };
const amount: LaunchpadTextField = { name: "amount", input: "integer", label: "Amount", min: 1, max: 1000000 };

const SCREEN = {
  type: "short-text",
  id: "goal-money",
  answerKey: "l1-goal-make-money",
  mode: "goal",
  fields: [amount, currency],
  parts: [
    { kind: "text", text: "I want to earn " },
    { kind: "field", field: "amount" },
    { kind: "field", field: "currency" },
  ],
} as unknown as LaunchpadShortTextScreen;

describe("withCurrency", () => {
  it("fills a missing currency from the preference and leaves a set one alone", () => {
    expect(withCurrency({ amount: 5 }, currency, () => "AUD")).toEqual({ amount: 5, currency: "AUD" });
    expect(withCurrency({ currency: "USD" }, currency, () => "AUD")).toEqual({ currency: "USD" });
    expect(withCurrency({ amount: 5 }, undefined, () => "AUD")).toEqual({ amount: 5 });
  });
});

describe("ShortTextScreen currency", () => {
  it("keeps the currency when a blank is typed before the currency save has re-rendered", () => {
    // The parent applies saves in order but this render still shows the
    // answers from before the screen's own currency save (a stale render).
    const saved: LaunchpadAnswer[] = [];
    const answers: LaunchpadAnswers = {};
    render(
      <LaunchpadAnswersProvider value={{ iconVentureId: "dog-walking", answers, setAnswer: (_k, a) => saved.push(a) }}>
        <ShortTextScreen screen={SCREEN} />
      </LaunchpadAnswersProvider>,
    );
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "500" } });
    const last = saved.at(-1);
    const values = fieldsOf({ k: last! } as LaunchpadAnswers, "k")?.values;
    expect(values?.amount).toBe(500);
    expect(values?.currency).toBeTruthy();
  });
});
