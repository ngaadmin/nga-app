/**
 * Fill-in-the-blank placement. A drop lands in the gap under the pointer.
 * Correctness is not an input — that is judged on submit.
 *
 * Gaps store bank-item ids. Two chips can share a label and still move
 * independently.
 */

export type WordBankItem = {
  id: string;
  label: string;
};

const WORD_BANK_ID_MARK = "\u0000";

/** One chip per copy of a label inside a single blank's option list. */
export function wordBankItems(
  blanks: readonly { options: readonly string[] }[],
): WordBankItem[] {
  const maxCount = new Map<string, number>();
  const order: string[] = [];

  for (const blank of blanks) {
    const seenHere = new Map<string, number>();
    for (const option of blank.options) {
      const count = (seenHere.get(option) ?? 0) + 1;
      seenHere.set(option, count);
      if (count === 1 && !maxCount.has(option)) order.push(option);
    }
    for (const [label, count] of seenHere) {
      maxCount.set(label, Math.max(maxCount.get(label) ?? 0, count));
    }
  }

  const items: WordBankItem[] = [];
  for (const label of order) {
    const count = maxCount.get(label) ?? 0;
    for (let index = 0; index < count; index += 1) {
      items.push({ id: `${label}${WORD_BANK_ID_MARK}${index}`, label });
    }
  }
  return items;
}

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
 * Place `itemId` into `blankIndex`. A word dragged from another gap swaps with
 * the occupant. A bank word replaces the occupant, which returns to the bank.
 * The same id never occupies two gaps. A different id with the same label stays.
 */
export function wordDropPlace(
  choices: readonly string[],
  blankIndex: number,
  itemId: string,
  fromBlankIndex: number | null,
): string[] {
  if (blankIndex < 0 || blankIndex >= choices.length || itemId.length === 0) {
    return [...choices];
  }
  if (fromBlankIndex === blankIndex) return [...choices];

  const next = [...choices];
  const displaced = next[blankIndex] === itemId ? "" : (next[blankIndex] ?? "");

  for (let index = 0; index < next.length; index += 1) {
    if (index !== blankIndex && next[index] === itemId) next[index] = "";
  }

  next[blankIndex] = itemId;

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
