"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NextGenAchieversWordmark } from "@/components/brand/nextgen-achievers-wordmark";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { ONBOARDING_START_PATH } from "@/lib/onboarding/guest-session";
import { cn } from "@/lib/utils/cn";

export function OnboardingHeader() {
  const pathname = usePathname();

  if (pathname === ONBOARDING_START_PATH) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 border-b border-nga-mist bg-white px-6 py-4",
        LAYER_CLASS.raised,
      )}
    >
      <div className="flex w-full items-center justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center focus-visible:outline-offset-4"
          aria-label="NextGenAchievers home"
        >
          <NextGenAchieversWordmark header />
        </Link>
      </div>
    </header>
  );
}
