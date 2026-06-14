"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DASHBOARD_ACADEMY_PATH,
  readGhostAccessSession,
} from "@/lib/onboarding/ghost-session";

/** Sends completed ghost sessions straight to the Academy map. */
export function OnboardingSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (readGhostAccessSession()) {
      router.replace(DASHBOARD_ACADEMY_PATH);
    }
  }, [router]);

  return null;
}
