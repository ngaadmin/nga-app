"use client";

import { usePathname } from "next/navigation";
import { AppFooter } from "@/components/legal/app-footer";
import { cn } from "@/lib/utils/cn";

/** Clears the fixed learner sign-up button so the footer can scroll above it. */
export function OnboardingPageFooter() {
  const pathname = usePathname();
  const clearsSignupBar = pathname === "/onboarding/sign-up";

  return (
    <div
      className={cn(
        "px-6",
        clearsSignupBar
          ? "pb-[calc(104px+env(safe-area-inset-bottom))]"
          : "pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="mx-auto w-full max-w-6xl">
        <AppFooter />
      </div>
    </div>
  );
}
