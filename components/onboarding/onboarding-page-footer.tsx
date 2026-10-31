"use client";

import { usePathname } from "next/navigation";
import { AppFooter } from "@/components/legal/app-footer";
import { LEARNER_SIGNUP_SCROLL_PAD_CLASS } from "@/components/onboarding/learner-signup-bar";
import { showsAppFooter } from "@/lib/legal/app-footer-routes";

/**
 * Legal footer for the public landing pages only (see `showsAppFooter`).
 * On the learner sign-up screen it still reserves space so content can
 * scroll above the fixed sign-up button.
 */
export function OnboardingPageFooter() {
  const pathname = usePathname();
  const clearsSignupBar = pathname === "/onboarding/sign-up";
  const showFooter = showsAppFooter(pathname);

  if (!showFooter) {
    return clearsSignupBar ? (
      <div aria-hidden className={LEARNER_SIGNUP_SCROLL_PAD_CLASS} />
    ) : null;
  }

  return (
    <div className="px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-6xl">
        <AppFooter align="center" />
      </div>
    </div>
  );
}
