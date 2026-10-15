/**
 * us-east-1 ↔ ap-northeast-1 (Tokyo) round trip used to explain class-page waits.
 * Each sequential Supabase call costs one hop. Parallel calls in the same hop cost one.
 */
export const CLASS_PAGE_TOKYO_HOP_MS = 170;

/** The loader before this change: auth, then profiles, then learner progress. */
export const CLASS_PAGE_ROUNDS_BEFORE = 3;

/** Signed-in teacher with a saved password: one RPC returns the class page. */
export const CLASS_PAGE_ROUNDS_AFTER = 1;

export function classPageNetworkWaitMs(rounds: number): number {
  return rounds * CLASS_PAGE_TOKYO_HOP_MS;
}
