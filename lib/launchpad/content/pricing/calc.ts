/**
 * Planning price and jobs math (framework row 24–25, Cath 6 Nov).
 * What the learner keeps is price minus the cost of that job.
 * A donate promise from Module 1 is not taken off the price here.
 */

function cents(amount: number): number {
  return Math.round(amount * 100);
}

/** `price − cost_per_job`, in dollars with cents. Charity is not a term. */
export function keptPerJob(price: number, costPerJob: number): number {
  return (cents(price) - cents(costPerJob)) / 100;
}

/** Whole-dollar price the learner can charge (1 to 9,999). */
export function isWholePrice(price: number): boolean {
  return Number.isInteger(price) && price >= 1 && price <= 9999;
}

/**
 * Jobs to cover start-up from one service's keep.
 * 0 when start-up is already 0. Null when keep is not above 0.
 */
export function jobsNeeded(startupTotal: number, kept: number): number | null {
  if (startupTotal <= 0) return 0;
  if (kept <= 0) return null;
  return Math.ceil(cents(startupTotal) / cents(kept));
}

/** Single service: weeks is jobs needed divided by jobs per week, rounded up. */
export function weeksFromJobs(jobs: number, jobsPerWeek: number): number | null {
  if (jobs <= 0) return 0;
  if (!Number.isInteger(jobsPerWeek) || jobsPerWeek < 1) return null;
  return Math.ceil(jobs / jobsPerWeek);
}

/** Multi-service typical week: sum of count × keep. */
export function weeklyKeep(rows: readonly { jobsPerWeek: number; keptPerJob: number }[]): number {
  const total = rows.reduce((sum, row) => sum + row.jobsPerWeek * cents(row.keptPerJob), 0);
  return total / 100;
}

/** Multi-service: weeks is start-up divided by weekly keep, rounded up. */
export function weeksFromWeeklyKeep(startupTotal: number, weekly: number): number | null {
  if (startupTotal <= 0) return 0;
  if (weekly <= 0) return null;
  return Math.ceil(cents(startupTotal) / cents(weekly));
}

/**
 * Worked example with no charity line (walk $15 keep $14.60, training $25
 * keep $24.45, 3 walks + 1 training, $80 start-up → $68.25 a week, 2 weeks).
 */
export const NO_CHARITY_SAMPLE = {
  startup: 80,
  walk: { price: 15, cost: 0.4, keep: 14.6 },
  training: { price: 25, cost: 0.55, keep: 24.45 },
  walksPerWeek: 3,
  trainingsPerWeek: 1,
  weeklyKeep: 68.25,
  weeks: 2,
  /** One service: $80 at $14.60 kept takes 6 walks. */
  singleJobs: 6,
} as const;
