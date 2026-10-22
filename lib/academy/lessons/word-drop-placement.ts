/**
 * Fill-in-the-blank placement. A drop lands in the gap under the pointer.
 * Correctness is not an input — that is judged on submit.
 */

export function wordDropIsComplete(choices: readonly string[]): boolean {
  return choices.length > 0 && choices.every((choice) => choice.length > 0);
}

/** True only when every gap holds its authored answer. Empty gaps are not correct. */
export function wordDropMatches(
  choices: readonly string[],
  correctOptions: readonly string[],
): boolean {
  return (
    correctOptions.length > 0 &&
    choices.length === correctOptions.length &&
    correctOptions.every((correct, index) => choices[index] === correct)
  );
}

export function wordDropRemove(choices: readonly string[], blankIndex: number): string[] {
  if (blankIndex < 0 || blankIndex >= choices.length || choices[blankIndex]?.length === 0) {
    return [...choices];
  }
  const next = [...choices];
  next[blankIndex] = "";
  return next;
}

/**
 * Place `word` into `blankIndex`. A word dragged from another gap swaps with
 * the occupant. A bank word replaces the occupant, which returns to the bank.
 */
export function wordDropPlace(
  choices: readonly string[],
  blankIndex: number,
  word: string,
  fromBlankIndex: number | null,
  allowDuplicate: boolean,
): string[] {
  if (blankIndex < 0 || blankIndex >= choices.length || word.length === 0) {
    return [...choices];
  }

  const next = [...choices];
  const displaced = next[blankIndex] === word ? "" : (next[blankIndex] ?? "");

  if (!allowDuplicate) {
    for (let index = 0; index < next.length; index += 1) {
      if (index !== blankIndex && next[index] === word) next[index] = "";
    }
  } else if (
    fromBlankIndex !== null &&
    fromBlankIndex !== blankIndex &&
    fromBlankIndex >= 0 &&
    fromBlankIndex < next.length &&
    next[fromBlankIndex] === word
  ) {
    next[fromBlankIndex] = "";
  }

  next[blankIndex] = word;

  if (
    displaced.length > 0 &&
    fromBlankIndex !== null &&
    fromBlankIndex !== blankIndex &&
    fromBlankIndex >= 0 &&
    fromBlankIndex < next.length &&
    next[fromBlankIndex]?.length === 0
  ) {
    next[fromBlankIndex] = displaced;
  }

  return next;
}
