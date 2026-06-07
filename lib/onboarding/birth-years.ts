/** Inclusive birth-year window for tweens and teens (Ghost Access onboarding). */
export const BIRTH_YEAR_MIN = 2005;
export const BIRTH_YEAR_MAX = 2020;

export function getEligibleBirthYears(): number[] {
  const years: number[] = [];
  for (let year = BIRTH_YEAR_MAX; year >= BIRTH_YEAR_MIN; year--) {
    years.push(year);
  }
  return years;
}

export function isEligibleBirthYear(year: number): boolean {
  return (
    Number.isInteger(year) &&
    year >= BIRTH_YEAR_MIN &&
    year <= BIRTH_YEAR_MAX
  );
}
