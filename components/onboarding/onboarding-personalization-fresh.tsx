"use client";

import { useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  clearUserSession,
  ONBOARDING_START_PATH,
} from "@/lib/onboarding/guest-session";

/**
 * Clears only the user session so "Try the Free App" / fresh entry always
 * requires the birth-year personalization gate (cohort assignment), without
 * wiping wallet, academy, or skill progress.
 *
 * Supports `?fresh=1` and legacy `?guest=1`.
 */
export function OnboardingPersonalizationFresh() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFresh =
    searchParams.get("fresh") === "1" || searchParams.get("guest") === "1";

  useLayoutEffect(() => {
    if (!isFresh) return;
    clearUserSession();
    router.replace(ONBOARDING_START_PATH);
  }, [isFresh, router]);

  return null;
}
