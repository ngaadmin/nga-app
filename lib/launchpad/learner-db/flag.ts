/**
 * Signed-in Launchpad saves. Off unless a flag is explicitly on.
 * Unset, "0", and "false" keep today's browser-only storage.
 * Direct property reads so Next can inline the public flag in the browser.
 */
export function launchpadLearnerSaveEnabled(
  env: { LAUNCHPAD_LEARNER_SAVE?: string; NEXT_PUBLIC_LAUNCHPAD_LEARNER_SAVE?: string } = {
    LAUNCHPAD_LEARNER_SAVE: process.env.LAUNCHPAD_LEARNER_SAVE,
    NEXT_PUBLIC_LAUNCHPAD_LEARNER_SAVE: process.env.NEXT_PUBLIC_LAUNCHPAD_LEARNER_SAVE,
  },
): boolean {
  const explicit = env.LAUNCHPAD_LEARNER_SAVE ?? env.NEXT_PUBLIC_LAUNCHPAD_LEARNER_SAVE;
  return explicit === "1" || explicit === "true";
}
