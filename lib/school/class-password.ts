/**
 * Kid-safe words for a class password: two of these, lowercase, joined by a dash.
 * Every word is 3–8 letters.
 */
export const KID_CLASS_WORDS = [
  "apple",
  "banana",
  "blue",
  "button",
  "candle",
  "castle",
  "cloud",
  "flower",
  "forest",
  "garden",
  "happy",
  "island",
  "jungle",
  "kitten",
  "ladder",
  "meadow",
  "orange",
  "pencil",
  "planet",
  "purple",
  "river",
  "rocket",
  "silver",
  "summer",
  "sunny",
  "sunset",
  "tiger",
  "turtle",
  "window",
  "winter",
  "yellow",
] as const;

const KID_CLASS_WORD_SET = new Set<string>(KID_CLASS_WORDS);

/** Two easy words, one dash, each word from {@link KID_CLASS_WORDS}. */
export function isKidClassPassword(value: string): boolean {
  if (!/^[a-z]{3,8}-[a-z]{3,8}$/.test(value)) return false;
  const [left, right] = value.split("-");
  return KID_CLASS_WORD_SET.has(left ?? "") && KID_CLASS_WORD_SET.has(right ?? "");
}

/** A random valid pair. Suggest one and new classes use this same picker. */
export function suggestClassPassword(): string {
  const words = KID_CLASS_WORDS;
  const roll = crypto.getRandomValues(new Uint32Array(2));
  const left = words[roll[0]! % words.length]!;
  const right = words[roll[1]! % words.length]!;
  return `${left}-${right}`;
}

/** Password stored for a class that has just been created. */
export function generateClassPassword(): string {
  return suggestClassPassword();
}

/**
 * Sign-in accepts whatever is already saved.
 * New classes use a two-word password. Older classes keep a single word
 * such as Yellow, or any other saved password of 6 or more characters.
 */
export function storedClassPasswordCanSignIn(password: string): boolean {
  return password.length >= 6;
}
