/** Exact ending required when an error line is present. */
export const TRY_AGAIN_ENDING = "Try again!";

/**
 * Module 1's existing Screens1.csv is not held to the ending.
 * Modules after 1 are. The Explorer proof-of-concept import passes `strict`.
 */
export function errorLineIsAcceptable(
  moduleNumber: number,
  error: string,
  options?: { strict?: boolean },
): boolean {
  const trimmed = error.trim();
  if (!trimmed) return true;
  if (options?.strict || moduleNumber > 1) {
    return trimmed.endsWith(TRY_AGAIN_ENDING);
  }
  return true;
}

const BRITISH_SPELLING =
  /\b(neighbours?|colours?|favourites?|honours?|practise[ds]?|practising|centres?|metres?|grey|behaviours?|organise[ds]?|organising)\b/i;

export function findBritishSpelling(text: string): string | undefined {
  return BRITISH_SPELLING.exec(text)?.[0];
}
