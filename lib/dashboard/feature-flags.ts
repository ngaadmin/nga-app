/**
 * Dashboard feature flags for staged testing.
 *
 * Launchpad is a primary tab again (Business Launchpad). Keep this true
 * unless the surface needs to be suppressed for a focused test pass.
 */
export const SHOW_LAUNCHPAD = true;

/**
 * Streak Freezes are not tracked yet (the count was a hard-coded 2), so the
 * Learning Streaks panel hides them until they are. Turn on once tracked.
 */
export const STREAK_FREEZES_TRACKED = false;

/** Streak challenges are not tracked yet either; hidden until they are. */
export const STREAK_CHALLENGES_TRACKED = false;

/**
 * Nav item ids visible while Launchpad is suppressed during active testing.
 * Advanced Money is added to chrome only after a testing premium unlock.
 */
export const TESTING_VISIBLE_NAV_IDS = [
  "academy",
  "launchpad",
  "vault",
  "community",
  "settings",
] as const;

export type TestingVisibleNavId = (typeof TESTING_VISIBLE_NAV_IDS)[number];

const testingVisibleNavIdSet = new Set<string>(TESTING_VISIBLE_NAV_IDS);

export function isTestingVisibleNavId(id: string): boolean {
  return testingVisibleNavIdSet.has(id);
}
