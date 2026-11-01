import { PRIVACY_POLICY_PATH } from "@/lib/legal/paths";

/**
 * Terms consent tick box. Only people who can agree see it: 16+ learners
 * signing themselves up, parents and account managers, teachers, and the
 * parent on the approval path. Children under 16 never agree to the Terms.
 */

/** Live, consolidated Terms and Conditions (30 Oct 2026). */
export const TERMS_URL = "https://nextgenachievers.com/terms" as const;

/** In-app Privacy Policy. */
export const TERMS_PRIVACY_PATH = PRIVACY_POLICY_PATH;

/** Version of the Terms the box agrees to. Bump when the Terms change. */
export const TERMS_VERSION = "2026-10-30" as const;

/** account_history title for a recorded acceptance. */
export const TERMS_ACCEPTANCE_TITLE = "Agreed to the Terms and Privacy Policy" as const;

export const TERMS_REQUIRED_ERROR =
  "Tick the box to agree to the Terms and Conditions and Privacy Policy.";

export const TERMS_NOT_FOR_CHILD_ERROR =
  "A learner under 16 can't agree to the Terms. A parent or guardian approves instead.";

/** Who is submitting. Only "adult" audiences can agree. */
export type TermsAudience = "can_agree" | "under16_learner" | "child_added_by_parent";

export type TermsAcceptanceCheck =
  | { ok: true; record: boolean }
  | { ok: false; error: string };

/**
 * Server rule. Someone who can agree must send `true`. An under-16 learner
 * (or a child added by a parent) must not send a value at all.
 */
export function checkTermsAcceptance(input: {
  audience: TermsAudience;
  termsAccepted: unknown;
}): TermsAcceptanceCheck {
  if (input.audience !== "can_agree") {
    if (input.termsAccepted !== undefined && input.termsAccepted !== null) {
      return { ok: false, error: TERMS_NOT_FOR_CHILD_ERROR };
    }
    return { ok: true, record: false };
  }
  if (input.termsAccepted !== true) {
    return { ok: false, error: TERMS_REQUIRED_ERROR };
  }
  return { ok: true, record: true };
}

/** Row written to account_history when someone ticks the box. */
export function termsAcceptanceHistoryRow(input: {
  profileId: string;
  acceptedAt: string;
  version?: string;
}): { profile_id: string; occurred_at: string; title: string; detail: string } {
  return {
    profile_id: input.profileId,
    occurred_at: input.acceptedAt,
    title: TERMS_ACCEPTANCE_TITLE,
    detail: `Terms version ${input.version ?? TERMS_VERSION}`,
  };
}

/** True when a history row is a recorded Terms acceptance. */
export function isTermsAcceptanceEntry(entry: { title: string }): boolean {
  return entry.title === TERMS_ACCEPTANCE_TITLE;
}
