/** Easy to say and spell. Length 6+ so Auth accepts it. */
const EASY_CLASS_WORDS = [
  "Banana",
  "Button",
  "Candle",
  "Castle",
  "Clouds",
  "Flower",
  "Forest",
  "Garden",
  "Harbor",
  "Island",
  "Jungle",
  "Kitten",
  "Ladder",
  "Meadow",
  "Orange",
  "Pencil",
  "Planet",
  "Purple",
  "Rocket",
  "Silver",
  "Summer",
  "Sunset",
  "Turtle",
  "Window",
  "Winter",
  "Yellow",
] as const;

/** One classroom word. Capital first letter. Not a random character string. */
export function generateClassPassword(): string {
  const index = crypto.getRandomValues(new Uint32Array(1))[0]! % EASY_CLASS_WORDS.length;
  return EASY_CLASS_WORDS[index]!;
}

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

/** A random valid pair. The teacher still types it again to confirm. */
export function suggestClassPassword(): string {
  const words = KID_CLASS_WORDS;
  const roll = crypto.getRandomValues(new Uint32Array(2));
  const left = words[roll[0]! % words.length]!;
  const right = words[roll[1]! % words.length]!;
  return `${left}-${right}`;
}
