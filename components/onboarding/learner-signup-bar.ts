/**
 * Pinned learner sign-up action.
 * The button is `h-touch` (2.75rem). The white strip adds 12px above it
 * and the safe-area inset below.
 */
export const LEARNER_SIGNUP_BAR_CLASS =
  "fixed inset-x-0 bottom-0 bg-white px-6 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]";

/**
 * Scroll clearance equals that strip plus 24px, so the last card can sit
 * fully above the button.
 */
export const LEARNER_SIGNUP_SCROLL_PAD_CLASS =
  "pb-[calc(12px+2.75rem+max(20px,env(safe-area-inset-bottom))+24px)]";
