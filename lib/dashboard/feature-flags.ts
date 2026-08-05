/**
 * Dashboard feature flags for staged testing.
 *
 * Flip `SHOW_LAUNCHPAD` to `true` to restore Launchpad nav entry points
 * and allow direct access to `/dashboard/launchpad` (and legacy `/dashboard/engine`).
 */
export const SHOW_LAUNCHPAD = false;

/**
 * Nav item ids visible while Launchpad is suppressed during active testing.
 * Settings is included in primary chrome; Launchpad stays hidden until SHOW_LAUNCHPAD is true.
 */
export const TESTING_VISIBLE_NAV_IDS = [
  "academy",
  "vault",
  "achievements",
  "advanced-money-tools",
  "settings",
] as const;

export type TestingVisibleNavId = (typeof TESTING_VISIBLE_NAV_IDS)[number];

const testingVisibleNavIdSet = new Set<string>(TESTING_VISIBLE_NAV_IDS);

export function isTestingVisibleNavId(id: string): boolean {
  return testingVisibleNavIdSet.has(id);
}
