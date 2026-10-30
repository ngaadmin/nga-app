import { useId } from "react";
import { TERMS_PRIVACY_PATH, TERMS_URL } from "@/lib/legal/terms-consent";
import { cn } from "@/lib/utils/cn";

const linkClass =
  "font-semibold text-[#031F82] underline decoration-[#031F82]/40 underline-offset-2 hover:decoration-[#031F82]";

/**
 * Shared Terms consent tick box. Starts unticked. Show it only to people
 * who can agree (16+ learners, parents, account managers, teachers).
 * Never render it for a learner under 16.
 */
export function TermsConsentCheckbox({
  checked,
  onChange,
  error,
  disabled,
  id,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const autoId = useId();
  const inputId = id ?? `terms-consent-${autoId}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("space-y-2", className)} data-terms-consent="">
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          name="termsAccepted"
          type="checkbox"
          checked={checked}
          disabled={disabled}
          required
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-[#E5E5E5] text-nga-primary focus:ring-nga-secondary"
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer font-sans text-sm leading-relaxed text-nga-slate"
        >
          I agree to the{" "}
          <a
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Terms and Conditions
          </a>{" "}
          and{" "}
          <a
            href={TERMS_PRIVACY_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Privacy Policy
          </a>
          .
        </label>
      </div>
      {error ? (
        <p
          id={errorId}
          className="font-sans text-sm font-medium text-[#031F82]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
