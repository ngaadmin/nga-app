import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import { getMasteryCohortFromBirthYear } from "@/lib/dashboard/mastery-cohort";

/** Inclusive birth-year window for onboarding (adults may sign up on behalf of youth). */
export const BIRTH_YEAR_MIN = 1950;

export function getBirthYearMax(referenceDate = new Date()): number {
  return referenceDate.getFullYear();
}

export function getEligibleBirthYears(referenceDate = new Date()): number[] {
  const max = getBirthYearMax(referenceDate);
  const years: number[] = [];
  for (let year = max; year >= BIRTH_YEAR_MIN; year--) {
    years.push(year);
  }
  return years;
}

export function isEligibleBirthYear(
  year: number,
  referenceDate = new Date(),
): boolean {
  return (
    Number.isInteger(year) &&
    year >= BIRTH_YEAR_MIN &&
    year <= getBirthYearMax(referenceDate)
  );
}

export function getBirthYearRangeLabel(referenceDate = new Date()): string {
  return `${BIRTH_YEAR_MIN} and ${getBirthYearMax(referenceDate)}`;
}

/** Birth years that map to learner ages 10-18 for track changes in Settings. */
export function getYouthBirthYears(referenceDate = new Date()): number[] {
  const referenceYear = referenceDate.getFullYear();
  const years: number[] = [];
  for (let age = 10; age <= 18; age += 1) {
    years.push(referenceYear - age);
  }
  return years;
}

/** Birth years within a cohort's eligible youth age band. */
export function getYouthBirthYearsForCohort(
  cohort: MasteryCohort,
  referenceDate = new Date(),
): number[] {
  const referenceYear = referenceDate.getFullYear();
  return getYouthBirthYears(referenceDate).filter(
    (year) => getMasteryCohortFromBirthYear(year, referenceYear) === cohort,
  );
}
