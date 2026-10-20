export type SeededShuffleOptions<T> = {
  /** Keep matching items at the end, in their original relative order. */
  pinLast?: (item: T, index: number) => boolean;
  /**
   * Reject a draw when this returns true. A later draw is used instead.
   * If every draw is rejected, the list is rotated once so a grouped start does not stick.
   */
  avoid?: (shuffled: readonly T[]) => boolean;
};

/** FNV-1a 32-bit hash of the seed parts, in order. */
export function shuffleSeed(...parts: readonly (string | number)[]): number {
  let hash = 2166136261;
  const text = parts.map((part) => String(part)).join("\0");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32. Each call returns a float in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawShuffle<T>(items: readonly T[], random: () => number): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = next[index]!;
    next[index] = next[swap]!;
    next[swap] = current;
  }
  return next;
}

/** Stable shuffle. `pinLast` items stay at the end. `avoid` rejects a whole result. */
export function seededShuffle<T>(
  items: readonly T[],
  seed: number,
  options?: SeededShuffleOptions<T>,
): T[] {
  const pinLast = options?.pinLast;
  const movable: T[] = [];
  const pinned: T[] = [];
  items.forEach((item, index) => {
    if (pinLast?.(item, index)) pinned.push(item);
    else movable.push(item);
  });

  const random = mulberry32(seed);
  const avoid = options?.avoid;
  let shuffled = drawShuffle(movable, random);
  if (avoid) {
    for (let attempt = 0; attempt < 32 && avoid([...shuffled, ...pinned]); attempt += 1) {
      shuffled = drawShuffle(movable, random);
    }
    if (avoid([...shuffled, ...pinned]) && shuffled.length > 1) {
      shuffled = [...shuffled.slice(1), shuffled[0]!];
    }
  }
  return [...shuffled, ...pinned];
}

/**
 * A permutation where `fixedAt` is false for every index.
 * Used so a match tile does not sit beside its own pair.
 */
export function seededDerangement<T>(
  items: readonly T[],
  seed: number,
  fixedAt: (item: T, index: number) => boolean = (item, index) => item === items[index],
): T[] {
  if (items.length < 2) return [...items];
  const shuffled = seededShuffle(items, seed, {
    avoid: (order) => order.some((item, index) => fixedAt(item, index)),
  });
  if (!shuffled.some((item, index) => fixedAt(item, index))) return shuffled;
  return [...items.slice(1), items[0]!];
}
