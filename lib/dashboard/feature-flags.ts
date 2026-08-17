/**
 * Dashboard feature flags for staged testing.
 *
 * Launchpad is a primary tab again (Business Launchpad). Keep this true
 * unless the surface needs to be suppressed for a focused test pass.
 */
export const SHOW_LAUNCHPAD = true;

/**
 * Nav item ids visible while Launchpad is suppressed during active testing.
 * Advanced Money is not a free main-tab destination.
 */
export const TESTING_VISIBLE_NAV_IDS = [
  "academy",
  "launchpad",
  "community",
  "vault",
  "settings",
] as const;

export type TestingVisibleNavId = (typeof TESTING_VISIBLE_NAV_IDS)[number];

const testingVisibleNavIdSet = new Set<string>(TESTING_VISIBLE_NAV_IDS);

export function isTestingVisibleNavId(id: string): boolean {
  return testingVisibleNavIdSet.has(id);
}
