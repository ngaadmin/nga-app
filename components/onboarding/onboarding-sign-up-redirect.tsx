"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DASHBOARD_ACADEMY_PATH,
  readUserSession,
} from "@/lib/onboarding/ghost-session";

/** Registered users skip signup — ghost sessions may convert here. */
export function OnboardingSignUpRedirect() {
  const router = useRouter();

  useEffect(() => {
    const session = readUserSession();
    if (session?.accessMode === "registered") {
      router.replace(DASHBOARD_ACADEMY_PATH);
    }
  }, [router]);

  return null;
}
