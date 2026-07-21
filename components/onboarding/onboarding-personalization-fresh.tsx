"use client";

import { useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearUserSession, ONBOARDING_START_PATH } from "@/lib/onboarding/ghost-session";

/**
 * Clears only the user session so "Get started" always requires the age gate,
 * without wiping wallet, academy, or skill progress.
 */
export function OnboardingPersonalizationFresh() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFresh = searchParams.get("fresh") === "1";

  useLayoutEffect(() => {
    if (!isFresh) return;
    clearUserSession();
    router.replace(ONBOARDING_START_PATH);
  }, [isFresh, router]);

  return null;
}
