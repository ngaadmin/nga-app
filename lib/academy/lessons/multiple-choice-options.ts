import type {
  MultipleChoiceOption,
  MultipleChoiceScreen,
} from "@/lib/academy/lessons/types/screens/multiple-choice";

export type MultipleChoiceListOption = MultipleChoiceOption & {
  key: string;
};

function isChoiceOption(value: unknown): value is MultipleChoiceOption {
  if (!value || typeof value !== "object") return false;
  const record = value as MultipleChoiceOption;
  return typeof record.label === "string" && typeof record.isCorrect === "boolean";
}

/**
 * Resolve every answer the payload sent. Prefers `options[]`; otherwise
 * collects optionA…optionZ in order, skipping gaps.
 */
export function collectMultipleChoiceOptions(
  screen: MultipleChoiceScreen,
): MultipleChoiceListOption[] {
  if (screen.options && screen.options.length > 0) {
    return screen.options.map((option, index) => ({
      key: `opt-${index}`,
      ...option,
    }));
  }

  const collected: MultipleChoiceListOption[] = [];
  for (let index = 0; index < 26; index += 1) {
    const letter = String.fromCharCode(65 + index);
    const field = `option${letter}` as keyof MultipleChoiceScreen;
    const value = screen[field];
    if (!isChoiceOption(value)) continue;
    collected.push({
      key: String.fromCharCode(97 + index),
      ...value,
    });
  }
  return collected;
}
