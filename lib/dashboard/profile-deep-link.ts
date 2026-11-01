/** `?profile=achievements` opens the profile with Achievements expanded. */
export const PROFILE_QUERY_KEY = "profile";
export const PROFILE_ACHIEVEMENTS_VALUE = "achievements";
export const PROFILE_ACHIEVEMENTS_QUERY = `${PROFILE_QUERY_KEY}=${PROFILE_ACHIEVEMENTS_VALUE}`;

/** True when the URL asks for the profile's Achievements section. */
export function wantsProfileAchievements(search: string): boolean {
  return (
    new URLSearchParams(search).get(PROFILE_QUERY_KEY) === PROFILE_ACHIEVEMENTS_VALUE
  );
}

/** The same URL without the profile query (so a refresh does not reopen it). */
export function withoutProfileQuery(href: string): string {
  const url = new URL(href);
  url.searchParams.delete(PROFILE_QUERY_KEY);
  return `${url.pathname}${url.search}${url.hash}`;
}
