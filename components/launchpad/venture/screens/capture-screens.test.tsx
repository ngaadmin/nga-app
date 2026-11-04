import { describe, expect, it } from "vitest";
import { toggleChoice } from "@/components/launchpad/venture/screens/choice-capture-screen";
import { moveRankItem } from "@/components/launchpad/venture/screens/rank-order-screen";
import { isFieldValueValid, isShortTextAnswered, sanitizeFieldInput } from "@/lib/launchpad/content/fields";
import { fieldsAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadShortTextScreen, LaunchpadTextField } from "@/lib/launchpad/content/types";

const amount: LaunchpadTextField = { name: "amount", input: "integer", label: "Amount", min: 1, max: 1000000 };
const benefit: LaunchpadTextField = { name: "benefit", input: "text", label: "Benefit", maxLength: 10 };
const unit: LaunchpadTextField = { name: "unit", input: "choice", label: "Weeks or months", options: [{ id: "weeks", label: "weeks" }, { id: "months", label: "months" }] };

describe("capture screen rules", () => {
  it("toggleChoice: single replaces, multi toggles in pick order", () => {
    expect(toggleChoice("single", ["a"], "b")).toEqual(["b"]);
    expect(toggleChoice("multi", ["a"], "b")).toEqual(["a", "b"]);
    expect(toggleChoice("multi", ["a", "b"], "a")).toEqual(["b"]);
  });

  it("moveRankItem: moves one place and stops at the ends", () => {
    expect(moveRankItem(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveRankItem(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
    expect(moveRankItem(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
    expect(moveRankItem(["a", "b", "c"], "c", 1)).toEqual(["a", "b", "c"]);
  });

  it("sanitizes typed values: digits only, capped text, known options", () => {
    expect(sanitizeFieldInput(amount, "$1,2a0")).toBe(120);
    expect(sanitizeFieldInput(amount, "abc")).toBe("");
    expect(sanitizeFieldInput(amount, "99999999")).toBe(9999999);
    expect(isFieldValueValid(amount, 9999999)).toBe(false);
    expect(sanitizeFieldInput(benefit, "  a\nlong   benefit text")).toBe("a long ben");
    expect(sanitizeFieldInput(unit, "years")).toBe("");
    expect(sanitizeFieldInput(unit, "weeks")).toBe("weeks");
  });

  it("short text: Not applicable answers the page; otherwise every field must be valid", () => {
    const screen = {
      type: "short-text", id: "s", answerKey: "k", prompt: "p", mode: "goal", notApplicableLabel: "Not applicable",
      sentence: [], fields: [amount, unit],
    } as unknown as LaunchpadShortTextScreen;
    expect(isShortTextAnswered(screen, undefined)).toBe(false);
    expect(isShortTextAnswered(screen, fieldsAnswer({ amount: 5 }))).toBe(false);
    expect(isShortTextAnswered(screen, fieldsAnswer({ amount: 5, unit: "months" }))).toBe(true);
    expect(isShortTextAnswered(screen, fieldsAnswer({}, true))).toBe(true);
    expect(isShortTextAnswered({ ...screen, notApplicableLabel: undefined }, fieldsAnswer({}, true))).toBe(false);
  });
});
