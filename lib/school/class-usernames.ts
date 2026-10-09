const CLASS_SEAT_WORDS = [
  "acorn",
  "amber",
  "atlas",
  "badger",
  "bamboo",
  "beacon",
  "bison",
  "breeze",
  "canyon",
  "cedar",
  "comet",
  "coral",
  "cricket",
  "daisy",
  "delta",
  "drift",
  "eagle",
  "ember",
  "falcon",
  "fern",
  "flint",
  "forest",
  "frost",
  "harbor",
  "hazel",
  "heron",
  "iris",
  "kiwi",
  "lark",
  "lotus",
  "maple",
  "meadow",
  "moss",
  "nova",
  "oak",
  "otter",
  "pebble",
  "pine",
  "quail",
  "raven",
  "reef",
  "river",
  "sage",
  "sparrow",
  "spruce",
  "summit",
  "swift",
  "tide",
  "tulip",
  "willow",
  "wren",
] as const;

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{2,20}$/;
const DIGITS = [2, 3, 4, 5, 6, 7, 8, 9] as const;

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = items[i]!;
    items[i] = items[j]!;
    items[j] = current;
  }
  return items;
}

/** Unique word+digit logins like atlas6. Not star1 / star2 sequential. */
export function pickClassSeatUsernames(
  takenUsernames: Iterable<string>,
  count: number,
): string[] {
  const needed = Math.max(0, Math.floor(count));
  if (needed === 0) return [];

  const taken = new Set(
    [...takenUsernames].map((name) => name.trim().toLowerCase()).filter(Boolean),
  );
  const picked: string[] = [];
  const words = shuffleInPlace([...CLASS_SEAT_WORDS]);

  for (const word of words) {
    const digits = shuffleInPlace([...DIGITS]);
    for (const digit of digits) {
      if (picked.length >= needed) return picked;
      const username = `${word}${digit}`;
      if (!USERNAME_PATTERN.test(username) || taken.has(username)) continue;
      taken.add(username);
      picked.push(username);
    }
  }

  return picked;
}

export function isClassSeatUsernameFormat(username: string): boolean {
  return USERNAME_PATTERN.test(username.trim());
}

export function isWordPlusNumberUsername(username: string): boolean {
  return /^[a-z]+[2-9]$/.test(username.trim().toLowerCase());
}
