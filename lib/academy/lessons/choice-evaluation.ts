export type LessonChoiceFeedbackVariant = "neutral" | "correct" | "wrong";

export type EvaluatedChoiceOption<TKey extends string = string> = {
  key: TKey;
  label: string;
  isCorrect: boolean;
};

/** Strict boolean check — lesson data must use real booleans, not strings. */
export function isLessonChoiceOptionCorrect(option: {
  isCorrect: boolean;
}): boolean {
  return option.isCorrect === true;
}

/** Keys for every option marked correct in lesson content. */
export function getCorrectOptionKeys<TKey extends string>(
  options: readonly EvaluatedChoiceOption<TKey>[],
): readonly TKey[] {
  return options
    .filter(isLessonChoiceOptionCorrect)
    .map((option) => option.key);
}

export type ResolveChoiceSelectionVariantInput = {
  /** Whether this option is currently selected / locked in. */
  isSelected: boolean;
  /** Authoritative correctness from lesson data (`option.isCorrect`). */
  isCorrect: boolean;
  /** Transient shake feedback — show neutral until animation completes. */
  isShaking?: boolean;
  /** When true, selected tiles stay sunken/neutral (no green/red). */
  useNeutralFeedback?: boolean;
};

/**
 * Global choice feedback rule: green only for selected correct options,
 * red only for selected incorrect options, neutral otherwise.
 */
export function resolveChoiceSelectionVariant({
  isSelected,
  isCorrect,
  isShaking = false,
  useNeutralFeedback = false,
}: ResolveChoiceSelectionVariantInput): LessonChoiceFeedbackVariant {
  if (!isSelected || isShaking) return "neutral";
  if (useNeutralFeedback) return "neutral";
  return isCorrect ? "correct" : "wrong";
}

/** True when every selected key is marked correct in lesson data. */
export function isPartialCorrectSelection<TKey extends string>(
  selectedKeys: ReadonlySet<TKey>,
  correctKeys: readonly TKey[],
): boolean {
  if (selectedKeys.size === 0) return true;
  const correctSet = new Set(correctKeys);
  return [...selectedKeys].every((key) => correctSet.has(key));
}

/** True when any selected key is not in the lesson's correct set. */
export function hasIncorrectSelection<TKey extends string>(
  selectedKeys: ReadonlySet<TKey>,
  correctKeys: readonly TKey[],
): boolean {
  const correctSet = new Set(correctKeys);
  return [...selectedKeys].some((key) => !correctSet.has(key));
}

export type MultiSelectCompletionInput<TKey extends string> = {
  correctKeys: readonly TKey[];
  lockedCorrectKeys: ReadonlySet<TKey>;
  wrongPickedKeys: ReadonlySet<TKey>;
  allOfTheAboveKey?: TKey | null;
};

/** True when every correct option is selected and no incorrect option remains picked. */
export function isMultiSelectComplete<TKey extends string>({
  correctKeys,
  lockedCorrectKeys,
  wrongPickedKeys,
  allOfTheAboveKey = null,
}: MultiSelectCompletionInput<TKey>): boolean {
  if (allOfTheAboveKey) {
    return lockedCorrectKeys.has(allOfTheAboveKey);
  }

  const allCorrectSelected = correctKeys.every((key) =>
    lockedCorrectKeys.has(key),
  );
  return allCorrectSelected && wrongPickedKeys.size === 0;
}
