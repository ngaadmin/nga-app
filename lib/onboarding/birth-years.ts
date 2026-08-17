import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";
import {
  getConservativeAgeFromBirthYear,
  getMasteryCohortFromBirthYear,
} from "@/lib/dashboard/mastery-cohort";

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

/**
 * Birth years that map to learner ages 10-18 under the conservative Dec 31 rule:
 * age = CurrentYear − BirthYear − 1  ⇒  birthYear = CurrentYear − age − 1.
 */
export function getYouthBirthYears(referenceDate = new Date()): number[] {
  const referenceYear = referenceDate.getFullYear();
  const years: number[] = [];
  for (let age = 10; age <= 18; age += 1) {
    years.push(referenceYear - age - 1);
  }
  return years;
}

/** Birth years within a cohort's eligible youth age band (legal / conservative age). */
export function getYouthBirthYearsForCohort(
  cohort: MasteryCohort,
  referenceDate = new Date(),
): number[] {
  const referenceYear = referenceDate.getFullYear();
  return getYouthBirthYears(referenceDate).filter((year) => {
    const age = getConservativeAgeFromBirthYear(year, referenceYear);
    return (
      age >= 10 &&
      age <= 18 &&
      getMasteryCohortFromBirthYear(year, referenceYear) === cohort
    );
  });
}

/**
 * Mid-band birth year used only as a content stand-in for guest play.
 * Never treat this as verified age — signup still confirms the real year.
 */
export function representativeBirthYearForCohort(
  cohort: MasteryCohort,
  referenceDate = new Date(),
): number {
  const years = getYouthBirthYearsForCohort(cohort, referenceDate);
  const mid = years[Math.floor(years.length / 2)];
  if (mid) return mid;
  const fallbackAge = cohort === "explorer" ? 11 : cohort === "pathfinder" ? 14 : 16;
  return referenceDate.getFullYear() - fallbackAge - 1;
}
