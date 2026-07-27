/** Normalize option labels for phrase matching. */
function normalizeAllOfTheAboveLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[.!?,;:'"]+$/g, "")
    .replace(/\s+/g, " ");
}

/** True when the label is an "all of the above" style catch-all answer. */
export function isAllOfTheAboveLabel(label: string): boolean {
  const normalized = normalizeAllOfTheAboveLabel(label);

  if (
    normalized === "all of the above" ||
    normalized === "all of these" ||
    normalized === "all of the above are correct" ||
    normalized === "all of these are correct" ||
    normalized === "all of them" ||
    normalized === "all are correct"
  ) {
    return true;
  }

  return (
    normalized.startsWith("all of the above") ||
    normalized.startsWith("all of these")
  );
}

export type AllOfTheAboveDetectableOption<TKey extends string = string> = {
  key: TKey;
  label: string;
  isCorrect: boolean;
};

/**
 * When exactly one correct option is an "all of the above" label, return its key.
 * Otherwise null (standard single- or multi-select rules apply).
 */
export function findAllOfTheAboveCorrectKey<TKey extends string>(
  options: readonly AllOfTheAboveDetectableOption<TKey>[],
): TKey | null {
  const correctOptions = options.filter((option) => option.isCorrect);
  if (correctOptions.length !== 1) return null;

  const [soleCorrect] = correctOptions;
  if (!soleCorrect || !isAllOfTheAboveLabel(soleCorrect.label)) return null;
  return soleCorrect.key;
}
