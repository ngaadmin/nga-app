import { seededShuffle, shuffleSeed } from "@/lib/academy/lessons/seeded-shuffle";

export type RankOrderResolvable = {
  id: string;
  label: string;
};

/** True when every id sits in the authored correct position. */
export function rankOrderMatches(
  order: readonly string[],
  correctOrder: readonly string[],
): boolean {
  return (
    order.length === correctOrder.length &&
    correctOrder.length > 0 &&
    order.every((id, index) => id === correctOrder[index])
  );
}

/** Lowercase, straight apostrophes, punctuation stripped so ORDER keys can match labels. */
export function normalizeRankText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032`]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenScore(label: string, token: string): number {
  const labelNorm = normalizeRankText(label);
  const tokenNorm = normalizeRankText(token);
  if (!tokenNorm || !labelNorm) return 0;
  if (labelNorm === tokenNorm) return 100;
  if (labelNorm.includes(tokenNorm)) return 80;
  const tokenWords = tokenNorm.split(" ").filter((word) => word.length >= 3);
  if (tokenWords.length === 0) return 0;
  const labelWords = new Set(labelNorm.split(" ").filter(Boolean));
  const wordHits = tokenWords.filter((word) => labelWords.has(word));
  if (wordHits.length === tokenWords.length) return 70;
  if (wordHits.length > 0) return 40 + wordHits.length * 5;
  const partial = tokenWords.filter((word) => labelNorm.includes(word));
  if (partial.length > 0) return 20 + partial.length;
  return 0;
}

function bestItemForToken(
  items: readonly RankOrderResolvable[],
  token: string,
  used: ReadonlySet<string>,
): RankOrderResolvable | undefined {
  let best: RankOrderResolvable | undefined;
  let bestScore = 0;
  for (const item of items) {
    if (used.has(item.id)) continue;
    const score = tokenScore(item.label, token);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

/** ORDER tokens that do not match a distinct item. An empty list means the keys fit. */
export function unmatchedRankOrderTokens(
  items: readonly RankOrderResolvable[],
  orderTokens: readonly string[],
): string[] {
  const tokens = orderTokens.map((token) => token.trim()).filter(Boolean);
  if (tokens.length === 0) return [];
  if (tokens.length !== items.length) return tokens;
  const used = new Set<string>();
  const misses: string[] = [];
  for (const token of tokens) {
    const match = bestItemForToken(items, token, used);
    if (!match) {
      misses.push(token);
      continue;
    }
    used.add(match.id);
  }
  return misses;
}

/**
 * Map ORDER keys onto items. A key matches a label by phrase or keyword.
 * When the key count equals the item count and a key still has no keyword
 * hit, the leftover items fill those slots in authored position order.
 */
export function resolveRankOrderIds(
  items: readonly RankOrderResolvable[],
  orderTokens: readonly string[],
): string[] {
  const tokens = orderTokens.map((token) => token.trim()).filter(Boolean);
  if (items.length === 0) return [];

  const used = new Set<string>();
  const resolved: string[] = [];
  let keywordMisses = 0;

  for (const token of tokens) {
    const match = bestItemForToken(items, token, used);
    if (!match) {
      keywordMisses += 1;
      resolved.push("");
      continue;
    }
    used.add(match.id);
    resolved.push(match.id);
  }

  if (tokens.length === items.length && keywordMisses > 0) {
    const leftover = items.filter((item) => !used.has(item.id));
    let leftoverIndex = 0;
    for (let index = 0; index < resolved.length; index += 1) {
      if (resolved[index]) continue;
      const next = leftover[leftoverIndex];
      leftoverIndex += 1;
      if (!next) continue;
      resolved[index] = next.id;
      used.add(next.id);
    }
  }

  const complete = resolved.filter(Boolean);
  if (
    complete.length === items.length &&
    new Set(complete).size === items.length
  ) {
    return complete;
  }

  return items.map((item) => item.id);
}

/** Starting stack. Never the correct order when there is more than one way to arrange it. */
export function openingRankOrder(
  itemIds: readonly string[],
  correctOrder: readonly string[],
): string[] {
  if (itemIds.length < 2) return [...itemIds];
  const shuffled = seededShuffle(itemIds, shuffleSeed(...itemIds));
  if (!rankOrderMatches(shuffled, correctOrder)) return shuffled;
  return [...shuffled.slice(1), shuffled[0]!];
}

/** First authored error string. Empty when the sheet left the Error column blank. */
export function firstRankOrderError(errors: Record<string, string>): string {
  for (const value of Object.values(errors)) {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return "";
}
