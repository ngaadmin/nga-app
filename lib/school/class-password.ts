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
