import { TermsConsentCheckbox } from "@/components/legal/terms-consent-checkbox";

/**
 * Terms area on the learner sign-up's last step.
 * - 16+ (self sign-up): the Terms tick box.
 * - Under 16: no tick box and no "I agree" wording. The parent agrees when
 *   approving. The empty slot below is held for Camille's notice copy.
 */
export function LearnerTermsArea({
  needsParentApproval,
  termsAccepted,
  onTermsAcceptedChange,
  error,
  disabled,
}: {
  needsParentApproval: boolean;
  termsAccepted: boolean;
  onTermsAcceptedChange: (checked: boolean) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  if (needsParentApproval) {
    // SLOT (Camille): under-16 Terms notice copy goes here. No tick box and
    // no "I agree" wording for learners under 16. Renders nothing for now.
    return <div data-slot="under16-terms-notice" hidden />;
  }
  return (
    <TermsConsentCheckbox
      id="learner-terms-consent"
      checked={termsAccepted}
      onChange={onTermsAcceptedChange}
      error={error}
      disabled={disabled}
    />
  );
}
