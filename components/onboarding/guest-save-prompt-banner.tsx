"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  guestSavePromptBodyClass,
  guestSavePromptCardClass,
  guestSavePromptPrimaryClass,
  guestSavePromptSecondaryClass,
} from "@/components/onboarding/guest-save-prompt-styles";
import { LAYER_CLASS } from "@/lib/ui/layers";
import {
  dismissGuestSaveBanner,
  GUEST_SAVE_NOT_NOW_LABEL,
  GUEST_SAVE_PROGRESS_LABEL,
  GUEST_SAVE_PROMPT_COPY,
  GUEST_SAVE_SIGN_UP_HREF,
  guestSaveBannerForCelebration,
  type GuestSaveBannerMoment,
} from "@/lib/onboarding/guest-save-prompt";
import { cn } from "@/lib/utils/cn";

type GuestSavePromptBannerProps = {
  claimId: string;
  isNewBadge: boolean;
  isModuleOrLevelFinish: boolean;
  moduleNumber?: number;
  lessonNumber?: number;
  /** When false, the celebration is closed and the banner stays hidden. */
  active?: boolean;
  className?: string;
};

export function GuestSavePromptBanner({
  claimId,
  isNewBadge,
  isModuleOrLevelFinish,
  moduleNumber,
  lessonNumber,
  active = true,
  className,
}: GuestSavePromptBannerProps) {
  const [moment, setMoment] = useState<GuestSaveBannerMoment | null>(null);

  useEffect(() => {
    if (!active) return;
    setMoment(
      guestSaveBannerForCelebration({
        claimId,
        isNewBadge,
        isModuleOrLevelFinish,
        moduleNumber,
        lessonNumber,
      }),
    );
  }, [active, claimId, isModuleOrLevelFinish, isNewBadge, lessonNumber, moduleNumber]);

  if (!active || !moment) return null;

  return (
    <div
      className={cn(guestSavePromptCardClass, LAYER_CLASS.raised, className)}
      data-guest-save-prompt="banner"
      data-guest-save-moment={moment}
      role="region"
      aria-label="Save your progress"
    >
      <p className={guestSavePromptBodyClass}>{GUEST_SAVE_PROMPT_COPY}</p>
      <div className="mt-3 flex flex-col gap-2">
        <Link href={GUEST_SAVE_SIGN_UP_HREF} className={guestSavePromptPrimaryClass}>
          {GUEST_SAVE_PROGRESS_LABEL}
        </Link>
        <button
          type="button"
          className={guestSavePromptSecondaryClass}
          onClick={() => {
            dismissGuestSaveBanner(claimId);
            setMoment(null);
          }}
        >
          {GUEST_SAVE_NOT_NOW_LABEL}
        </button>
      </div>
    </div>
  );
}
